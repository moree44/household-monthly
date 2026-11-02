"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getDashboardData } from "@/features/dashboard/data";
import { getMonthContext } from "@/lib/date/month";
import { APP_TIME_ZONE, formatAppDateInputValue, parseAppDateInput } from "@/lib/date/timezone";
import { formatRupiah } from "@/lib/format/currency";
import { resolveCatatDraft, type ParsedCatatDraft } from "@/features/transactions/ai-actions";
import {
  appendChatTurns,
  loadChatHistory,
  rememberCategory,
  type ChatHistoryTurn
} from "@/features/transactions/catat-recall";

export type ChatDraft = {
  amount: string;
  walletId: string;
  categoryId: string;
  description: string;
};

export type ChatChoice = {
  label: string;
  categoryId: string;
};

export type ChatResponse = {
  reply: string;
  saved: boolean;
  draft: ChatDraft | null;
  needsConfirmation: boolean;
  choices: ChatChoice[];
};

type Option = { id: string; name: string };

async function loadCatatOptions() {
  const [wallets, categories] = await Promise.all([
    prisma.wallet.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true }
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true }
    })
  ]);

  return { wallets, categories };
}

function draftFromParsed(parsed: ParsedCatatDraft): ChatDraft | null {
  if (!parsed.amount || !parsed.walletId || !parsed.categoryId) {
    return null;
  }

  return {
    amount: parsed.amount,
    walletId: parsed.walletId,
    categoryId: parsed.categoryId,
    description: parsed.description ?? ""
  };
}

function emptyChat(reply: string): ChatResponse {
  return {
    reply,
    saved: false,
    draft: null,
    needsConfirmation: false,
    choices: []
  };
}

function isSpendingQuery(text: string) {
  return (
    !/\d/.test(text) &&
    /(abis|habis|total|pengeluaran|berapa|summary|ringkas|saldo|keuangan|dompet|wallet)/i.test(text)
  );
}

function isAddCategory(text: string) {
  return /tambah(kan)?\s+kategori/i.test(text);
}

function isAffirmative(text: string) {
  return /^(ya|iya|ok|oke|y|simpan|benar|betul|iyo|okey)\b/i.test(text.trim());
}

function categoryNameFromAddCommand(text: string) {
  const match = text.match(/tambah(kan)?\s+kategori\s+(.+)/i);
  return match?.[2]?.replace(/[.?!]+$/, "").trim() || "";
}

function matchCategory(text: string, categories: Option[]) {
  const normalized = text.trim().toLowerCase();

  return (
    categories.find((category) => category.name.toLowerCase() === normalized) ??
    categories.find((category) => normalized.includes(category.name.toLowerCase())) ??
    categories.find((category) => {
      const first = category.name.toLowerCase().split(/\s+/)[0];
      return first.length > 3 && normalized.includes(first);
    }) ??
    null
  );
}

function categoryChoices(categories: Option[], guessedId: string | null): ChatChoice[] {
  const guessed = categories.find((category) => category.id === guessedId);
  const extras = categories.filter((category) => {
    if (category.id === guessedId) {
      return false;
    }

    return /dapur|food|drink|daily|others/i.test(category.name);
  });

  return [guessed, ...extras]
    .filter((category): category is Option => Boolean(category))
    .slice(0, 3)
    .map((category) => ({ label: category.name, categoryId: category.id }));
}

async function answerSpendingQuery(): Promise<string> {
  const month = getMonthContext();
  const dashboard = await getDashboardData(month);
  const walletLines = dashboard.wallets
    .slice(0, 4)
    .map((wallet) => `${wallet.name} ${formatRupiah(wallet.balance)}`)
    .join(", ");

  return `${month.label}: saldo ${formatRupiah(dashboard.totalWalletBalance)}. Pengeluaran ${formatRupiah(dashboard.operationalExpense)}, top up ${formatRupiah(dashboard.monthlyTopUp)}. ${walletLines}. Mau catat yang baru?`;
}

async function createCategoryByName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();

  if (cleaned.length < 2) {
    return { error: "Nama kategorinya terlalu pendek.", category: null as Option | null };
  }

  const existing = await prisma.category.findUnique({
    where: { name: cleaned },
    select: { id: true, name: true, isActive: true }
  });

  if (existing?.isActive) {
    return { error: null, category: { id: existing.id, name: existing.name } };
  }

  if (existing && !existing.isActive) {
    return { error: `Kategori ${cleaned} ada di daftar nonaktif. Aktifkan di Kelola Kategori.`, category: null };
  }

  const maxSortOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const created = await prisma.category.create({
    data: {
      name: cleaned,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1
    },
    select: { id: true, name: true }
  });

  revalidatePath("/settings/categories");
  revalidatePath("/expenses/new");

  return { error: null, category: created };
}

