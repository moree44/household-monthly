"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getDashboardData } from "@/features/dashboard/data";
import { getMonthContext } from "@/lib/date/month";
import { APP_TIME_ZONE, formatAppDateInputValue, parseAppDateInput } from "@/lib/date/timezone";
import { formatRupiah } from "@/lib/format/currency";
import {
  matchOptionByName,
  parseDeleteCommand,
  parseEditCommand,
  parseFinanceQuestion,
  parseTransferIntent,
  parseWalletCommand,
  type DeleteCommand,
  type EditCommand,
  type FinanceQuestion,
  type TransferIntent,
  type WalletCommand
} from "@/features/transactions/catat-parse";
import { resolveCatatDraft, type ParsedCatatDraft } from "@/features/transactions/ai-actions";
import { listCatatAiProviders } from "@/features/transactions/catat-ai-client";
import {
  appendChatTurns,
  loadChatHistory,
  rememberCategory,
  type ChatHistoryTurn
} from "@/features/transactions/catat-recall";
import {
  answerCategoryTotal,
  answerPersonTotal,
  answerTransactionList,
  answerWeekTotal,
  applyTransactionEdit,
  BULK_DELETE_LIMIT,
  createChatWallet,
  deactivateChatWallet,
  findTransactionMatches,
  findWalletTransactions,
  getTransactionMatchById,
  resetWallets,
  saveTopUpDraft,
  saveTransferDraft,
  softDeleteTransactions,
  type TransactionEditChanges
} from "@/features/transactions/chat-helpers";

export type ExpenseDraft = {
  amount: string;
  walletId: string;
  categoryId: string;
  description: string;
};

export type ChatPendingAction =
  | { kind: "save_expense"; draft: ExpenseDraft }
  | {
      kind: "save_top_up";
      draft: {
        amount: string;
        walletId: string | null;
        sourceAccountId: string | null;
        description: string | null;
      };
    }
  | {
      kind: "save_transfer";
      draft: {
        amount: string;
        fromWalletId: string | null;
        toWalletId: string | null;
        description: string | null;
      };
    }
  | {
      kind: "delete_transactions";
      transactionIds: string[];
      summary: string;
      requirePhrase?: string;
    }
  | {
      kind: "edit_transaction";
      transactionId: string;
      label: string;
      changes: TransactionEditChanges;
    }
  | { kind: "create_wallet"; name: string; initialBalance: string | null }
  | { kind: "deactivate_wallet"; walletId: string; name: string }
  | {
      kind: "reset_wallets";
      walletIds: string[];
      walletNames: string[];
      requirePhrase: string;
    };

export type ChatChoiceKind =
  | "category"
  | "transaction"
  | "delete_all"
  | "source_account"
  | "from_wallet"
  | "to_wallet"
  | "wallet"
  | "retry";

export type ChatChoice = {
  label: string;
  value: string;
  kind: ChatChoiceKind;
};

export type PickedChoice = {
  kind: ChatChoiceKind;
  value: string;
};

export type ChatResponse = {
  reply: string;
  pendingAction: ChatPendingAction | null;
  choices: ChatChoice[];
};

type Option = { id: string; name: string };

type CatatOptions = {
  wallets: Option[];
  categories: Option[];
  sourceAccounts: Option[];
};

// Gate lokal bukan dinding: matched=false berarti "verba kena tapi ga bisa
// dieksekusi" — boleh dilanjutkan ke AI buat arbitrase sebelum menyerah.
type GateOutcome = {
  response: ChatResponse;
  matched: boolean;
};

function gateMatched(response: ChatResponse): GateOutcome {
  return { response, matched: true };
}

function gateMissed(response: ChatResponse): GateOutcome {
  return { response, matched: false };
}

async function loadCatatOptions(): Promise<CatatOptions> {
  const [wallets, categories, sourceAccounts] = await Promise.all([
    prisma.wallet.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true }
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true }
    }),
    prisma.sourceAccount.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);

  return { wallets, categories, sourceAccounts };
}

function emptyChat(reply: string): ChatResponse {
  return { reply, pendingAction: null, choices: [] };
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
  return /^(ya|iya|ok|oke|y|simpan|benar|betul|iyo|okey|yakin|gas|lanjut|sip)\b/i.test(text.trim());
}

function isCancel(text: string) {
  return /^(batal|batalin|tidak|nggak|gak|jangan|cancel|no|stop)\b/i.test(text.trim());
}

function categoryNameFromAddCommand(text: string) {
  const match = text.match(/tambah(kan)?\s+kategori\s+(.+)/i);
  return match?.[2]?.replace(/[.?!]+$/, "").trim() || "";
}

