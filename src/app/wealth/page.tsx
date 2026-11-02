import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { PrivacyToggle, PrivateAmount } from "@/features/privacy/privacy";
import { WealthManager } from "@/features/wealth/components/wealth-manager";
import { getWealthOverview } from "@/features/wealth/data";
import { requireUser } from "@/lib/auth/session";

export default async function WealthPage() {
  const currentUser = await requireUser();
  const wealth = await getWealthOverview(currentUser.role === "admin");

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="app-canvas mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">kekayaan</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Semua keuangan</h1>
            <p className="mt-1 text-sm text-[#737373]">Wallet harian + ATM, crypto, aset</p>
          </div>
          <div className="flex items-center gap-2">
            <PrivacyToggle />
            <Link
              href="/dashboard"
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft size={19} strokeWidth={1.8} />
            </Link>
          </div>
        </header>

        <section className="mt-5 rounded-[22px] bg-[#171717] p-5 text-white shadow-xl shadow-black/15">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#A3A3A3]">perkiraan net worth</p>
          <p className="mt-2 text-3xl tracking-normal"><PrivateAmount value={wealth.netWorth} /></p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">Operasional</p>
              <p className="mt-1 text-xs font-bold"><PrivateAmount value={wealth.operationalTotal} /></p>
            </div>
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">Akun</p>
              <p className="mt-1 text-xs font-bold"><PrivateAmount value={wealth.holdingTotal} /></p>
            </div>
            <div className="rounded-[12px] bg-[#262626] px-2 py-2">
              <p className="text-[10px] font-medium text-[#A3A3A3]">Aset</p>
              <p className="mt-1 text-xs font-bold"><PrivateAmount value={wealth.assetTotal} /></p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[16px] bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#171717]">
            <Landmark size={14} strokeWidth={1.8} />
            Wallet operasional
          </div>
          <div className="grid gap-1.5">
            {wealth.operationalWallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#525252]">{wallet.name}</span>
                <span className="font-bold text-[#171717]"><PrivateAmount value={wallet.balance} /></span>
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
