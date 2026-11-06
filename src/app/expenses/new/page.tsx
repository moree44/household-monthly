import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { CatatTypeNav } from "@/features/transactions/components/catat-type-nav";
import { CatatWorkspace } from "@/features/transactions/components/catat-workspace";
import { requireUser } from "@/lib/auth/session";
import { formatAppDateInputValue } from "@/lib/date/timezone";
import { prisma } from "@/lib/db/prisma";

export default async function NewExpensePage() {
  const currentUser = await requireUser();

  const [wallets, categories, lastExpenseRow] = await Promise.all([
    prisma.wallet.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.category.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.transaction.findFirst({
      where: {
        type: "expense",
        deletedAt: null,
        createdById: currentUser.id,
        walletId: { not: null },
        categoryId: { not: null }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        amount: true,
        walletId: true,
        categoryId: true,
        description: true,
        wallet: {
          select: {
            isActive: true
          }
        },
        category: {
          select: {
            name: true,
            isActive: true
          }
        }
      }
    })
  ]);

  const lastExpense =
    lastExpenseRow?.walletId &&
    lastExpenseRow.categoryId &&
    lastExpenseRow.wallet?.isActive &&
    lastExpenseRow.category?.isActive
      ? {
          amount: new Intl.NumberFormat("id-ID").format(Number(lastExpenseRow.amount.toFixed(0))),
          walletId: lastExpenseRow.walletId,
          categoryId: lastExpenseRow.categoryId,
          description: lastExpenseRow.description ?? "",
          label: (lastExpenseRow.description || lastExpenseRow.category?.name || "pengeluaran").trim()
        }
      : null;

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="app-canvas-phone mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-3.5 pb-6 pt-4 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:px-4 sm:pt-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">catat transaksi</p>
            <h1 className="text-xl font-bold text-[#0A0A0A]">Catat</h1>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <CatatTypeNav active="expense" />

        <CatatWorkspace
          wallets={wallets}
          categories={categories}
          defaultDate={formatAppDateInputValue(new Date())}
          lastExpense={lastExpense}
        />

        <BottomNav active="catat" />
      </div>
    </main>
  );
}