async function saveExpenseDraft(
  userId: string,
  draft: ChatDraft,
  wallets: Option[],
  categories: Option[]
) {
  const amount = draft.amount.replace(/[^\d]/g, "");

  await prisma.transaction.create({
    data: {
      type: "expense",
      transactionDate: parseAppDateInput(formatAppDateInputValue(new Date())) ?? new Date(),
      amount,
      walletId: draft.walletId,
      categoryId: draft.categoryId,
      subCategoryId: null,
      description: draft.description || null,
      createdById: userId
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/profile");

  const walletName = wallets.find((wallet) => wallet.id === draft.walletId)?.name ?? "wallet";
  const categoryLabel = categories.find((category) => category.id === draft.categoryId)?.name ?? "kategori";

  await rememberCategory({
    userId,
    term: draft.description,
    categoryId: draft.categoryId,
    label: categoryLabel
  });

  return `Sudah tercatat: ${draft.description || "Pengeluaran"} ${formatRupiah(Number(amount))} · ${categoryLabel} · ${walletName}.`;
}

export async function loadCatatChatHistoryAction(): Promise<ChatHistoryTurn[]> {
  const currentUser = await requireUser();
  return loadChatHistory(currentUser.id);
}

function wibHour(date = new Date()) {
  const hourPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23"
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;

  return Number(hourPart ?? "0");
}

export async function getChatGreetingAction() {
  const currentUser = await requireUser();
  const hour = wibHour();
  const name = currentUser.displayName.split(/\s+/)[0] || currentUser.displayName;
  const hello =
    hour >= 4 && hour < 11
      ? `Good morning, ${name}.`
      : hour < 15
        ? `Siang, ${name}.`
        : hour < 18
          ? `Sore, ${name}.`
          : `Malam, ${name}.`;

  return `${hello} Ada yang mau dicatat, ditanya resep, obat, atau cek keuangan?`;
}

export async function sendCatatChatAction(
  prompt: string,
  confirmDraft?: ChatDraft | null,
  history: ChatHistoryTurn[] = []
): Promise<ChatResponse> {
  const currentUser = await requireUser();
  const text = prompt.trim();

  async function rememberTurn(response: ChatResponse) {
    await appendChatTurns(currentUser.id, [
      ...(text ? [{ role: "user" as const, text }] : []),
      { role: "bot", text: response.reply }
    ]);
    return response;
  }

  if (text.length < 1 && !confirmDraft) {
    return rememberTurn(emptyChat("Tulis pengeluaran, atau tanya saldo. Contoh: gorengan 5k, bawang 8rb, saldo bulan ini."));
  }

  const { wallets, categories } = await loadCatatOptions();

  if (confirmDraft) {
    if (!text || isAffirmative(text) || text === "ok") {
      const reply = await saveExpenseDraft(currentUser.id, confirmDraft, wallets, categories);
      return rememberTurn({ reply, saved: true, draft: null, needsConfirmation: false, choices: [] });
    }

    const picked = matchCategory(text, categories);

    if (picked) {
      const reply = await saveExpenseDraft(
        currentUser.id,
        { ...confirmDraft, categoryId: picked.id },
        wallets,
        categories
      );
      return rememberTurn({ reply, saved: true, draft: null, needsConfirmation: false, choices: [] });
    }

    if (isAddCategory(text)) {
      const created = await createCategoryByName(categoryNameFromAddCommand(text) || text);
      if (created.category) {
        const reply = await saveExpenseDraft(
          currentUser.id,
          { ...confirmDraft, categoryId: created.category.id },
          wallets,
          [...categories, created.category]
        );
        return rememberTurn({ reply, saved: true, draft: null, needsConfirmation: false, choices: [] });
      }

      return rememberTurn(emptyChat(created.error ?? "Kategori belum bisa ditambah."));
    }
  }

  if (isAddCategory(text)) {
    const created = await createCategoryByName(categoryNameFromAddCommand(text));
    if (created.category) {
      return rememberTurn(emptyChat(`Kategori ${created.category.name} sudah saya tambah. Mau dipakai catat yang mana?`));
    }

    return rememberTurn(emptyChat(created.error ?? "Kategori belum bisa ditambah."));
  }

  if (isSpendingQuery(text)) {
    return rememberTurn(emptyChat(await answerSpendingQuery()));
  }

  const parsed = await resolveCatatDraft({ prompt: text, wallets, categories, history });

  if (parsed.intent === "finance") {
    return rememberTurn(emptyChat(parsed.reply ?? (await answerSpendingQuery())));
  }

  if (parsed.intent === "chat" && parsed.reply && !parsed.amount) {
    return rememberTurn(emptyChat(parsed.reply));
  }

  if (parsed.intent === "manage_category" && parsed.newCategoryName) {
    const created = await createCategoryByName(parsed.newCategoryName);
    if (created.category) {
      return rememberTurn(emptyChat(parsed.reply ?? `Kategori ${created.category.name} sudah ditambah.`));
    }

    return rememberTurn(emptyChat(created.error ?? "Kategori belum bisa ditambah."));
  }

  const draft = draftFromParsed(parsed);

  if (!draft) {
    return rememberTurn(
      emptyChat(
        parsed.reply ??
          parsed.error ??
          "Bisa. Catat uang, tanya resep, obat rumah, atau saldo. Kalau catat, kasih nominalnya."
      )
    );
  }

  const categoryLabel = categories.find((category) => category.id === draft.categoryId)?.name ?? "kategori";
  const money = formatRupiah(Number(draft.amount.replace(/[^\d]/g, "")));
  const item = draft.description || "Pengeluaran";

  if (parsed.needsConfirmation || parsed.intent === "clarify") {
    const choices = categoryChoices(categories, draft.categoryId);
    const reply =
      parsed.reply ??
      `${item} ${money}. Ini ${categoryLabel} ya? Kalau bukan, pilih di bawah.`;

    return rememberTurn({
      reply,
      saved: false,
      draft,
      needsConfirmation: true,
      choices
    });
  }

  const reply = await saveExpenseDraft(currentUser.id, draft, wallets, categories);
  return rememberTurn({ reply, saved: true, draft: null, needsConfirmation: false, choices: [] });
}