function describePending(pending: ChatPendingAction) {
  switch (pending.kind) {
    case "save_expense":
    case "save_top_up":
    case "save_transfer":
      return "penyimpanan transaksi";
    case "delete_transactions":
      return "penghapusan catatan";
    case "edit_transaction":
      return "perubahan catatan";
    case "create_wallet":
      return "pembuatan wallet";
    case "deactivate_wallet":
      return "penonaktifan wallet";
  }
}

function walletChoices(wallets: Option[], kind: "from_wallet" | "to_wallet", excludeId?: string | null) {
  return wallets
    .filter((wallet) => wallet.id !== excludeId)
    .slice(0, 5)
    .map((wallet) => ({ label: wallet.name, value: wallet.id, kind }));
}

function sourceAccountChoices(accounts: Option[]) {
  return accounts.slice(0, 5).map((account) => ({ label: account.name, value: account.id, kind: "source_account" as const }));
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
    .map((category) => ({ label: category.name, value: category.id, kind: "category" as const }));
}

function digitsOnly(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.replace(/[^\d]/g, "") || null;
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

async function answerFinanceQuestionDetail(
  question: FinanceQuestion,
  options: CatatOptions
): Promise<ChatResponse> {
  const month = getMonthContext();

  switch (question.kind) {
    case "week": {
      if (!question.week) {
        return emptyChat(await answerSpendingQuery());
      }

      return emptyChat(await answerWeekTotal(month, question.week));
    }
    case "person":
      return emptyChat(await answerPersonTotal(month, question.person ?? "suami"));
    case "list":
      return emptyChat(await answerTransactionList(month, question.listTerm));
    case "category": {
      const category = question.categoryName
        ? matchOptionByName(question.categoryName, options.categories)
        : null;

      if (!category) {
        const dashboard = await getDashboardData(month);
        const top = dashboard.categorySummaries
          .slice(0, 3)
          .map((summary) => `${summary.name} ${formatRupiah(summary.amount)}`)
          .join(", ");

        return emptyChat(`Kategori "${question.categoryName ?? "?"}" ga ada di daftar. Terbesar bulan ini: ${top}.`);
      }

      return emptyChat(await answerCategoryTotal(month, category.id, category.name));
    }
    default:
      return emptyChat(await answerSpendingQuery());
  }
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
  draft: ExpenseDraft,
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

// ---------------------------------------------------------------------------
// Routers per intent
// ---------------------------------------------------------------------------

async function routeWalletCommand(command: WalletCommand, options: CatatOptions): Promise<ChatResponse> {
  if (command.action === "create") {
    if (!command.name) {
      return emptyChat("Nama walletnya apa? Contoh: tambah wallet Dompet Suami.");
    }

    const cleaned = command.name.replace(/\s+/g, " ").trim();
    const existing = await prisma.wallet.findUnique({
      where: { name: cleaned },
      select: { isActive: true }
    });

    if (existing?.isActive) {
      return emptyChat(`Wallet ${cleaned} sudah ada.`);
    }

    const balanceNote = command.initialBalanceDigits
      ? ` dengan saldo awal ${formatRupiah(Number(command.initialBalanceDigits))}`
      : "";

    return {
      reply: `Buat wallet ${cleaned}${balanceNote}?`,
      pendingAction: { kind: "create_wallet", name: cleaned, initialBalance: command.initialBalanceDigits },
      choices: []
    };
  }

  if (!command.name) {
    return emptyChat("Wallet yang mana yang mau dinonaktifin? Contoh: hapus wallet Dompet Suami.");
  }

  const candidates = options.wallets.filter((wallet) => {
    const name = wallet.name.toLowerCase();
    const needle = command.name!.toLowerCase();

    return name.includes(needle) || needle.includes(name);
  });

  if (candidates.length === 0) {
    return emptyChat(`Ga ada wallet aktif namanya "${command.name}".`);
  }

  if (candidates.length > 1) {
    return {
      reply: "Ada beberapa wallet yang cocok. Pilih yang mana?",
      pendingAction: null,
      choices: candidates.slice(0, 5).map((wallet) => ({
        label: wallet.name,
        value: JSON.stringify({ id: wallet.id, name: wallet.name }),
        kind: "wallet" as const
      }))
    };
  }

  const wallet = candidates[0];

  return {
    reply: `Nonaktifkan ${wallet.name}? Transaksinya tetap aman di History.`,
    pendingAction: { kind: "deactivate_wallet", walletId: wallet.id, name: wallet.name },
    choices: []
  };
}

async function routeDeleteCommand(
  command: DeleteCommand,
  options: CatatOptions,
  rawText?: string,
  aiWalletNames?: string[] | null
): Promise<GateOutcome> {
  const currentMonth = getMonthContext();
  const month = command.lastMonth ? getMonthContext(currentMonth.previousKey) : currentMonth;

  if (!command.term && !command.amountDigits) {
    // "bersihkan kas rumah tangga dan dompet istri" = reset wallet:
    // hapus semua transaksi yang menyentuh wallet itu (all-time) + nol-kan saldo awal.
    const mentionedWallets = options.wallets.filter((wallet) => {
      const name = wallet.name.toLowerCase();

      return (
        Boolean(rawText?.includes(name)) ||
        Boolean(
          aiWalletNames?.some((candidate) => {
            const needle = candidate.toLowerCase();
            return needle.includes(name) || name.includes(needle);
          })
        )
      );
    });

    if (command.bulk && mentionedWallets.length > 0) {
      const walletNames = mentionedWallets.map((wallet) => wallet.name);
      const summary = await findWalletTransactions(
        mentionedWallets.map((wallet) => wallet.id),
        5
      );

      return gateMatched({
        reply: `Ini menghapus SEMUA ${summary.totalCount} transaksi yang menyentuh ${walletNames.join(" & ")} sepanjang waktu (total ${formatRupiah(summary.totalAmount)}) DAN mengosongkan saldo awalnya jadi Rp 0. Ketik "ya bersihkan" buat lanjut.`,
        pendingAction: {
          kind: "reset_wallets",
          walletIds: mentionedWallets.map((wallet) => wallet.id),
          walletNames,
          requirePhrase: "ya bersihkan"
        },
        choices: []
      });
    }

    if (!command.bulk) {
      return gateMatched(
        emptyChat(
          "Hapus yang mana? Sebut namanya, contoh: hapus gorengan tadi. Kalau mau bersihin semuanya: hapus semua transaksi bulan ini. Atau reset wallet: bersihkan dompet istri."
        )
      );
    }

    const all = await findTransactionMatches({ term: null, amountDigits: null, month, take: BULK_DELETE_LIMIT });

    if (all.totalCount === 0) {
      return gateMatched(
        emptyChat(
          `Sudah bersih, ga ada transaksi di ${month.label}. Kalau maksudnya reset saldo wallet, sebut namanya: bersihkan kas rumah tangga.`
        )
      );
    }

    if (all.totalCount > BULK_DELETE_LIMIT) {
      return gateMatched(
        emptyChat(
          `Ada ${all.totalCount} transaksi di ${month.label} — kebanyakan buat dihapus sekaligus dari chat (maksimal ${BULK_DELETE_LIMIT}). Lewat History ya.`
        )
      );
    }

    return gateMatched({
      reply: `Ini menghapus SEMUA ${all.totalCount} transaksi di ${month.label} (total ${formatRupiah(all.totalAmount)}). Yakin? Konfirmasi dengan "ya hapus semua".`,
      pendingAction: {
        kind: "delete_transactions",
        transactionIds: all.rows.map((row) => row.id),
        summary: `SEMUA ${all.totalCount} transaksi ${month.label}`,
        requirePhrase: "ya hapus semua"
      },
      choices: []
    });
  }

  let matches = await findTransactionMatches({
    term: command.term,
    amountDigits: command.amountDigits,
    month,
    take: BULK_DELETE_LIMIT
  });

  if (matches.totalCount === 0 && command.term && command.amountDigits) {
    matches = await findTransactionMatches({ term: command.term, amountDigits: null, month, take: BULK_DELETE_LIMIT });
  }

  if (matches.totalCount === 0) {
    return gateMissed(
      emptyChat(
        `Ga ketemu catatan "${command.term}" di ${month.label}. Sebut jenisnya biar saya beresin, contoh: bersihin catatan gorengan.`
      )
    );
  }

  if (matches.totalCount === 1 || command.lastOnly) {
    const row = matches.rows[0];
    const prefix = command.lastOnly && matches.totalCount > 1 ? "Hapus yang terakhir: " : "Hapus ";

    return gateMatched({
      reply: `${prefix}${row.label}?`,
      pendingAction: {
        kind: "delete_transactions",
        transactionIds: [row.id],
        summary: row.label
      },
      choices: []
    });
  }

  const subject = command.term ? `"${command.term}"` : "yang dicari";

  if (command.bulk) {
    if (matches.totalCount > BULK_DELETE_LIMIT) {
      return gateMatched(
        emptyChat(
          `Ketemu ${matches.totalCount} catatan ${subject} — kebanyakan buat dihapus sekaligus dari chat (maksimal ${BULK_DELETE_LIMIT}). Lewat History ya.`
        )
      );
    }

    return gateMatched({
      reply: `Ketemu ${matches.totalCount} catatan ${subject}, total ${formatRupiah(matches.totalAmount)}. Hapus semuanya?`,
      pendingAction: {
        kind: "delete_transactions",
        transactionIds: matches.rows.map((row) => row.id),
        summary: `${matches.totalCount} catatan ${subject}`
      },
      choices: []
    });
  }

  const choices: ChatChoice[] = matches.rows
    .slice(0, 5)
    .map((row) => ({ label: row.label, value: row.id, kind: "transaction" as const }));

  if (command.term) {
    choices.push({
      label: `Hapus semua (${matches.totalCount})`,
      value: JSON.stringify({
        term: command.term,
        amountDigits: command.amountDigits,
        lastMonth: command.lastMonth
      }),
      kind: "delete_all"
    });
  }

  return gateMatched({
    reply: `Ketemu ${matches.totalCount} catatan ${subject} di ${month.label}. Pilih yang mana?`,
    pendingAction: null,
    choices
  });
}

async function routeEditCommand(command: EditCommand, options: CatatOptions): Promise<GateOutcome> {
  if (!command.term) {
    return gateMatched(emptyChat("Edit catatan yang mana? Contoh: edit gorengan jadi 10rb."));
  }

  const hasChanges = Boolean(
    command.amountDigits || command.categoryName || command.walletName || command.description
  );

  if (!hasChanges) {
    return gateMatched(
      emptyChat("Mau diubah jadi apa? Contoh: edit gorengan jadi 10rb, atau edit bawang kategorinya transport.")
    );
  }

  const month = getMonthContext();
  const matches = await findTransactionMatches({ term: command.term, amountDigits: null, month });

  if (matches.totalCount === 0) {
    return gateMissed(emptyChat(`Ga ketemu catatan "${command.term}" di ${month.label}.`));
  }

  if (matches.totalCount > 1) {
    return gateMissed(
      emptyChat(
        `Ketemu ${matches.totalCount} catatan "${command.term}". Sebut lebih spesifik biar ga salah ubah.`
      )
    );
  }

  const row = matches.rows[0];
  const changes: TransactionEditChanges = {};

  if (command.amountDigits) {
    changes.amountDigits = command.amountDigits;
  }

  if (command.categoryName) {
    const category = matchOptionByName(command.categoryName, options.categories);

    if (!category) {
      return gateMatched(
        emptyChat(`Kategori "${command.categoryName}" ga ada. Tambah dulu atau pilih yang sudah ada.`)
      );
    }

    changes.categoryId = category.id;
  }

  if (command.walletName) {
    const wallet = matchOptionByName(command.walletName, options.wallets);

    if (!wallet) {
      return gateMatched(emptyChat(`Wallet "${command.walletName}" ga ada.`));
    }

    changes.walletId = wallet.id;
  }

  if (command.description) {
    changes.description = command.description;
  }

  const parts: string[] = [];

  if (changes.amountDigits) {
    parts.push(`nominal jadi ${formatRupiah(Number(changes.amountDigits))}`);
  }

  if (changes.categoryId) {
    const name = options.categories.find((category) => category.id === changes.categoryId)?.name;
    parts.push(`kategori jadi ${name ?? "-"}`);
  }

  if (changes.walletId) {
    const name = options.wallets.find((wallet) => wallet.id === changes.walletId)?.name;
    parts.push(`wallet jadi ${name ?? "-"}`);
  }

  if (changes.description) {
    parts.push(`catatan jadi "${changes.description}"`);
  }

  return gateMatched({
    reply: `Ubah ${row.label} — ${parts.join(", ")}?`,
    pendingAction: {
      kind: "edit_transaction",
      transactionId: row.id,
      label: row.label,
      changes
    },
    choices: []
  });
}

async function completeTopUpDraft(
  amountDigits: string,
  walletId: string | null,
  sourceAccountId: string | null,
  description: string | null,
  options: CatatOptions
): Promise<ChatResponse> {
  const amount = new Intl.NumberFormat("id-ID").format(Number(amountDigits));
  const draft = { amount: amountDigits, walletId, sourceAccountId, description };
  const walletName = options.wallets.find((wallet) => wallet.id === walletId)?.name;
  const sourceName = options.sourceAccounts.find((account) => account.id === sourceAccountId)?.name;

  if (!walletId) {
    return {
      reply: `Top up ${amount} ke wallet mana?`,
      pendingAction: { kind: "save_top_up", draft },
      choices: walletChoices(options.wallets, "to_wallet")
    };
  }

  if (!sourceAccountId) {
    return {
      reply: `Top up ${amount} ke ${walletName} dari sumber dana mana?`,
      pendingAction: { kind: "save_top_up", draft },
      choices: sourceAccountChoices(options.sourceAccounts)
    };
  }

  return {
    reply: `Top up ${amount} ke ${walletName} dari ${sourceName}?`,
    pendingAction: { kind: "save_top_up", draft },
    choices: []
  };
}

async function completeTransferDraft(
  amountDigits: string,
  fromWalletId: string | null,
  toWalletId: string | null,
  description: string | null,
  options: CatatOptions
): Promise<ChatResponse> {
  const amount = new Intl.NumberFormat("id-ID").format(Number(amountDigits));
  const draft = { amount: amountDigits, fromWalletId, toWalletId, description };
  const fromName = options.wallets.find((wallet) => wallet.id === fromWalletId)?.name;
  const toName = options.wallets.find((wallet) => wallet.id === toWalletId)?.name;

  if (!fromWalletId) {
    return {
      reply: `Transfer ${amount} dari wallet mana?`,
      pendingAction: { kind: "save_transfer", draft },
      choices: walletChoices(options.wallets, "from_wallet")
    };
  }

  if (!toWalletId) {
    return {
      reply: `Transfer ${amount} dari ${fromName} ke wallet mana?`,
      pendingAction: { kind: "save_transfer", draft },
      choices: walletChoices(options.wallets, "to_wallet", fromWalletId)
    };
  }

  if (fromWalletId === toWalletId) {
    return emptyChat("Wallet asal dan tujuan harus beda. Contoh: transfer 100rb dari kas ke tabungan.");
  }

  return {
    reply: `Transfer ${amount} dari ${fromName} ke ${toName}?`,
    pendingAction: { kind: "save_transfer", draft },
    choices: []
  };
}

async function routeTransferIntent(intent: TransferIntent, options: CatatOptions): Promise<ChatResponse> {
  if (!intent.amountDigits) {
    return emptyChat(
      intent.type === "top_up"
        ? "Nominal top up-nya berapa? Contoh: top up 50rb dari BCA ke Kas."
        : "Nominal transfer-nya berapa? Contoh: transfer 100rb dari kas ke tabungan."
    );
  }

  if (intent.type === "top_up") {
    const wallet = intent.toName ? matchOptionByName(intent.toName, options.wallets) : null;
    const sourceAccount = intent.fromName ? matchOptionByName(intent.fromName, options.sourceAccounts) : null;

    if (intent.fromName && !sourceAccount) {
      return emptyChat(
        `Sumber dana "${intent.fromName}" ga ada di daftar. Yang tersedia: ${options.sourceAccounts
          .slice(0, 5)
          .map((account) => account.name)
          .join(", ")}.`
      );
    }

    return completeTopUpDraft(intent.amountDigits, wallet?.id ?? null, sourceAccount?.id ?? null, null, options);
  }

  const from = intent.fromName ? matchOptionByName(intent.fromName, options.wallets) : null;
  const to = intent.toName ? matchOptionByName(intent.toName, options.wallets) : null;

  if (intent.fromName && !from) {
    return emptyChat(`Wallet "${intent.fromName}" ga ada. Wallet aktif: ${options.wallets.map((wallet) => wallet.name).join(", ")}.`);
  }

  return completeTransferDraft(intent.amountDigits, from?.id ?? null, to?.id ?? null, null, options);
}

async function routeParsedDraft(
  userId: string,
  parsed: ParsedCatatDraft,
  options: CatatOptions
): Promise<ChatResponse> {
  if (parsed.intent === "finance") {
    if (parsed.finance && parsed.finance.kind !== "balance") {
      return answerFinanceQuestionDetail(parsed.finance, options);
    }

    return emptyChat(parsed.reply ?? (await answerSpendingQuery()));
  }

  if (parsed.intent === "chat" && parsed.reply && !parsed.amount) {
    return emptyChat(parsed.reply);
  }

  if (parsed.intent === "manage_category" && parsed.newCategoryName) {
    const created = await createCategoryByName(parsed.newCategoryName);

    if (created.category) {
      return emptyChat(parsed.reply ?? `Kategori ${created.category.name} sudah ditambah.`);
    }

    return emptyChat(created.error ?? "Kategori belum bisa ditambah.");
  }

  if (parsed.intent === "manage_wallet") {
    return routeWalletCommand(
      {
        action: parsed.walletAction ?? "create",
        name: parsed.walletName,
        initialBalanceDigits: parsed.initialBalance
      },
      options
    );
  }

  if (parsed.intent === "delete_transaction") {
    return (
      await routeDeleteCommand(
        {
          term: parsed.deleteTerm,
          bulk: parsed.deleteBulk,
          lastOnly: false,
          lastMonth: false,
          amountDigits: digitsOnly(parsed.amount)
        },
        options,
        undefined,
        parsed.deleteWalletNames
      )
    ).response;
  }

  if (parsed.intent === "edit_transaction") {
    return (
      await routeEditCommand(
        {
          term: parsed.editTerm,
          amountDigits: parsed.editAmount,
          categoryName: parsed.editCategoryName,
          walletName: parsed.editWalletName,
          description: null
        },
        options
      )
    ).response;
  }

  const amountDigits = digitsOnly(parsed.amount);

  if (parsed.type === "top_up" && amountDigits) {
    return completeTopUpDraft(amountDigits, parsed.walletId, parsed.sourceAccountId, parsed.description, options);
  }

  if (parsed.type === "transfer" && amountDigits) {
    return completeTransferDraft(amountDigits, parsed.fromWalletId, parsed.toWalletId, parsed.description, options);
  }

  if (!amountDigits || !parsed.walletId || !parsed.categoryId) {
    return emptyChat(
      parsed.reply ??
        parsed.error ??
        "Bisa. Catat uang, tanya resep, obat rumah, atau saldo. Kalau catat, kasih nominalnya."
    );
  }

  const draft: ExpenseDraft = {
    amount: amountDigits,
    walletId: parsed.walletId,
    categoryId: parsed.categoryId,
    description: parsed.description ?? ""
  };

  const categoryLabel = options.categories.find((category) => category.id === draft.categoryId)?.name ?? "kategori";
  const money = formatRupiah(Number(draft.amount));
  const item = draft.description || "Pengeluaran";

  if (parsed.needsConfirmation || parsed.intent === "clarify") {
    return {
      reply: parsed.reply ?? `${item} ${money}. Ini ${categoryLabel} ya? Kalau bukan, pilih di bawah.`,
      pendingAction: { kind: "save_expense", draft },
      choices: categoryChoices(options.categories, draft.categoryId)
    };
  }

  const reply = await saveExpenseDraft(userId, draft, options.wallets, options.categories);
  return { reply, pendingAction: null, choices: [] };
}

// ---------------------------------------------------------------------------
// Picked choice + pending execution
// ---------------------------------------------------------------------------

async function applyPickedChoice(
  userId: string,
  pending: ChatPendingAction | null,
  picked: PickedChoice,
  options: CatatOptions
): Promise<ChatResponse> {
  switch (picked.kind) {
    case "category": {
      if (pending?.kind === "save_expense") {
        const draft: ExpenseDraft = { ...pending.draft, categoryId: picked.value };
        const reply = await saveExpenseDraft(userId, draft, options.wallets, options.categories);
        return { reply, pendingAction: null, choices: [] };
      }

      return emptyChat("Catat dulu pengeluarannya, baru pilih kategori.");
    }
    case "transaction": {
      const match = await getTransactionMatchById(picked.value);

      if (!match) {
        return emptyChat("Catatannya kayaknya udah kehapus sebelumnya.");
      }

      return {
        reply: `Hapus ${match.label}?`,
        pendingAction: { kind: "delete_transactions", transactionIds: [match.id], summary: match.label },
        choices: []
      };
    }
    case "delete_all": {
      let scope: { term: string | null; amountDigits: string | null; lastMonth: boolean };

      try {
        scope = JSON.parse(picked.value) as typeof scope;
      } catch {
        return emptyChat("Pilihannya ga valid. Coba sebut ulang: bersihin catatan gorengan.");
      }

      const currentMonth = getMonthContext();
      const month = scope.lastMonth ? getMonthContext(currentMonth.previousKey) : currentMonth;
      const matches = await findTransactionMatches({
        term: scope.term,
        amountDigits: scope.amountDigits,
        month,
        take: BULK_DELETE_LIMIT
      });

      if (matches.totalCount === 0) {
        return emptyChat("Daftar catatannya berubah, ga ada yang bisa dihapus sekarang.");
      }

      if (matches.totalCount > BULK_DELETE_LIMIT) {
        return emptyChat(`Sekarang ketemu ${matches.totalCount} — kebanyakan. Lewat History ya.`);
      }

      return {
        reply: `Hapus ${matches.totalCount} catatan (total ${formatRupiah(matches.totalAmount)})?`,
        pendingAction: {
          kind: "delete_transactions",
          transactionIds: matches.rows.map((row) => row.id),
          summary: `${matches.totalCount} catatan`
        },
        choices: []
      };
    }
    case "source_account": {
      if (pending?.kind === "save_top_up" && pending.draft.walletId) {
        const result = await saveTopUpDraft(userId, {
          amount: pending.draft.amount,
          walletId: pending.draft.walletId,
          sourceAccountId: picked.value,
          description: pending.draft.description
        });

        return result.error
          ? { reply: result.error, pendingAction: pending, choices: [] }
          : { reply: result.message, pendingAction: null, choices: [] };
      }

      return emptyChat("Draft top up-nya belum ada. Sebut ulang: top up 50rb dari BCA ke Kas.");
    }
    case "from_wallet": {
      if (pending?.kind === "save_transfer") {
        return completeTransferDraft(
          pending.draft.amount,
          picked.value,
          pending.draft.toWalletId,
          pending.draft.description,
          options
        );
      }

      return emptyChat("Draft transfernya belum ada. Contoh: transfer 100rb dari kas ke tabungan.");
    }
    case "to_wallet": {
      if (pending?.kind === "save_transfer") {
        return completeTransferDraft(
          pending.draft.amount,
          pending.draft.fromWalletId,
          picked.value,
          pending.draft.description,
          options
        );
      }

      if (pending?.kind === "save_top_up") {
        return completeTopUpDraft(
          pending.draft.amount,
          picked.value,
          pending.draft.sourceAccountId,
          pending.draft.description,
          options
        );
      }

      return emptyChat("Draftnya belum ada. Contoh: top up 50rb dari BCA ke Kas.");
    }
    case "wallet": {
      try {
        const info = JSON.parse(picked.value) as { id: string; name: string };

        return {
          reply: `Nonaktifkan ${info.name}? Transaksinya tetap aman di History.`,
          pendingAction: { kind: "deactivate_wallet", walletId: info.id, name: info.name },
          choices: []
        };
      } catch {
        return emptyChat("Pilihannya ga valid.");
      }
    }
    case "retry": {
      return emptyChat("Tekan kirim ulang pertanyaannya ya, koneksi tadi sempat putus.");
    }
  }
}

async function executePendingAction(
  userId: string,
  pending: ChatPendingAction,
  text: string
): Promise<ChatResponse> {
  switch (pending.kind) {
    case "save_expense": {
      const options = await loadCatatOptions();
      const reply = await saveExpenseDraft(userId, pending.draft, options.wallets, options.categories);
      return { reply, pendingAction: null, choices: [] };
    }
    case "save_top_up": {
      if (!pending.draft.walletId || !pending.draft.sourceAccountId) {
        return {
          reply: "Data top up-nya belum lengkap. Sebut ulang, contoh: top up 50rb dari BCA ke Kas.",
          pendingAction: pending,
          choices: []
        };
      }

      const result = await saveTopUpDraft(userId, {
        amount: pending.draft.amount,
        walletId: pending.draft.walletId,
        sourceAccountId: pending.draft.sourceAccountId,
        description: pending.draft.description
      });

      return result.error
        ? { reply: result.error, pendingAction: pending, choices: [] }
        : { reply: result.message, pendingAction: null, choices: [] };
    }
    case "save_transfer": {
      if (!pending.draft.fromWalletId || !pending.draft.toWalletId) {
        return {
          reply: "Data transfernya belum lengkap. Sebut ulang, contoh: transfer 100rb dari kas ke tabungan.",
          pendingAction: pending,
          choices: []
        };
      }

      const result = await saveTransferDraft(userId, {
        amount: pending.draft.amount,
        fromWalletId: pending.draft.fromWalletId,
        toWalletId: pending.draft.toWalletId,
        description: pending.draft.description
      });

      return result.error
        ? { reply: result.error, pendingAction: pending, choices: [] }
        : { reply: result.message, pendingAction: null, choices: [] };
    }
    case "delete_transactions": {
      if (pending.requirePhrase) {
        const normalized = text.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();

        if (!/^(ya|y)[,\s]+hapus\s*(semua|semuanya|all)$/.test(normalized)) {
          return {
            reply: `Konfirmasinya kurang pas. Ketik persis "ya hapus semua" buat lanjut, atau "batal".`,
            pendingAction: pending,
            choices: []
          };
        }
      }

      const count = await softDeleteTransactions(userId, pending.transactionIds);

      return {
        reply:
          count > 0
            ? `Terhapus ${count} catatan: ${pending.summary}. Salah hapus? Pulihkan dari History → Terhapus.`
            : "Catatannya kayaknya udah kehapus sebelumnya.",
        pendingAction: null,
        choices: []
      };
    }
    case "edit_transaction": {
      const result = await applyTransactionEdit(userId, pending.transactionId, pending.changes);

      return result.error
        ? { reply: result.error, pendingAction: pending, choices: [] }
        : { reply: result.message, pendingAction: null, choices: [] };
    }
    case "create_wallet": {
      const result = await createChatWallet(pending.name, pending.initialBalance);

      return result.error
        ? { reply: result.error, pendingAction: pending, choices: [] }
        : { reply: result.message, pendingAction: null, choices: [] };
    }
    case "deactivate_wallet": {
      const result = await deactivateChatWallet(pending.walletId);

      return result.error
        ? { reply: result.error, pendingAction: pending, choices: [] }
        : { reply: result.message, pendingAction: null, choices: [] };
    }
    case "reset_wallets": {
      const normalized = text.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();

      if (!/^(ya|y)[,\s]*(bersihkan|bersihin)$/.test(normalized)) {
        return {
          reply: `Konfirmasinya kurang pas. Ketik persis "ya bersihkan" buat menghapus ${pending.walletNames.join(" & ")}, atau "batal".`,
          pendingAction: pending,
          choices: []
        };
      }

      const count = await resetWallets(userId, pending.walletIds);

      return {
        reply: `Beres. ${count} transaksi terhapus (masih bisa dipulihkan dari History → Terhapus) dan saldo awal ${pending.walletNames.join(" & ")} di-nol-kan.`,
        pendingAction: null,
        choices: []
      };
    }
  }
}

// Kalau gate lokal gagal mengeksekusi (verba kena tapi ga ketemu datanya),
// minta pendapat AI dulu sebelum pakai jawaban gate. Hanya dipakai kalau
// AI benar-benar menjawab (source "ai"), bukan fallback lokal.
async function arbitrateWithAi(
  userId: string,
  text: string,
  options: CatatOptions,
  history: ChatHistoryTurn[]
): Promise<ChatResponse | null> {
  if (listCatatAiProviders().length === 0) {
    return null;
  }

  const parsed = await resolveCatatDraft({
    prompt: text,
    wallets: options.wallets,
    categories: options.categories,
    sourceAccounts: options.sourceAccounts,
    history
  });

  if (parsed.source !== "ai") {
    return null;
  }

  return routeParsedDraft(userId, parsed, options);
}

async function routeNewIntent(
  userId: string,
  text: string,
  options: CatatOptions,
  history: ChatHistoryTurn[]
): Promise<ChatResponse> {
  const lower = text.toLowerCase();

  const walletCommand = parseWalletCommand(lower);

  if (walletCommand) {
    return routeWalletCommand(walletCommand, options);
  }

  const deleteCommand = parseDeleteCommand(lower);

  if (deleteCommand) {
    const outcome = await routeDeleteCommand(deleteCommand, options, lower);

    if (outcome.matched) {
      return outcome.response;
    }

    return (await arbitrateWithAi(userId, text, options, history)) ?? outcome.response;
  }

  const editCommand = parseEditCommand(lower);

  if (editCommand) {
    const outcome = await routeEditCommand(editCommand, options);

    if (outcome.matched) {
      return outcome.response;
    }

    return (await arbitrateWithAi(userId, text, options, history)) ?? outcome.response;
  }

  const transferIntent = parseTransferIntent(lower);

  if (transferIntent) {
    return routeTransferIntent(transferIntent, options);
  }

  if (isAddCategory(text)) {
    const created = await createCategoryByName(categoryNameFromAddCommand(text));

    if (created.category) {
      return emptyChat(`Kategori ${created.category.name} sudah saya tambah. Mau dipakai catat yang mana?`);
    }

    return emptyChat(created.error ?? "Kategori belum bisa ditambah.");
  }

  const financeQuestion = parseFinanceQuestion(text, options.categories);

  if (financeQuestion) {
    return answerFinanceQuestionDetail(financeQuestion, options);
  }

  if (isSpendingQuery(text)) {
    return emptyChat(await answerSpendingQuery());
  }

  const parsed = await resolveCatatDraft({
    prompt: text,
    wallets: options.wallets,
    categories: options.categories,
    sourceAccounts: options.sourceAccounts,
    history
  });

  return routeParsedDraft(userId, parsed, options);
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

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

  return `${hello} Ada yang mau dicatat atau ditanya?`;
}

export async function sendCatatChatAction(
  prompt: string,
  pendingAction?: ChatPendingAction | null,
  picked?: PickedChoice | null,
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

  if (!text && !picked) {
    return rememberTurn(
      emptyChat("Tulis pengeluaran, tanya saldo, atau hapus catatan. Contoh: gorengan 5k, saldo istri, hapus gorengan tadi.")
    );
  }

  const options = await loadCatatOptions();

  if (picked) {
    return rememberTurn(await applyPickedChoice(currentUser.id, pendingAction ?? null, picked, options));
  }

  if (pendingAction) {
    if (isCancel(text)) {
      return rememberTurn(emptyChat("Oke, dibatalin."));
    }

    if (isAffirmative(text)) {
      return rememberTurn(await executePendingAction(currentUser.id, pendingAction, text));
    }

    const fresh = await routeNewIntent(currentUser.id, text, options, history);

    if (fresh.pendingAction) {
      return rememberTurn(fresh);
    }

    return rememberTurn({
      reply: `Masih ada ${describePending(pendingAction)} yang nunggu konfirmasi. "Ya" buat lanjut, "batal" buat batalin.`,
      pendingAction,
      choices: []
    });
  }

  return rememberTurn(await routeNewIntent(currentUser.id, text, options, history));
}
