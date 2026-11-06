"use server";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { completeCatatJson, listCatatAiProviders } from "@/features/transactions/catat-ai-client";
import { lookupItemMeaning } from "@/features/transactions/catat-lookup";
import { parseCatatLocally, pickCategory } from "@/features/transactions/catat-parse";
import { formatLearnedFacts, listLearnedFacts, recallCategoryId } from "@/features/transactions/catat-recall";

const KNOWN_CONFIDENCE = 4;

export type CatatFinanceQuestion = {
  kind: "balance" | "category" | "week" | "person" | "list";
  categoryName: string | null;
  week: number | null;
  person: "istri" | "suami" | null;
  listTerm: string | null;
};

export type CatatDraftType = "expense" | "top_up" | "transfer";

const parseSchema = z.object({
  prompt: z.string().trim().min(2, "Tulis dulu apa yang mau dicatat.").max(200),
  wallets: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
  categories: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
  sourceAccounts: z.array(z.object({ id: z.string(), name: z.string() })).optional()
});

export type ParsedCatatDraft = {
  error: string | null;
  amount: string | null;
  walletId: string | null;
  categoryId: string | null;
  description: string | null;
  note: string | null;
  needsConfirmation: boolean;
  intent:
    | "draft"
    | "clarify"
    | "finance"
    | "manage_category"
    | "manage_wallet"
    | "delete_transaction"
    | "edit_transaction"
    | "chat";
  reply: string | null;
  newCategoryName: string | null;
  type: CatatDraftType;
  fromWalletId: string | null;
  toWalletId: string | null;
  sourceAccountId: string | null;
  walletAction: "create" | "deactivate" | null;
  walletName: string | null;
  initialBalance: string | null;
  deleteTerm: string | null;
  deleteBulk: boolean;
  deleteWalletNames: string[] | null;
  editTerm: string | null;
  editAmount: string | null;
  editCategoryName: string | null;
  editWalletName: string | null;
  finance: CatatFinanceQuestion | null;
  /** "ai" kalau jawaban ini hasil model remote, "local" kalau fallback lokal. */
  source: "ai" | "local";
};

function emptyParsed(): ParsedCatatDraft {
  return {
    error: null,
    amount: null,
    walletId: null,
    categoryId: null,
    description: null,
    note: null,
    needsConfirmation: false,
    intent: "chat",
    reply: null,
    newCategoryName: null,
    type: "expense",
    fromWalletId: null,
    toWalletId: null,
    sourceAccountId: null,
    walletAction: null,
    walletName: null,
    initialBalance: null,
    deleteTerm: null,
    deleteBulk: false,
    deleteWalletNames: null,
    editTerm: null,
    editAmount: null,
    editCategoryName: null,
    editWalletName: null,
    finance: null,
    source: "local"
  };
}

function parseJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function loadCatatAgentPrompt() {
  const dir = join(process.cwd(), "src/features/transactions");
  const [agent, skill, memory] = await Promise.all([
    readFile(join(dir, "agent.md"), "utf8"),
    readFile(join(dir, "skill.md"), "utf8"),
    readFile(join(dir, "memory.md"), "utf8").catch(() => "")
  ]);

  return [agent, skill, memory.trim() ? memory : ""].filter(Boolean).join("\n\n");
}

function categoryName(categories: Array<{ id: string; name: string }>, id: string | null) {
  return categories.find((category) => category.id === id)?.name ?? null;
}

function remoteString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function remoteDigits(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).replace(/[^\d]/g, "") || null;
}

function remoteFinanceQuestion(value: unknown): CatatFinanceQuestion | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const kind =
    raw.kind === "category" || raw.kind === "week" || raw.kind === "person" || raw.kind === "list"
      ? raw.kind
      : raw.kind === "balance"
        ? "balance"
        : null;

  if (!kind) {
    return null;
  }

  const week = remoteDigits(raw.week);

  return {
    kind,
    categoryName: remoteString(raw.categoryName, 60),
    week: week && Number(week) >= 1 && Number(week) <= 4 ? Number(week) : null,
    person: raw.person === "istri" || raw.person === "suami" ? raw.person : null,
    listTerm: remoteString(raw.listTerm, 80)
  };
}

