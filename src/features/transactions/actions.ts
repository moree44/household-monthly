"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseAppDateInput } from "@/lib/date/timezone";

export type ExpenseFormState = {
  error: string | null;
};

export type TopUpFormState = {
  error: string | null;
};

export type TransferFormState = {
  error: string | null;
};

export type DeleteTransactionState = {
  error: string | null;
  success: boolean;
};

export type RestoreTransactionState = {
  error: string | null;
  success: boolean;
};

const expenseSchema = z.object({
  transactionDate: z.string().min(1, "Tanggal wajib diisi."),
  amount: z.string().min(1, "Nominal wajib diisi."),
  walletId: z.string().min(1, "Wallet wajib dipilih."),
  categoryId: z.string().min(1, "Kategori wajib dipilih."),
  description: z.string().trim().max(300, "Catatan maksimal 300 karakter.").optional()
});

const topUpSchema = z.object({
  transactionDate: z.string().min(1, "Tanggal wajib diisi."),
  amount: z.string().min(1, "Nominal wajib diisi."),
  walletId: z.string().min(1, "Wallet tujuan wajib dipilih."),
  sourceAccountId: z.string().min(1, "Source account wajib dipilih."),
  description: z.string().trim().max(300, "Catatan maksimal 300 karakter.").optional()
});

const transferSchema = z.object({
  transactionDate: z.string().min(1, "Tanggal wajib diisi."),
  amount: z.string().min(1, "Nominal wajib diisi."),
  fromWalletId: z.string().min(1, "Wallet asal wajib dipilih."),
  toWalletId: z.string().min(1, "Wallet tujuan wajib dipilih."),
  description: z.string().trim().max(300, "Catatan maksimal 300 karakter.").optional()
});

function parseRupiahInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits) {
    return null;
  }

  return digits;
}

function parseTransactionDate(value: string) {
  const date = parseAppDateInput(value);

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function revalidateTransactionViews() {
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/profile");
}

async function validateActiveExpenseReferences(walletId: string, categoryId: string) {
  const [wallet, category] = await Promise.all([
    prisma.wallet.findFirst({
      where: {
        id: walletId,
        isActive: true
      },
      select: {
        id: true
      }
    }),
    prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true
      },
      select: {
        id: true
      }
    })
  ]);

  if (!wallet) {
    return "Wallet tidak tersedia atau sudah nonaktif.";
  }

  if (!category) {
    return "Kategori tidak tersedia atau sudah nonaktif.";
  }

  return null;
}

async function validateActiveTopUpReferences(walletId: string, sourceAccountId: string) {
  const [wallet, sourceAccount] = await Promise.all([
    prisma.wallet.findFirst({
      where: {
        id: walletId,
        isActive: true
      },
      select: {
        id: true
      }
    }),
    prisma.sourceAccount.findFirst({
      where: {
        id: sourceAccountId,
        isActive: true
      },
      select: {
        id: true
      }
    })
  ]);

  if (!wallet) {
    return "Wallet tujuan tidak tersedia atau sudah nonaktif.";
  }

  if (!sourceAccount) {
    return "Source account tidak tersedia atau sudah nonaktif.";
  }

  return null;
}

async function validateActiveTransferWallets(fromWalletId: string, toWalletId: string) {
  const wallets = await prisma.wallet.findMany({
    where: {
      id: {
        in: [fromWalletId, toWalletId]
      },
      isActive: true
    },
    select: {
      id: true
    }
  });

  const activeWalletIds = new Set(wallets.map((wallet) => wallet.id));

  if (!activeWalletIds.has(fromWalletId)) {
    return "Wallet asal tidak tersedia atau sudah nonaktif.";
  }

  if (!activeWalletIds.has(toWalletId)) {
    return "Wallet tujuan tidak tersedia atau sudah nonaktif.";
  }

  return null;
}

export async function createExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const currentUser = await requireUser();

  const parsed = expenseSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data expense belum lengkap."
    };
  }

  const amount = parseRupiahInput(parsed.data.amount);

  if (!amount || BigInt(amount) <= BigInt(0)) {
    return {
      error: "Nominal harus lebih dari Rp 0."
    };
  }

  const transactionDate = parseTransactionDate(parsed.data.transactionDate);

  if (!transactionDate) {
    return {
      error: "Format tanggal tidak valid."
    };
  }

  const referenceError = await validateActiveExpenseReferences(parsed.data.walletId, parsed.data.categoryId);

  if (referenceError) {
    return {
      error: referenceError
    };
  }

  await prisma.transaction.create({
    data: {
      type: "expense",
      transactionDate,
      amount,
      walletId: parsed.data.walletId,
      categoryId: parsed.data.categoryId,
      subCategoryId: null,
      description: parsed.data.description || null,
      createdById: currentUser.id
    }
  });

  revalidateTransactionViews();
  redirect("/dashboard");
}

