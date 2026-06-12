import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CircleUserRound,
  History,
  Plus,
  Settings,
  Tags,
  ChevronLeft,
  ChevronRight,
  Wallet,
  House,
  Heart,
  Shield
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { getDashboardData } from "@/features/dashboard/data";
import { formatRupiah } from "@/lib/format/currency";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { getMonthContext, withMonthParam } from "@/lib/date/month";

type DashboardPageProps = {
  searchParams: Promise<{
    month?: string | string[];
  }>;
};

const walletIcon = {
  operational: House,
  wife: Heart,
  home_setup: MoneyBagIcon,
  emergency: Shield,
  custom: Wallet
};

const quickActions = [
  {
    href: "/expenses/new",
    label: "Expense",
    icon: ArrowUpRight,
    variant: "primary"
  },
  {
    href: "/transfers/new",
    label: "Transfer",
    icon: ArrowRightLeft,
    variant: "secondary"
  },
  {
    href: "/top-ups/new",
    label: "Top Up",
    icon: ArrowDownLeft,
    variant: "secondary"
  }
];

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

function MoneyBagIcon({ size = 17, strokeWidth = 1.9 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      <path d="M9 3h6l-2 4h-2L9 3Z" />
      <path d="M7.5 9.5C5.7 11.2 4.5 14 4.5 16.5C4.5 20 7.4 21 12 21s7.5-1 7.5-4.5c0-2.5-1.2-5.3-3-7" />
      <path d="M8 8h8" />
      <circle cx="12" cy="15" r="1.5" />
    </svg>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await requireUser();
  const resolvedSearchParams = await searchParams;
  const month = getMonthContext(resolvedSearchParams.month);
  const dashboard = await getDashboardData(month);

  const primaryWallets = dashboard.wallets.slice(0, 4);
  const topCategories = dashboard.categorySummaries.slice(0, 3);
  const wifeUsagePercent =
    dashboard.wifeSummary.transferIn > 0
      ? Math.min((dashboard.wifeSummary.expense / dashboard.wifeSummary.transferIn) * 100, 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-6xl bg-[#F5F5F5] px-4 pb-6 pt-6 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:p-6 lg:grid lg:grid-cols-[400px_1fr] lg:gap-6 lg:rounded-[24px]">
        <section className="mx-auto w-full max-w-[430px] pb-3 lg:mx-0 lg:max-w-none lg:pb-0">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#737373]">Halo, {currentUser.displayName}</p>
              <h1 className="text-xl font-bold tracking-normal text-[#0A0A0A]">Household Monthly</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={withMonthParam("/history", dashboard.monthKey)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
                aria-label="History"
              >
                <History size={19} strokeWidth={1.8} />
              </Link>
              <Link
                href="/profile"
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
                aria-label="Profile"
              >
                <CircleUserRound size={19} strokeWidth={1.8} />
              </Link>
            </div>
          </header>

          <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[#E5E5E5] p-1.5 shadow-sm">
            <Link
              href={withMonthParam("/dashboard", dashboard.previousMonthKey)}
              className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F5F5F5] text-[#525252] transition hover:bg-[#D4D4D4]"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </Link>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">periode</p>
              <p className="text-sm font-bold text-[#171717]">{dashboard.monthLabel}</p>
            </div>
            <Link
              href={withMonthParam("/dashboard", dashboard.nextMonthKey)}
              className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F5F5F5] text-[#525252] transition hover:bg-[#D4D4D4]"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </Link>
          </div>

          <section className="mt-5 rounded-[22px] bg-[#171717] p-5 text-white shadow-xl shadow-black/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-[#A3A3A3]">
                  total saldo
                </p>
                <p className="mt-2 text-4xl tracking-normal">
                  {formatRupiah(dashboard.totalWalletBalance)}
                </p>
              </div>
              <span className="rounded-full bg-[#404040] px-3 py-2 text-xs font-semibold text-[#D4D4D4]">
                {dashboard.monthLabel}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[14px] bg-[#262626] px-4 py-3">
                <p className="text-xs font-medium text-[#A3A3A3]">Pengeluaran</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {formatRupiah(dashboard.operationalExpense)}
                </p>
              </div>
              <div className="rounded-[14px] bg-[#262626] px-4 py-3">
                <p className="text-xs font-medium text-[#A3A3A3]">Top Up</p>
                <p className="mt-1 text-base font-semibold text-white">
                  {formatRupiah(dashboard.monthlyTopUp)}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#171717]">Wallet</h2>
              <button
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#262626] shadow-sm"
                aria-label="Add wallet"
              >
                <Plus size={18} strokeWidth={1.8} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {primaryWallets.map((wallet, index) => {
                const Icon = walletIcon[wallet.type] ?? Wallet;

                return (
                  <div
                    key={wallet.id}
                    className={cn(
                      "min-h-[108px] rounded-[16px] p-4 shadow-sm",
                      index === 0 ? "bg-[#262626] text-white" : "bg-[#E5E5E5] text-[#171717]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-[11px]",
                        index === 0 ? "bg-[#404040] text-[#F5F5F5]" : "bg-[#D4D4D4] text-[#404040]"
                      )}
                    >
                      <Icon size={17} strokeWidth={1.9} />
                    </span>
                    <p
                      className={cn(
                        "mt-3 text-xs font-semibold",
                        index === 0 ? "text-[#D4D4D4]" : "text-[#737373]"
                      )}
                    >
                      {wallet.name}
                    </p>
                    <p
                      className={cn(
                        "mt-2 text-xl font-semibold",
                        index === 0 ? "text-white" : "text-[#171717]"
                      )}
                    >
                      {formatRupiah(wallet.balance)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-[18px] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#171717]">Dompet Istri</h2>
                <p className="mt-1 text-xs text-[#737373]">Ringkasan bulan ini</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                aktif
              </span>
            </div>
            <div className="mt-4 h-1 rounded-full bg-[#E5E5E5]">
              <div
                className="h-1 rounded-full bg-blue-500"
                style={{
                  width: `${wifeUsagePercent}%`
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[#737373]">terpakai</p>
                <p className="mt-1 text-sm text-[#171717]">
                  {formatRupiah(dashboard.wifeSummary.expense)}
                </p>
              </div>
              <div>
                <p className="text-[#737373]">saldo</p>
                <p className="mt-1 text-sm text-[#171717]">
                  {formatRupiah(dashboard.wifeSummary.balance)}
                </p>
              </div>
              <div>
                <p className="text-[#737373]">masuk</p>
                <p className="mt-1 text-sm text-[#171717]">
                  {formatRupiah(dashboard.wifeSummary.transferIn)}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 lg:mb-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#171717]">Transaksi Terbaru</h2>
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
                          <p className="truncate text-sm font-bold text-[#171717]">
                            {transaction.title}
                          </p>
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
                          {formatRupiah(transaction.amount)}
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
        </section>

        <aside className="hidden min-w-0 grid-cols-2 content-start gap-4 lg:grid">
          <section className="rounded-[22px] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#171717]">Aksi Cepat</h2>
                <p className="mt-1 text-sm text-[#737373]">Catat transaksi harian.</p>
              </div>
              <Settings size={20} strokeWidth={1.8} className="text-[#737373]" />
            </div>
            <div className="mt-5 grid gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "flex h-12 items-center justify-center gap-2 rounded-[14px] text-sm font-bold shadow-sm transition",
                      action.variant === "primary"
                        ? "bg-[#171717] text-white hover:bg-[#262626]"
                        : "bg-white text-[#171717] hover:bg-[#FAFAFA]"
                    )}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[22px] bg-[#E5E5E5] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#171717]">Kategori Bulan Ini</h2>
                <p className="mt-1 text-sm text-[#737373]">Pengeluaran terbesar.</p>
              </div>
              <Tags size={20} strokeWidth={1.8} className="text-[#737373]" />
            </div>
            {topCategories.length > 0 ? (
              <div className="mt-5 space-y-4">
                {topCategories.map((category) => (
                  <div key={category.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[#262626]">{category.name}</span>
                      <span className="text-sm text-[#171717]">
                        {formatRupiah(category.amount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#D4D4D4]">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            (category.amount / dashboard.maxCategoryAmount) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-[14px] bg-white px-4 py-5 text-sm text-[#737373]">
                Belum ada pengeluaran bulan ini.
              </p>
            )}
          </section>

          <section className="col-span-2 rounded-[22px] bg-[#171717] p-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-[#A3A3A3]">pengeluaran operasional</p>
            <p className="mt-2 text-4xl">{formatRupiah(dashboard.operationalExpense)}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[16px] bg-[#262626] p-4">
                <p className="text-xs text-[#A3A3A3]">Tabungan Rumah</p>
                <p className="mt-2 text-lg">{formatRupiah(dashboard.homeSetupExpense)}</p>
              </div>
              <div className="rounded-[16px] bg-[#262626] p-4">
                <p className="text-xs text-[#A3A3A3]">Wallet</p>
                <p className="mt-2 text-lg">{dashboard.wallets.length} aktif</p>
              </div>
              <div className="rounded-[16px] bg-[#262626] p-4">
                <p className="text-xs text-[#A3A3A3]">Kategori</p>
                <p className="mt-2 text-lg">{dashboard.categorySummaries.length} terpakai</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