async function parseWithRemoteAi(input: {
  prompt: string;
  wallets: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  sourceAccounts: Array<{ id: string; name: string }>;
  lookupNote: string | null;
  learned: string;
  history: Array<{ role: "user" | "bot"; text: string }>;
}) {
  if (listCatatAiProviders().length === 0) {
    return null;
  }

  const soul = await loadCatatAgentPrompt();
  const walletList = input.wallets.map((wallet) => `${wallet.id} = ${wallet.name}`).join("\n");
  const categoryList = input.categories
    .map((category) => `${category.id} = ${category.name}`)
    .join("\n");
  const sourceAccountList = input.sourceAccounts.length
    ? `\n\nSumber dana (top up):\n${input.sourceAccounts.map((account) => `${account.id} = ${account.name}`).join("\n")}`
    : "";
  const lookupBlock = input.lookupNote ? `\n\nHasil pencarian:\n${input.lookupNote}` : "";
  const learnedBlock = input.learned ? `\n\nYang sudah diingat dari chat sebelumnya:\n${input.learned}` : "";
  const historyBlock =
    input.history.length > 0
      ? `\n\nPercakapan tadi:\n${input.history
          .slice(-8)
          .map((turn) => `${turn.role === "user" ? "User" : "Asisten"}: ${turn.text}`)
          .join("\n")}`
      : "";
  const content = await completeCatatJson([
    { role: "system", content: soul },
    {
      role: "user",
      content: `Wallet:\n${walletList}\n\nKategori:\n${categoryList}${sourceAccountList}${learnedBlock}${historyBlock}\n\nCatatan user: ${input.prompt}${lookupBlock}`
    }
  ]);

  return parseJsonObject(content ?? "");
}

