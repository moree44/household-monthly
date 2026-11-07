import { revalidatePath, updateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MonthContext } from "@/lib/date/month";
import { formatAppMonthShort } from "@/lib/date/timezone";
import { formatRupiah } from "@/lib/format/currency";
import { getDashboardData } from "@/features/dashboard/data";

export const BULK_DELETE_LIMIT = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Jakarta"
});

function decimalToNumber(value: { toString(): string } | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

export function revalidateTransactionViews() {
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/profile");
  updateTag("finance-data");
}

export function revalidateWalletViews() {
  revalidatePath("/settings/wallets");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/expenses/new");
  revalidatePath("/transfers/new");
  revalidatePath("/top-ups/new");
  updateTag("finance-data");
}

export type ChatActionResult = {
  error: string | null;
  message: string;
};

// ---------------------------------------------------------------------------
// Transaction matching (delete / edit / list queries)
// ---------------------------------------------------------------------------

export type TransactionMatch = {
  id: string;
  label: string;
};

export type TransactionMatchSummary = {
  rows: TransactionMatch[];
  totalCount: number;
  totalAmount: number;
};

type MatchInput = {
  term: string | null;
  amountDigits: string | null;
  month: MonthContext;
  take?: number;
};

function transactionLabel(transaction: {
  type: string;
  description: string | null;
  amount: { toString(): string };
  transactionDate: Date;
  category?: { name: string } | null;
  wallet?: { name: string } | null;
  fromWallet?: { name: string } | null;
  toWallet?: { name: string } | null;
  sourceAccount?: { name: string } | null;
}) {
  const money = formatRupiah(decimalToNumber(transaction.amount));
  const day = dayFormatter.format(transaction.transactionDate);
  const subject =
    transaction.type === "top_up"
      ? `Top up ${transaction.wallet?.name ?? transaction.sourceAccount?.name ?? ""}`.trim()
      : transaction.type === "transfer"
        ? `Transfer ${transaction.fromWallet?.name ?? "?"} → ${transaction.toWallet?.name ?? "?"}`
        : transaction.description || transaction.category?.name || "Pengeluaran";

  return `${subject} · ${money} · ${day}`;
}

export async function findTransactionMatches(input: MatchInput): Promise<TransactionMatchSummary> {
  const termFilters = input.term
    ? [
        { description: { contains: input.term, mode: "insensitive" as const } },
        { category: { is: { name: { contains: input.term, mode: "insensitive" as const } } } },
        { wallet: { is: { name: { contains: input.term, mode: "insensitive" as const } } } },
        { fromWallet: { is: { name: { contains: input.term, mode: "insensitive" as const } } } },
        { toWallet: { is: { name: { contains: input.term, mode: "insensitive" as const } } } },
        { sourceAccount: { is: { name: { contains: input.term, mode: "insensitive" as const } } } }
      ]
    : [];

  const where = {
    deletedAt: null,
    transactionDate: {
      gte: input.month.start,
      lt: input.month.end
    },
    ...(input.amountDigits ? { amount: input.amountDigits } : {}),
    ...(termFilters.length > 0 ? { OR: termFilters } : {})
  };

  const [rows, aggregate] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: input.take ?? 8,
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        transactionDate: true,
        category: { select: { name: true } },
        wallet: { select: { name: true } },
        fromWallet: { select: { name: true } },
        toWallet: { select: { name: true } },
        sourceAccount: { select: { name: true } }
      }
    }),
    prisma.transaction.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true }
    })
  ]);

  return {
    rows: rows.map((row) => ({ id: row.id, label: transactionLabel(row) })),
    totalCount: aggregate._count.id,
    totalAmount: decimalToNumber(aggregate._sum.amount)
  };
}

export async function getTransactionMatchById(id: string): Promise<TransactionMatch | null> {
  const row = await prisma.transaction.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      type: true,
      description: true,
      amount: true,
      transactionDate: true,
      category: { select: { name: true } },
      wallet: { select: { name: true } },
      fromWallet: { select: { name: true } },
      toWallet: { select: { name: true } },
      sourceAccount: { select: { name: true } }
    }
  });

  return row ? { id: row.id, label: transactionLabel(row) } : null;
}

