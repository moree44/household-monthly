import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { PrivacyToggle, PrivateAmount } from "@/features/privacy/privacy";
import { WealthManager } from "@/features/wealth/components/wealth-manager";
import { getWealthOverview } from "@/features/wealth/data";
import { requireUser } from "@/lib/auth/session";

export default async function WealthPage() {
  const currentUser = await requireUser();
  const wealth = await getWealthOverview(currentUser.role === "admin");
  const atmTotal = wealth.holdings
    .filter((holding) => holding.isActive && holding.kind !== "crypto")
    .reduce((sum, holding) => sum + holding.idrValue, 0);
  const cryptoTotal = wealth.holdings
    .filter((holding) => holding.isActive && holding.kind === "crypto")
    .reduce((sum, holding) => sum + holding.idrValue, 0);

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="app-canvas mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0A0A0A]">Kekayaan</h1>
          </div>
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <Link
              href="/dashboard"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm wide:hidden"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft size={19} strokeWidth={1.8} />
            </Link>
          </div>
        </header>

        <section className="mt-5 rounded-[22px] bg-[#171717] p-5 text-white shadow-xl shadow-black/15">
          <p className="text-3xl tracking-normal">
            <PrivateAmount value={wealth.netWorth} />
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center wide:grid-cols-4">
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">Wallet harian</p>
              <p className="mt-1 text-xs font-bold">
                <PrivateAmount value={wealth.operationalTotal} />
              </p>
            </div>
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">ATM</p>
              <p className="mt-1 text-xs font-bold">
                <PrivateAmount value={atmTotal} />
              </p>
            </div>
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">Crypto</p>
              <p className="mt-1 text-xs font-bold">
                <PrivateAmount value={cryptoTotal} />
              </p>
            </div>
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">Aset</p>
              <p className="mt-1 text-xs font-bold">
                <PrivateAmount value={wealth.assetTotal} />
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[16px] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#171717]">Wallet harian</h2>
          <div className="mt-3 grid gap-1.5">
            {wealth.operationalWallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#525252]">{wallet.name}</span>
                <span className="font-bold text-[#171717]">
                  <PrivateAmount value={wallet.balance} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5">
          <WealthManager holdings={wealth.holdings} assets={wealth.assets} />
        </div>

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
