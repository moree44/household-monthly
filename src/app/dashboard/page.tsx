import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CircleUserRound,
  History,
  Landmark,
  MessageCircle,
  Settings,
  Tags
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
  },
  {
    href: "/expenses/new?mode=chat",
    label: "Chat AI",
    icon: MessageCircle,
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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentUser = await requireUser();
  const resolvedSearchParams = await searchParams;
  const month = getMonthContext(resolvedSearchParams.month);
  const dashboard = await getDashboardData(month);

  const topCategories = dashboard.categorySummaries.slice(0, 3);
  const wifeUsagePercent =
    dashboard.wifeSummary.transferIn > 0
      ? Math.min((dashboard.wifeSummary.expense / dashboard.wifeSummary.transferIn) * 100, 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="app-canvas mx-auto min-h-screen max-w-6xl bg-[#F5F5F5] px-4 pb-6 pt-6 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:p-6 desktop:grid desktop:grid-cols-[400px_1fr] desktop:gap-6 desktop:rounded-[24px]">
        <section className="mx-auto w-full max-w-[430px] pb-3 tablet:max-w-none desktop:mx-0 desktop:max-w-none desktop:pb-0">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#737373]">Halo, {currentUser.displayName}</p>
              <h1 className="text-xl font-bold tracking-normal text-[#0A0A0A]">Household Monthly</h1>
            </div>
            <div className="flex items-center gap-2">
              <PrivacyToggle />
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

          <MonthNavigation
            label={dashboard.monthLabel}
            previousHref={withMonthParam("/dashboard", dashboard.previousMonthKey)}
            nextHref={withMonthParam("/dashboard", dashboard.nextMonthKey)}
          />

          <section className="mt-5 rounded-[22px] bg-[#171717] p-5 text-white shadow-xl shadow-black/15">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-[#A3A3A3]">
                total saldo
              </p>
              <p className="mt-2 text-4xl tracking-normal">
                <PrivateAmount value={dashboard.totalWalletBalance} />
              </p>
            </div>
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
            className="mt-5 flex items-center justify-between rounded-[18px] bg-white px-4 py-3 shadow-sm"
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-[#171717]">
                <Landmark size={16} strokeWidth={1.8} />
                Semua keuangan
              </span>
              <span className="mt-1 block text-xs text-[#737373]">ATM, Binance, mobil, motor</span>
            </span>
            <span className="text-xs font-bold text-blue-600">Buka</span>
          </Link>

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
                  <PrivateAmount value={dashboard.wifeSummary.expense} />
                </p>
              </div>
              <div>
                <p className="text-[#737373]">saldo</p>
                <p className="mt-1 text-sm text-[#171717]">
                  <PrivateAmount value={dashboard.wifeSummary.balance} />
                </p>
              </div>
              <div>
                <p className="text-[#737373]">masuk</p>
                <p className="mt-1 text-sm text-[#171717]">
                  <PrivateAmount value={dashboard.wifeSummary.transferIn} />
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 desktop:mb-0">
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
        </section>

        <aside className="hidden min-w-0 grid-cols-2 content-start gap-4 desktop:grid">
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
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-[#F5F5F5] text-[#171717] hover:bg-[#E5E5E5]"
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
                        <PrivateAmount value={category.amount} />
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
            <p className="mt-2 text-4xl"><PrivateAmount value={dashboard.operationalExpense} /></p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[16px] bg-[#262626] p-4">
                <p className="text-xs text-[#A3A3A3]">Tabungan Rumah</p>
                <p className="mt-2 text-lg"><PrivateAmount value={dashboard.homeSetupExpense} /></p>
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