// Semua transaksi sepanjang waktu yang menyentuh wallet-wallet ini
// (sebagai wallet tujuan, asal transfer, atau tujuan transfer).
export async function findWalletTransactions(walletIds: string[], take: number): Promise<TransactionMatchSummary> {
  const where = {
    deletedAt: null,
    OR: [
      { walletId: { in: walletIds } },
      { fromWalletId: { in: walletIds } },
      { toWalletId: { in: walletIds } }
    ]
  };

  const [rows, aggregate] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take,
      select: {
        id: true,
        type: true,
        description: true,
        amount: true,
        transactionDate: true,
        category: { select: { name: true } },
        wallet: { select: { name: true } },
        fromWallet: { select: { name: true } },
        toWallet: { select: { name: true } },
        sourceAccount: { select: { name: true } }
      }
    }),
    prisma.transaction.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true }
    })
  ]);

  return {
    rows: rows.map((row) => ({ id: row.id, label: transactionLabel(row) })),
    totalCount: aggregate._count.id,
    totalAmount: decimalToNumber(aggregate._sum?.amount)
  };
}

// Reset wallet: soft-delete semua transaksi yang menyentuh wallet + nol-kan
// saldo awal, supaya saldo wallet kembali ke Rp 0.
export async function resetWallets(userId: string, walletIds: string[]): Promise<number> {
  const result = await prisma.transaction.updateMany({
    where: {
      deletedAt: null,
      OR: [
        { walletId: { in: walletIds } },
        { fromWalletId: { in: walletIds } },
        { toWalletId: { in: walletIds } }
      ]
    },
    data: {
      deletedAt: new Date(),
      deletedById: userId,
      updatedById: userId
    }
  });

  await prisma.wallet.updateMany({
    where: { id: { in: walletIds } },
    data: { initialBalance: 0 }
  });

  revalidateTransactionViews();
  revalidateWalletViews();

  return result.count;
}

export async function softDeleteTransactions(userId: string, transactionIds: string[]) {
  const result = await prisma.transaction.updateMany({
    where: {
      id: { in: transactionIds },
      deletedAt: null
    },
    data: {
      deletedAt: new Date(),
      deletedById: userId,
      updatedById: userId
    }
  });

  revalidateTransactionViews();
  return result.count;
}

// ---------------------------------------------------------------------------
// Edit transaction (chat scope: expense only)
// ---------------------------------------------------------------------------

export type TransactionEditChanges = {
  amountDigits?: string | null;
  categoryId?: string | null;
  walletId?: string | null;
  description?: string | null;
};

export async function applyTransactionEdit(
  userId: string,
  transactionId: string,
  changes: TransactionEditChanges
): Promise<ChatActionResult> {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      deletedAt: null
    },
    select: {
      id: true,
      type: true,
      description: true,
      amount: true,
      category: { select: { name: true } }
    }
  });

  if (!transaction) {
    return { error: "Transaksi tidak ditemukan atau sudah dihapus.", message: "" };
  }

  if (transaction.type !== "expense") {
    return {
      error: "Edit via chat baru bisa untuk pengeluaran. Transaksi lain ubah lewat menu Catat.",
      message: ""
    };
  }

  const data: {
    amount?: string;
    categoryId?: string;
    walletId?: string;
    description?: string;
    updatedById: string;
  } = { updatedById: userId };

  if (changes.amountDigits) {
    data.amount = changes.amountDigits;
  }

  if (changes.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: changes.categoryId, isActive: true },
      select: { id: true }
    });

    if (!category) {
      return { error: "Kategori tidak tersedia atau sudah nonaktif.", message: "" };
    }

    data.categoryId = changes.categoryId;
  }

  if (changes.walletId) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: changes.walletId, isActive: true },
      select: { id: true }
    });

    if (!wallet) {
      return { error: "Wallet tidak tersedia atau sudah nonaktif.", message: "" };
    }

    data.walletId = changes.walletId;
  }

  if (changes.description) {
    data.description = changes.description;
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data
  });

  revalidateTransactionViews();

  const parts: string[] = [];

  if (changes.amountDigits) {
    parts.push(`nominal jadi ${formatRupiah(Number(changes.amountDigits))}`);
  }

  if (changes.categoryId) {
    const name = await prisma.category.findUnique({
      where: { id: changes.categoryId },
      select: { name: true }
    });
    parts.push(`kategori jadi ${name?.name ?? "-"}`);
  }

  if (changes.walletId) {
    const name = await prisma.wallet.findUnique({
      where: { id: changes.walletId },
      select: { name: true }
    });
    parts.push(`wallet jadi ${name?.name ?? "-"}`);
  }

  if (changes.description) {
    parts.push(`catatan jadi "${changes.description}"`);
  }

  return {
    error: null,
    message: `Sudah diubah: ${transaction.description || transaction.category?.name || "Pengeluaran"} — ${parts.join(", ")}.`
  };
}

