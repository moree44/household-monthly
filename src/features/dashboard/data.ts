import type { TransactionType, WalletType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MonthContext } from "@/lib/date/month";

type WalletTone = {
  badge: string;
};

const walletTones: Record<WalletType, WalletTone> = {
  operational: { badge: "bg-blue-50 text-blue-700" },
  wife: { badge: "bg-cyan-50 text-cyan-700" },
  home_setup: { badge: "bg-green-50 text-green-700" },
  emergency: { badge: "bg-amber-50 text-amber-700" },
  custom: { badge: "bg-gray-100 text-gray-700" }
};

function decimalToNumber(value: { toString(): string } | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

function signedWalletTransactionAmount({
  amount,
  adjustmentDirection,
  type
}: {
  amount: { toString(): string } | null | undefined;
  adjustmentDirection: "increase" | "decrease" | null;
  type: TransactionType;
}) {
  const numericAmount = decimalToNumber(amount);

  if (type === "top_up") {
    return numericAmount;
  }

  if (type === "expense") {
    return -numericAmount;
  }

  if (type === "adjustment") {
    return adjustmentDirection === "decrease" ? -numericAmount : numericAmount;
  }

  return 0;
}

export async function getDashboardData(month: MonthContext) {
  const { start, end } = month;

  const [
    wallets,
    walletTransactionGroups,
    transferOutGroups,
    transferInGroups,
    monthExpenseSum,
    monthTopUpSum,
    homeSetupExpenseSum,
    categoryGroups,
    recentTransactions,
    wifeExpense,
    wifeTransferIn
  ] = await Promise.all([
    prisma.wallet.findMany({
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        name: true,
        type: true,
        initialBalance: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["walletId", "type", "adjustmentDirection"],
      where: {
        deletedAt: null,
        walletId: {
          not: null
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["fromWalletId"],
      where: {
        deletedAt: null,
        type: "transfer",
        fromWalletId: {
          not: null
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["toWalletId"],
      where: {
        deletedAt: null,
        type: "transfer",
        toWalletId: {
          not: null
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.aggregate({
      where: {
        type: "expense",
        deletedAt: null,
        transactionDate: {
          gte: start,
          lt: end
        },
        wallet: {
          type: {
            in: ["operational", "wife"]
          }
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.aggregate({
      where: {
        type: "top_up",
        deletedAt: null,
        transactionDate: {
          gte: start,
          lt: end
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.aggregate({
      where: {
        type: "expense",
        deletedAt: null,
        transactionDate: {
          gte: start,
          lt: end
        },
        wallet: {
          type: "home_setup"
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        type: "expense",
        deletedAt: null,
        categoryId: {
          not: null
        },
        transactionDate: {
          gte: start,
          lt: end
        },
        wallet: {
          type: {
            in: ["operational", "wife"]
          }
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _sum: {
          amount: "desc"
        }
      },
      take: 5
    }),
    prisma.transaction.findMany({
      where: {
        deletedAt: null
      },
      orderBy: [
        {
          transactionDate: "desc"
        },
        {
          createdAt: "desc"
        }
      ],
      take: 5,
      include: {
        wallet: {
          select: {
            name: true
          }
        },
        fromWallet: {
          select: {
            name: true
          }
        },
        toWallet: {
          select: {
            name: true
          }
        },
        sourceAccount: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.transaction.aggregate({
      where: {
        type: "expense",
        deletedAt: null,
        wallet: {
          type: "wife"
        },
        transactionDate: {
          gte: start,
          lt: end
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.transaction.aggregate({
      where: {
        type: "transfer",
        deletedAt: null,
        toWallet: {
          type: "wife"
        },
        transactionDate: {
          gte: start,
          lt: end
        }
      },
      _sum: {
        amount: true
      }
    })
  ]);

  const categoryIds = categoryGroups.flatMap((group) => (group.categoryId ? [group.categoryId] : []));
  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const walletTransactionBalanceById = new Map<string, number>();
  const transferOutByWalletId = new Map<string, number>();
  const transferInByWalletId = new Map<string, number>();

  for (const group of walletTransactionGroups) {
    if (!group.walletId) {
      continue;
    }

    const currentBalance = walletTransactionBalanceById.get(group.walletId) ?? 0;

    walletTransactionBalanceById.set(
      group.walletId,
      currentBalance +
        signedWalletTransactionAmount({
          amount: group._sum.amount,
          adjustmentDirection: group.adjustmentDirection,
          type: group.type
        })
    );
  }

  for (const group of transferOutGroups) {
    if (group.fromWalletId) {
      transferOutByWalletId.set(group.fromWalletId, decimalToNumber(group._sum.amount));
    }
  }

  for (const group of transferInGroups) {
    if (group.toWalletId) {
      transferInByWalletId.set(group.toWalletId, decimalToNumber(group._sum.amount));
    }
  }

  const walletSummaries = wallets.map((wallet) => {
    const transactionBalance = walletTransactionBalanceById.get(wallet.id) ?? 0;
    const transferOut = transferOutByWalletId.get(wallet.id) ?? 0;
    const transferIn = transferInByWalletId.get(wallet.id) ?? 0;

    return {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: decimalToNumber(wallet.initialBalance) + transactionBalance + transferIn - transferOut,
      tone: walletTones[wallet.type].badge
    };
  });

  const wifeWallet = walletSummaries.find((wallet) => wallet.type === "wife");

  const categorySummaries = categoryGroups.map((group) => ({
    id: group.categoryId ?? "uncategorized",
    name: group.categoryId ? categoryNameById.get(group.categoryId) ?? "Tanpa Kategori" : "Tanpa Kategori",
    amount: decimalToNumber(group._sum.amount)
  }));

  const maxCategoryAmount = Math.max(...categorySummaries.map((category) => category.amount), 0);

  return {
    monthKey: month.key,
    monthLabel: month.label,
    previousMonthKey: month.previousKey,
    nextMonthKey: month.nextKey,
    operationalExpense: decimalToNumber(monthExpenseSum._sum.amount),
    monthlyTopUp: decimalToNumber(monthTopUpSum._sum.amount),
    homeSetupExpense: decimalToNumber(homeSetupExpenseSum._sum.amount),
    totalWalletBalance: walletSummaries.reduce((sum, wallet) => sum + wallet.balance, 0),
    wallets: walletSummaries,
    categorySummaries,
    maxCategoryAmount,
    wifeSummary: {
      balance: wifeWallet?.balance ?? 0,
      transferIn: decimalToNumber(wifeTransferIn._sum.amount),
      expense: decimalToNumber(wifeExpense._sum.amount)
    },
    recentTransactions: recentTransactions.map((transaction) => {
      const amount = decimalToNumber(transaction.amount);
      const transferSubtitle = [transaction.fromWallet?.name, transaction.toWallet?.name]
        .filter(Boolean)
        .join(" -> ");

      return {
        id: transaction.id,
        title:
          transaction.category?.name ??
          (transaction.type === "top_up"
            ? `Top Up ${transaction.wallet?.name ?? ""}`.trim()
            : transaction.type === "transfer"
              ? "Transfer"
              : "Adjustment"),
        subtitle:
          transaction.type === "top_up"
            ? transaction.sourceAccount?.name ?? transaction.wallet?.name ?? "-"
            : (transaction.wallet?.name ?? transferSubtitle) || "-",
        note: transaction.description,
        amount: transaction.type === "expense" ? -amount : amount,
        type: transaction.type
      };
    })
  };
}
