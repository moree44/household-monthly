import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { WalletManager } from "@/features/settings/components/wallet-manager";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function WalletSettingsPage() {
  await requireUser();

  const wallets = await prisma.wallet.findMany({
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        name: "asc"
      }
    ],
    include: {
      _count: {
        select: {
          transactions: true
        }
      }
    }
  });

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">profile</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Kelola Wallet</h1>
            <p className="mt-1 text-sm text-[#737373]">Wallet list</p>
          </div>
          <Link
            href="/profile"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke profil"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <WalletManager
          wallets={wallets.map((wallet) => ({
            id: wallet.id,
            name: wallet.name,
            type: wallet.type,
            initialBalance: Number(wallet.initialBalance),
            isActive: wallet.isActive,
            transactionCount: wallet._count.transactions
          }))}
        />

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