// ---------------------------------------------------------------------------
// Wallet via chat (create + deactivate; app has no hard delete for wallets)
// ---------------------------------------------------------------------------

export async function createChatWallet(
  name: string,
  initialBalanceDigits: string | null
): Promise<ChatActionResult & { walletId: string | null }> {
  const cleaned = name.replace(/\s+/g, " ").trim();

  if (cleaned.length < 2) {
    return { error: "Nama wallet minimal 2 huruf.", message: "", walletId: null };
  }

  const existing = await prisma.wallet.findUnique({
    where: { name: cleaned },
    select: { id: true, isActive: true }
  });

  if (existing?.isActive) {
    return { error: `Wallet ${cleaned} sudah ada.`, message: "", walletId: null };
  }

  if (existing && !existing.isActive) {
    return {
      error: `Wallet ${cleaned} ada di daftar nonaktif. Aktifkan lagi dari Pengaturan → Wallet.`,
      message: "",
      walletId: null
    };
  }

  const maxSortOrder = await prisma.wallet.aggregate({
    _max: { sortOrder: true }
  });

  const wallet = await prisma.wallet.create({
    data: {
      name: cleaned,
      type: "custom",
      initialBalance: initialBalanceDigits ? Number(initialBalanceDigits) : 0,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1
    },
    select: { id: true, name: true }
  });

  revalidateWalletViews();

  const balanceNote = initialBalanceDigits ? ` Saldo awal ${formatRupiah(Number(initialBalanceDigits))}.` : "";

  return { error: null, message: `Wallet ${wallet.name} sudah dibuat.${balanceNote}`, walletId: wallet.id };
}

export async function deactivateChatWallet(walletId: string): Promise<ChatActionResult> {
  await prisma.wallet.update({
    where: { id: walletId },
    data: { isActive: false }
  });

  revalidateWalletViews();

  return { error: null, message: "Wallet dinonaktifkan. Transaksi lamanya tetap aman di History." };
}

// ---------------------------------------------------------------------------
// Save top-up / transfer drafts (mirror createTopUpAction / createTransferAction)
// ---------------------------------------------------------------------------

export type ChatTopUpDraft = {
  amount: string;
  walletId: string;
  sourceAccountId?: string | null;
  description?: string | null;
};

export async function saveTopUpDraft(userId: string, draft: ChatTopUpDraft): Promise<ChatActionResult> {
  if (!draft.sourceAccountId) {
    return { error: "Sumber dananya belum dipilih.", message: "" };
  }

  const [wallet, sourceAccount] = await Promise.all([
    prisma.wallet.findFirst({ where: { id: draft.walletId, isActive: true }, select: { name: true } }),
    prisma.sourceAccount.findFirst({
      where: { id: draft.sourceAccountId, isActive: true },
      select: { name: true }
    })
  ]);

  if (!wallet) {
    return { error: "Wallet tujuan tidak tersedia atau sudah nonaktif.", message: "" };
  }

  if (!sourceAccount) {
    return { error: "Source account tidak tersedia atau sudah nonaktif.", message: "" };
  }

  await prisma.transaction.create({
    data: {
      type: "top_up",
      transactionDate: new Date(),
      amount: draft.amount,
      walletId: draft.walletId,
      sourceAccountId: draft.sourceAccountId,
      description: draft.description || null,
      createdById: userId
    }
  });

  revalidateTransactionViews();

  return {
    error: null,
    message: `Top up ${formatRupiah(Number(draft.amount))} ke ${wallet.name} dari ${sourceAccount.name} sudah tercatat.`
  };
}

export type ChatTransferDraft = {
  amount: string;
  fromWalletId: string;
  toWalletId: string;
  description?: string | null;
};

export async function saveTransferDraft(userId: string, draft: ChatTransferDraft): Promise<ChatActionResult> {
  if (draft.fromWalletId === draft.toWalletId) {
    return { error: "Wallet asal dan tujuan harus berbeda.", message: "" };
  }

  const wallets = await prisma.wallet.findMany({
    where: {
      id: { in: [draft.fromWalletId, draft.toWalletId] },
      isActive: true
    },
    select: { id: true, name: true }
  });

  const from = wallets.find((wallet) => wallet.id === draft.fromWalletId);
  const to = wallets.find((wallet) => wallet.id === draft.toWalletId);

  if (!from) {
    return { error: "Wallet asal tidak tersedia atau sudah nonaktif.", message: "" };
  }

  if (!to) {
    return { error: "Wallet tujuan tidak tersedia atau sudah nonaktif.", message: "" };
  }

  await prisma.transaction.create({
    data: {
      type: "transfer",
      transactionDate: new Date(),
      amount: draft.amount,
      fromWalletId: draft.fromWalletId,
      toWalletId: draft.toWalletId,
      description: draft.description || null,
      createdById: userId
    }
  });

  revalidateTransactionViews();

  return {
    error: null,
    message: `Transfer ${formatRupiah(Number(draft.amount))} dari ${from.name} ke ${to.name} sudah tercatat.`
  };
}