export async function updateExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData
): Promise<ExpenseFormState> {
  const currentUser = await requireUser();
  const transactionId = formData.get("transactionId");

  if (typeof transactionId !== "string" || !transactionId) {
    return {
      error: "Transaksi tidak valid."
    };
  }

  const parsed = expenseSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data expense belum lengkap."
    };
  }

  const amount = parseRupiahInput(parsed.data.amount);

  if (!amount || BigInt(amount) <= BigInt(0)) {
    return {
      error: "Nominal harus lebih dari Rp 0."
    };
  }

  const transactionDate = parseTransactionDate(parsed.data.transactionDate);

  if (!transactionDate) {
    return {
      error: "Format tanggal tidak valid."
    };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      type: "expense",
      deletedAt: null
    },
    select: {
      id: true
    }
  });

  if (!transaction) {
    return {
      error: "Expense tidak ditemukan atau sudah dihapus."
    };
  }

  const referenceError = await validateActiveExpenseReferences(parsed.data.walletId, parsed.data.categoryId);

  if (referenceError) {
    return {
      error: referenceError
    };
  }

  await prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      transactionDate,
      amount,
      walletId: parsed.data.walletId,
      categoryId: parsed.data.categoryId,
      subCategoryId: null,
      description: parsed.data.description || null,
      updatedById: currentUser.id
    }
  });

  revalidateTransactionViews();
  redirect("/history");
}

export async function createTopUpAction(
  _prevState: TopUpFormState,
  formData: FormData
): Promise<TopUpFormState> {
  const currentUser = await requireUser();

  const parsed = topUpSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    sourceAccountId: formData.get("sourceAccountId"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data top up belum lengkap."
    };
  }

  const amount = parseRupiahInput(parsed.data.amount);

  if (!amount || BigInt(amount) <= BigInt(0)) {
    return {
      error: "Nominal harus lebih dari Rp 0."
    };
  }

  const transactionDate = parseTransactionDate(parsed.data.transactionDate);

  if (!transactionDate) {
    return {
      error: "Format tanggal tidak valid."
    };
  }

  const referenceError = await validateActiveTopUpReferences(parsed.data.walletId, parsed.data.sourceAccountId);

  if (referenceError) {
    return {
      error: referenceError
    };
  }

  await prisma.transaction.create({
    data: {
      type: "top_up",
      transactionDate,
      amount,
      walletId: parsed.data.walletId,
      sourceAccountId: parsed.data.sourceAccountId,
      description: parsed.data.description || null,
      createdById: currentUser.id
    }
  });

  revalidateTransactionViews();
  redirect("/dashboard");
}

export async function updateTopUpAction(
  _prevState: TopUpFormState,
  formData: FormData
): Promise<TopUpFormState> {
  const currentUser = await requireUser();
  const transactionId = formData.get("transactionId");

  if (typeof transactionId !== "string" || !transactionId) {
    return {
      error: "Transaksi tidak valid."
    };
  }

  const parsed = topUpSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    walletId: formData.get("walletId"),
    sourceAccountId: formData.get("sourceAccountId"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data top up belum lengkap."
    };
  }

  const amount = parseRupiahInput(parsed.data.amount);

  if (!amount || BigInt(amount) <= BigInt(0)) {
    return {
      error: "Nominal harus lebih dari Rp 0."
    };
  }

  const transactionDate = parseTransactionDate(parsed.data.transactionDate);

  if (!transactionDate) {
    return {
      error: "Format tanggal tidak valid."
    };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      type: "top_up",
      deletedAt: null
    },
    select: {
      id: true
    }
  });

  if (!transaction) {
    return {
      error: "Top up tidak ditemukan atau sudah dihapus."
    };
  }

  const referenceError = await validateActiveTopUpReferences(parsed.data.walletId, parsed.data.sourceAccountId);

  if (referenceError) {
    return {
      error: referenceError
    };
  }

  await prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      transactionDate,
      amount,
      walletId: parsed.data.walletId,
      sourceAccountId: parsed.data.sourceAccountId,
      description: parsed.data.description || null,
      updatedById: currentUser.id
    }
  });

  revalidateTransactionViews();
  redirect("/history");
}

