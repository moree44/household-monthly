import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, ArrowRightLeft, ArrowUpRight } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ExpenseForm } from "@/features/transactions/components/expense-form";
import { requireUser } from "@/lib/auth/session";
import { formatAppDateInputValue } from "@/lib/date/timezone";
import { prisma } from "@/lib/db/prisma";

export default async function NewExpensePage() {
  await requireUser();

  const [wallets, categories] = await Promise.all([
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
    })
  ]);

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-3.5 pb-6 pt-4 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:px-4 sm:pt-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">catat transaksi</p>
            <h1 className="text-xl font-bold text-[#0A0A0A]">Catat</h1>
            <p className="mt-1 text-sm text-[#737373]">Transaksi baru</p>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <nav className="mt-3 grid grid-cols-3 gap-1.5 rounded-[15px] bg-[#E5E5E5] p-1.5 shadow-sm">
          <Link
            href="/expenses/new"
            className="flex h-8 items-center justify-center gap-1.5 rounded-[11px] bg-[#171717] text-xs font-bold !text-[#FAFAFA] shadow-sm"
          >
            <ArrowUpRight size={15} strokeWidth={2} />
            Expense
          </Link>
          <Link
            href="/transfers/new"
            className="flex h-8 items-center justify-center gap-1.5 rounded-[11px] text-xs font-bold text-[#737373] transition hover:bg-[#F5F5F5]"
          >
            <ArrowRightLeft size={15} strokeWidth={2} />
            Transfer
          </Link>
          <Link
            href="/top-ups/new"
            className="flex h-8 items-center justify-center gap-1.5 rounded-[11px] text-xs font-bold text-[#737373] transition hover:bg-[#F5F5F5]"
          >
            <ArrowDownLeft size={15} strokeWidth={2} />
            Top Up
          </Link>
        </nav>

        <div className="mt-3">
          <ExpenseForm
            wallets={wallets}
            categories={categories}
            defaultDate={formatAppDateInputValue(new Date())}
          />
        </div>

        <BottomNav active="catat" />
      </div>
    </main>
  );
}