// ---------------------------------------------------------------------------
// Detailed finance answers
// ---------------------------------------------------------------------------

const operationalWalletFilter: Prisma.TransactionWhereInput = {
  wallet: {
    type: { in: ["operational", "wife"] }
  }
};

export async function answerCategoryTotal(
  month: MonthContext,
  categoryId: string,
  categoryLabel: string
): Promise<string> {
  const [categoryAgg, totalAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: "expense",
        deletedAt: null,
        categoryId,
        transactionDate: { gte: month.start, lt: month.end },
        ...operationalWalletFilter
      },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        type: "expense",
        deletedAt: null,
        transactionDate: { gte: month.start, lt: month.end },
        ...operationalWalletFilter
      },
      _sum: { amount: true }
    })
  ]);

  const categoryTotal = decimalToNumber(categoryAgg._sum?.amount);
  const monthTotal = decimalToNumber(totalAgg._sum?.amount);
  const share = monthTotal > 0 ? Math.round((categoryTotal / monthTotal) * 100) : 0;

  return `${month.label}: ${categoryLabel} ${formatRupiah(categoryTotal)}${monthTotal > 0 ? ` (${share}% dari pengeluaran ${formatRupiah(monthTotal)})` : ""}.`;
}

export async function answerWeekTotal(month: MonthContext, week: number): Promise<string> {
  const weekStart = new Date(month.start.getTime() + (week - 1) * 7 * DAY_MS);
  const rawEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  const weekEnd = rawEnd > month.end ? month.end : rawEnd;

  const [totalAgg, topGroups] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: "expense",
        deletedAt: null,
        transactionDate: { gte: weekStart, lt: weekEnd },
        ...operationalWalletFilter
      },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        type: "expense",
        deletedAt: null,
        categoryId: { not: null },
        transactionDate: { gte: weekStart, lt: weekEnd },
        ...operationalWalletFilter
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 3
    })
  ]);

  const categoryIds = topGroups.flatMap((group) => (group.categoryId ? [group.categoryId] : []));
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true }
      })
    : [];
  const nameById = new Map(categories.map((category) => [category.id, category.name]));

  const topNames = topGroups
    .map((group) => (group.categoryId ? nameById.get(group.categoryId) : null) ?? null)
    .filter(Boolean)
    .join(", ");

  const range = `${dayFormatter.format(weekStart)}–${dayFormatter.format(new Date(weekEnd.getTime() - DAY_MS))}`;

  return `Minggu ${week} (${range}) ${formatAppMonthShort(month.start)}: pengeluaran ${formatRupiah(decimalToNumber(totalAgg._sum?.amount))}.${topNames ? ` Terbesar: ${topNames}.` : ""}`;
}

export async function answerPersonTotal(month: MonthContext, person: "istri" | "suami"): Promise<string> {
  const dashboard = await getDashboardData(month);

  if (person === "istri") {
    return `${month.label}: Dompet Istri saldo ${formatRupiah(dashboard.wifeSummary.balance)}, pengeluaran ${formatRupiah(dashboard.wifeSummary.expense)}, diterima transfer ${formatRupiah(dashboard.wifeSummary.transferIn)}.`;
  }

  return `${month.label}: total saldo ${formatRupiah(dashboard.totalWalletBalance)}, pengeluaran kas bersama ${formatRupiah(dashboard.operationalExpense)}.`;
}

export async function answerTransactionList(
  month: MonthContext,
  term: string | null
): Promise<string> {
  const summary = await findTransactionMatches({ term, amountDigits: null, month, take: 5 });

  if (summary.totalCount === 0) {
    return term
      ? `Ga ada catatan "${term}" di ${month.label}.`
      : `Ga ada transaksi di ${month.label}.`;
  }

  const lines = summary.rows
    .map((row, index) => `${index + 1}. ${row.label}`)
    .join("\n");
  const moreNote =
    summary.totalCount > summary.rows.length ? `\n+${summary.totalCount - summary.rows.length} lainnya` : "";

  return `${month.label}${term ? ` — "${term}"` : ""}: ${summary.totalCount} catatan, total ${formatRupiah(summary.totalAmount)}.\n${lines}${moreNote}`;
}