export async function resolveCatatDraft(input: {
  prompt: string;
  wallets: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  sourceAccounts?: Array<{ id: string; name: string }>;
  history?: Array<{ role: "user" | "bot"; text: string }>;
}): Promise<ParsedCatatDraft> {
  const parsed = parseSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ...emptyParsed(),
      error: parsed.error.issues[0]?.message ?? "Input AI belum lengkap."
    };
  }

  const sourceAccounts = parsed.data.sourceAccounts ?? [];
  const local = parseCatatLocally(parsed.data.prompt, parsed.data.wallets, parsed.data.categories);
  let categoryId = local.categoryId;
  let note: string | null = null;
  let needsConfirmation = false;
  let lookupNote: string | null = null;
  const learnedRows = await listLearnedFacts();
  const recalled = await recallCategoryId(local.queryTerm || local.description);

  if (recalled && parsed.data.categories.some((category) => category.id === recalled.value)) {
    categoryId = recalled.value;
    note = `Ingat dari percakapan tadi: ${recalled.label}.`;
    needsConfirmation = false;
  } else if (local.confidence < KNOWN_CONFIDENCE && local.queryTerm) {
    const hit = await lookupItemMeaning(local.queryTerm);

    if (hit) {
      categoryId = pickCategory(parsed.data.categories, hit.bucket);
      lookupNote = `${hit.title}: ${hit.extract}`;
      note = `Dicek dulu: ${hit.title} = ${hit.reason} → ${categoryName(parsed.data.categories, categoryId)}`;
      needsConfirmation = hit.confidence < 8;
    } else {
      needsConfirmation = true;
      note = "Belum yakin kategori. Nominal diisi, cek chip kategori di bawah.";
    }
  }

  const needsAssistant =
    !local.amount || local.confidence < KNOWN_CONFIDENCE || needsConfirmation || Boolean(input.history?.length);

  if (listCatatAiProviders().length > 0 && !recalled && needsAssistant) {
    try {
      const remote = await parseWithRemoteAi({
        prompt: parsed.data.prompt,
        wallets: parsed.data.wallets,
        categories: parsed.data.categories,
        sourceAccounts,
        lookupNote,
        learned: formatLearnedFacts(learnedRows),
        history: input.history ?? []
      });

      if (remote) {
        const amountDigits = remoteDigits(remote.amount) ?? local.amount?.replace(/[^\d]/g, "") ?? "";
        const walletId = parsed.data.wallets.some((wallet) => wallet.id === remote.walletId)
          ? String(remote.walletId)
          : local.walletId;
        const fromWalletId = parsed.data.wallets.some((wallet) => wallet.id === remote.fromWalletId)
          ? String(remote.fromWalletId)
          : null;
        const toWalletId = parsed.data.wallets.some((wallet) => wallet.id === remote.toWalletId)
          ? String(remote.toWalletId)
          : null;
        const sourceAccountId = sourceAccounts.some((account) => account.id === remote.sourceAccountId)
          ? String(remote.sourceAccountId)
          : null;
        const remoteCategory = parsed.data.categories.some((category) => category.id === remote.categoryId)
          ? String(remote.categoryId)
          : categoryId;
        const description =
          typeof remote.description === "string" && remote.description.trim()
            ? remote.description.trim()
            : local.description;
        const unsure = remote.unsure === true;
        const remoteType =
          remote.type === "top_up" || remote.type === "transfer" ? remote.type : ("expense" as const);

        const intent = [
          "clarify",
          "finance",
          "manage_category",
          "manage_wallet",
          "delete_transaction",
          "edit_transaction",
          "chat",
          "draft"
        ].includes(String(remote.intent))
          ? (String(remote.intent) as ParsedCatatDraft["intent"])
          : unsure
            ? "clarify"
            : "draft";
        const reply = remoteString(remote.reply, 300);
        const newCategoryName = remoteString(remote.newCategoryName, 60);
        const walletAction =
          remote.walletAction === "create" || remote.walletAction === "deactivate"
            ? (remote.walletAction as "create" | "deactivate")
            : null;
        const editChanges =
          remote.editChanges && typeof remote.editChanges === "object"
            ? (remote.editChanges as Record<string, unknown>)
            : {};

        if (
          intent === "finance" ||
          intent === "chat" ||
          intent === "manage_category" ||
          intent === "manage_wallet" ||
          intent === "delete_transaction" ||
          intent === "edit_transaction" ||
          amountDigits ||
          remoteType !== "expense"
        ) {
          return {
            error: null,
            amount: amountDigits ? new Intl.NumberFormat("id-ID").format(Number(amountDigits)) : local.amount,
            walletId,
            categoryId: remoteCategory,
            description,
            note: note ?? (unsure ? "Masih ragu, cek kategorinya." : null),
            needsConfirmation: unsure || needsConfirmation || intent === "clarify",
            intent,
            reply,
            newCategoryName,
            type: remoteType,
            fromWalletId,
            toWalletId,
            sourceAccountId,
            walletAction,
            walletName: remoteString(remote.walletName, 60),
            initialBalance: remoteDigits(remote.initialBalance),
            deleteTerm: remoteString(remote.deleteTerm, 80),
            deleteBulk: remote.deleteBulk === true,
            deleteWalletNames: Array.isArray(remote.deleteWalletNames)
              ? remote.deleteWalletNames
                  .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
                  .slice(0, 3)
                  .map((name) => name.trim().slice(0, 60))
              : null,
            editTerm: remoteString(remote.editTerm, 80),
            editAmount: remoteDigits(editChanges.amount),
            editCategoryName: remoteString(editChanges.categoryName, 60),
            editWalletName: remoteString(editChanges.walletName, 60),
            finance: remoteFinanceQuestion(remote.finance),
            source: "ai"
          };
        }
      }
    } catch {
      // keep lookup/local draft
    }
  }

  if (local.amount) {
    const unsure = !recalled && (local.confidence < KNOWN_CONFIDENCE || needsConfirmation);

    return {
      ...emptyParsed(),
      amount: local.amount,
      walletId: local.walletId,
      categoryId,
      description: local.description,
      note: unsure ? note : null,
      needsConfirmation: unsure,
      intent: unsure ? "clarify" : "draft"
    };
  }

  return {
    ...emptyParsed(),
    walletId: local.walletId,
    categoryId,
    description: local.description,
    note,
    reply:
      "Bisa. Catat pengeluaran, cek saldo, tanya resep, atau obat yang biasa di rumah. Kalau mau catat, kasih nominalnya ya."
  };
}

export async function parseCatatDraftAction(input: {
  prompt: string;
  wallets: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}): Promise<ParsedCatatDraft> {
  await requireUser();
  return resolveCatatDraft(input);
}
