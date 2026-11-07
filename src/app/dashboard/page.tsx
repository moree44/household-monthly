import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CircleUserRound,
  History,
  Landmark,
  Settings
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { MonthNavigation } from "@/features/dashboard/components/month-navigation";
import { WalletSection } from "@/features/dashboard/components/wallet-section";
import { getDashboardData } from "@/features/dashboard/data";
import { PrivacyToggle, PrivateAmount } from "@/features/privacy/privacy";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { getMonthContext, withMonthParam } from "@/lib/date/month";

type DashboardPageProps = {
  searchParams: Promise<{
    month?: string | string[];
  }>;
};

const transactionIcon = {
  expense: ArrowUpRight,
  top_up: ArrowDownLeft,
  transfer: ArrowRightLeft,
  adjustment: Settings
};

const transactionIconTone = {
  expense: "bg-[#E5E5E5] text-[#525252]",
  top_up: "bg-[#171717] text-[#FAFAFA]",
  transfer: "bg-[#E5E5E5] text-[#525252]",
  adjustment: "bg-amber-50 text-amber-700"
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await requireUser();
  const resolvedSearchParams = await searchParams;
  const month = getMonthContext(resolvedSearchParams.month);
  const dashboard = await getDashboardData(month);

  const topCategories = dashboard.categorySummaries.slice(0, 4);

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="app-canvas mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-6 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:p-6 wide:p-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#737373]">Halo, {currentUser.displayName}</p>
            <h1 className="text-xl font-bold tracking-normal text-[#0A0A0A]">Household Monthly</h1>
          </div>
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <Link
              href={withMonthParam("/history", dashboard.monthKey)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA] wide:hidden"
              aria-label="History"
            >
              <History size={19} strokeWidth={1.8} />
            </Link>
            <Link
              href="/profile"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA] wide:hidden"
              aria-label="Profile"
            >
              <CircleUserRound size={19} strokeWidth={1.8} />
            </Link>
          </div>
        </header>

        <MonthNavigation
          label={dashboard.monthLabel}
          previousHref={withMonthParam("/dashboard", dashboard.previousMonthKey)}
          nextHref={withMonthParam("/dashboard", dashboard.nextMonthKey)}
        />

        <section className="mt-5 rounded-[22px] bg-[#171717] p-5 text-white shadow-xl shadow-black/15 wide:p-6">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#A3A3A3]">total saldo</p>
          <p className="mt-2 text-4xl tracking-normal wide:text-5xl">
            <PrivateAmount value={dashboard.totalWalletBalance} />
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[14px] bg-[#262626] px-4 py-3">
              <p className="text-xs font-medium text-[#A3A3A3]">Pengeluaran</p>
              <p className="mt-1 text-base font-semibold text-white">
                <PrivateAmount value={dashboard.operationalExpense} />
              </p>
            </div>
            <div className="rounded-[14px] bg-[#262626] px-4 py-3">
              <p className="text-xs font-medium text-[#A3A3A3]">Top Up</p>
              <p className="mt-1 text-base font-semibold text-white">
                <PrivateAmount value={dashboard.monthlyTopUp} />
              </p>
            </div>
          </div>
        </section>

        <WalletSection wallets={dashboard.wallets} />

        <Link
          href="/wealth"
          className="mt-5 flex items-center justify-between rounded-[18px] bg-white px-4 py-3 shadow-sm wide:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-[#171717]">
            <Landmark size={16} strokeWidth={1.8} />
            Kekayaan
          </span>
          <span className="text-xs font-bold text-blue-600">Buka</span>
        </Link>

        {/* Ringkasan Dompet Istri disembunyikan dulu (belum terpakai) —
            data tetap tersedia di dashboard.wifeSummary, tinggal pasang lagi
            kartu terpakai/saldo/masuk di sini kalau sudah dibutuhkan. */}
        <section className="mt-5 rounded-[18px] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#171717]">Kategori</h2>
          {topCategories.length > 0 ? (
            <div className="mt-4 space-y-3">
              {topCategories.map((category) => (
                <div key={category.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-[#262626]">{category.name}</span>
                    <span className="text-sm text-[#171717]">
                      <PrivateAmount value={category.amount} />
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5E5E5]">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min((category.amount / dashboard.maxCategoryAmount) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#737373]">Belum ada pengeluaran.</p>
          )}
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#171717]">Transaksi</h2>
            <Link href="/history" className="text-xs font-semibold text-blue-600">
              lihat semua
            </Link>
          </div>
          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
            {dashboard.recentTransactions.length > 0 ? (
              <div className="divide-y divide-[#E5E5E5]">
                {dashboard.recentTransactions.map((transaction) => {
                  const Icon = transactionIcon[transaction.type];

                  return (
                    <div key={transaction.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px]",
                          transactionIconTone[transaction.type]
                        )}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#171717]">{transaction.title}</p>
                        <p className="mt-0.5 truncate text-xs text-[#737373]">
                          {transaction.subtitle}
                          {transaction.note ? ` · ${transaction.note}` : ""}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm",
                          transaction.type === "top_up" ? "text-blue-600" : "text-[#171717]"
                        )}
                      >
                        <PrivateAmount value={transaction.amount} />
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-5 text-sm text-[#737373]">Belum ada transaksi.</p>
            )}
          </div>
        </section>

        <BottomNav active="home" monthKey={dashboard.monthKey} />
      </div>
    </main>
  );
}
