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

const parseSchema = z.object({
  prompt: z.string().trim().min(2, "Tulis dulu apa yang mau dicatat.").max(200),
  wallets: z.array(z.object({ id: z.string(), name: z.string() })).min(1),
  categories: z.array(z.object({ id: z.string(), name: z.string() })).min(1)
});

export type ParsedCatatDraft = {
  error: string | null;
  amount: string | null;
  walletId: string | null;
  categoryId: string | null;
  description: string | null;
  note: string | null;
  needsConfirmation: boolean;
  intent: "draft" | "clarify" | "finance" | "manage_category" | "chat";
  reply: string | null;
  newCategoryName: string | null;
};

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

async function parseWithRemoteAi(input: {
  prompt: string;
  wallets: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
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
      content: `Wallet:\n${walletList}\n\nKategori:\n${categoryList}${learnedBlock}${historyBlock}\n\nCatatan user: ${input.prompt}${lookupBlock}`
    }
  ]);

  return parseJsonObject(content ?? "");
}

export async function resolveCatatDraft(input: {
  prompt: string;
  wallets: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  history?: Array<{ role: "user" | "bot"; text: string }>;
}): Promise<ParsedCatatDraft> {
  const parsed = parseSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input AI belum lengkap.",
      amount: null,
      walletId: null,
      categoryId: null,
      description: null,
      note: null,
      needsConfirmation: false,
      intent: "chat",
      reply: null,
      newCategoryName: null
    };
  }

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
        lookupNote,
        learned: formatLearnedFacts(learnedRows),
        history: input.history ?? []
      });

      if (remote) {
        const amountDigits =
          String(remote.amount ?? "").replace(/[^\d]/g, "") || local.amount?.replace(/[^\d]/g, "") || "";
        const walletId = parsed.data.wallets.some((wallet) => wallet.id === remote.walletId)
          ? String(remote.walletId)
          : local.walletId;
        const remoteCategory = parsed.data.categories.some((category) => category.id === remote.categoryId)
          ? String(remote.categoryId)
          : categoryId;
        const description =
          typeof remote.description === "string" && remote.description.trim()
            ? remote.description.trim()
            : local.description;
        const unsure = remote.unsure === true;

        const intent =
          remote.intent === "clarify" ||
          remote.intent === "finance" ||
          remote.intent === "manage_category" ||
          remote.intent === "chat" ||
          remote.intent === "draft"
            ? remote.intent
            : unsure
              ? "clarify"
              : "draft";
        const reply = typeof remote.reply === "string" && remote.reply.trim() ? remote.reply.trim() : null;
        const newCategoryName =
          typeof remote.newCategoryName === "string" && remote.newCategoryName.trim()
            ? remote.newCategoryName.trim()
            : null;

        if (intent === "finance" || intent === "chat" || intent === "manage_category" || amountDigits) {
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
            newCategoryName
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
      error: null,
      amount: local.amount,
      walletId: local.walletId,
      categoryId,
      description: local.description,
      note: unsure ? note : null,
      needsConfirmation: unsure,
      intent: unsure ? "clarify" : "draft",
      reply: null,
      newCategoryName: null
    };
  }

  return {
    error: null,
    amount: null,
    walletId: local.walletId,
    categoryId,
    description: local.description,
    note,
    needsConfirmation: false,
    intent: "chat",
    reply:
      "Bisa. Catat pengeluaran, cek saldo, tanya resep, atau obat yang biasa di rumah. Kalau mau catat, kasih nominalnya ya.",
    newCategoryName: null
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