export async function createTransferAction(
  _prevState: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const currentUser = await requireUser();

  const parsed = transferSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    fromWalletId: formData.get("fromWalletId"),
    toWalletId: formData.get("toWalletId"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data transfer belum lengkap."
    };
  }

  if (parsed.data.fromWalletId === parsed.data.toWalletId) {
    return {
      error: "Wallet asal dan tujuan harus berbeda."
    };
  }

  const amount = parseRupiahInput(parsed.data.amount);

  if (!amount || BigInt(amount) <= BigInt(0)) {
    return {
      error: "Nominal harus lebih dari Rp 0."
    };
  }

  const transactionDate = parseTransactionDate(parsed.data.transactionDate);

  if (!transactionDate) {
    return {
      error: "Format tanggal tidak valid."
    };
  }

  const referenceError = await validateActiveTransferWallets(parsed.data.fromWalletId, parsed.data.toWalletId);

  if (referenceError) {
    return {
      error: referenceError
    };
  }

  await prisma.transaction.create({
    data: {
      type: "transfer",
      transactionDate,
      amount,
      fromWalletId: parsed.data.fromWalletId,
      toWalletId: parsed.data.toWalletId,
      description: parsed.data.description || null,
      createdById: currentUser.id
    }
  });

  revalidateTransactionViews();
  redirect("/dashboard");
}

export async function updateTransferAction(
  _prevState: TransferFormState,
  formData: FormData
): Promise<TransferFormState> {
  const currentUser = await requireUser();
  const transactionId = formData.get("transactionId");

  if (typeof transactionId !== "string" || !transactionId) {
    return {
      error: "Transaksi tidak valid."
    };
  }

  const parsed = transferSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    amount: formData.get("amount"),
    fromWalletId: formData.get("fromWalletId"),
    toWalletId: formData.get("toWalletId"),
    description: formData.get("description") ?? undefined
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data transfer belum lengkap."
    };
  }

  if (parsed.data.fromWalletId === parsed.data.toWalletId) {
    return {
      error: "Wallet asal dan tujuan harus berbeda."
    };
  }

  const amount = parseRupiahInput(parsed.data.amount);

  if (!amount || BigInt(amount) <= BigInt(0)) {
    return {
      error: "Nominal harus lebih dari Rp 0."
    };
  }

  const transactionDate = parseTransactionDate(parsed.data.transactionDate);

  if (!transactionDate) {
    return {
      error: "Format tanggal tidak valid."
    };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      type: "transfer",
      deletedAt: null
    },
    select: {
      id: true
    }
  });

  if (!transaction) {
    return {
      error: "Transfer tidak ditemukan atau sudah dihapus."
    };
  }

  const referenceError = await validateActiveTransferWallets(parsed.data.fromWalletId, parsed.data.toWalletId);

  if (referenceError) {
    return {
      error: referenceError
    };
  }

  await prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      transactionDate,
      amount,
      fromWalletId: parsed.data.fromWalletId,
      toWalletId: parsed.data.toWalletId,
      description: parsed.data.description || null,
      updatedById: currentUser.id
    }
  });

  revalidateTransactionViews();
  redirect("/history");
}

export async function deleteTransactionAction(
  _prevState: DeleteTransactionState,
  formData: FormData
): Promise<DeleteTransactionState> {
  const currentUser = await requireUser();
  const transactionId = formData.get("transactionId");

  if (typeof transactionId !== "string" || !transactionId) {
    return {
      error: "Transaksi tidak valid.",
      success: false
    };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      deletedAt: null
    },
    select: {
      id: true
    }
  });

  if (!transaction) {
    return {
      error: "Transaksi tidak ditemukan atau sudah dihapus.",
      success: false
    };
  }

  await prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      deletedAt: new Date(),
      deletedById: currentUser.id,
      updatedById: currentUser.id
    }
  });

  revalidateTransactionViews();

  return {
    error: null,
    success: true
  };
}

export async function restoreTransactionAction(
  _prevState: RestoreTransactionState,
  formData: FormData
): Promise<RestoreTransactionState> {
  const currentUser = await requireUser();
  const transactionId = formData.get("transactionId");

  if (typeof transactionId !== "string" || !transactionId) {
    return {
      error: "Transaksi tidak valid.",
      success: false
    };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      deletedAt: {
        not: null
      }
    },
    select: {
      id: true
    }
  });

  if (!transaction) {
    return {
      error: "Transaksi tidak ditemukan atau sudah aktif.",
      success: false
    };
  }

  await prisma.transaction.update({
    where: {
      id: transaction.id
    },
    data: {
      deletedAt: null,
      deletedById: null,
      updatedById: currentUser.id
    }
  });

  revalidateTransactionViews();

  return {
    error: null,
    success: true
  };
}
