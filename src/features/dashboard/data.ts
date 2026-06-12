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

function transactionSign(type: TransactionType) {
  if (type === "top_up") {
    return 1;
  }

  if (type === "expense") {
    return -1;
  }

  return 0;
}

export async function getDashboardData(month: MonthContext) {
  const { start, end } = month;

  const [wallets, monthExpenseSum, monthTopUpSum, homeSetupExpenseSum, categoryGroups, recentTransactions] =
    await Promise.all([
      prisma.wallet.findMany({
        orderBy: {
          sortOrder: "asc"
        },
        include: {
          transactions: {
            where: {
              deletedAt: null
            },
            select: {
              type: true,
              amount: true,
              adjustmentDirection: true
            }
          },
          transfersOut: {
            where: {
              deletedAt: null,
              type: "transfer"
            },
            select: {
              amount: true
            }
          },
          transfersIn: {
            where: {
              deletedAt: null,
              type: "transfer"
            },
            select: {
              amount: true
            }
          }
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

  const walletSummaries = wallets.map((wallet) => {
    const transactionBalance = wallet.transactions.reduce((sum, transaction) => {
      if (transaction.type === "adjustment") {
        const amount = decimalToNumber(transaction.amount);
        return transaction.adjustmentDirection === "decrease" ? sum - amount : sum + amount;
      }

      return sum + decimalToNumber(transaction.amount) * transactionSign(transaction.type);
    }, 0);

    const transferOut = wallet.transfersOut.reduce(
      (sum, transaction) => sum + decimalToNumber(transaction.amount),
      0
    );
    const transferIn = wallet.transfersIn.reduce(
      (sum, transaction) => sum + decimalToNumber(transaction.amount),
      0
    );

    return {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: decimalToNumber(wallet.initialBalance) + transactionBalance + transferIn - transferOut,
      tone: walletTones[wallet.type].badge
    };
  });

  const wifeWallet = walletSummaries.find((wallet) => wallet.type === "wife");
  const wifeExpense = await prisma.transaction.aggregate({
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
  });

  const wifeTransferIn = await prisma.transaction.aggregate({
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
  });

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
