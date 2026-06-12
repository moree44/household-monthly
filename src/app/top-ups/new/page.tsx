import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, ArrowRightLeft, ArrowUpRight } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopUpForm } from "@/features/transactions/components/top-up-form";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function NewTopUpPage() {
  await requireUser();

  const [wallets, sourceAccounts] = await Promise.all([
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
    prisma.sourceAccount.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        owner: true
      }
    })
  ]);

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-3.5 pb-6 pt-4 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:px-4 sm:pt-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">catat transaksi</p>
            <h1 className="text-xl font-bold text-[#0A0A0A]">Top Up</h1>
            <p className="mt-1 text-sm text-[#737373]">Dana masuk ke wallet</p>
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
            className="flex h-8 items-center justify-center gap-1.5 rounded-[11px] text-xs font-bold text-[#737373] transition hover:bg-[#F5F5F5]"
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
            className="flex h-8 items-center justify-center gap-1.5 rounded-[11px] bg-[#171717] text-xs font-bold !text-[#FAFAFA] shadow-sm"
          >
            <ArrowDownLeft size={15} strokeWidth={2} />
            Top Up
          </Link>
        </nav>

        <div className="mt-3">
          <TopUpForm
            wallets={wallets}
            sourceAccounts={sourceAccounts}
            defaultDate={formatDateInputValue(new Date())}
          />
        </div>

        <BottomNav active="catat" />
      </div>
    </main>
  );
}
