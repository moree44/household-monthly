import {
  ArrowLeft,
  LogOut,
  Palette,
  Shield,
  Tags,
  UserCog,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const menuItems = [
  {
    label: "Kelola Pengguna",
    href: "/settings/users",
    icon: UserCog
  },
  {
    label: "Kelola Wallet",
    href: "/settings/wallets",
    icon: WalletCards
  },
  {
    label: "Kelola Kategori",
    href: "/settings/categories",
    icon: Tags
  },
  {
    label: "Tampilan",
    href: "/settings/appearance",
    icon: Palette
  },
  {
    label: "Keamanan",
    href: "/settings/security",
    icon: Shield
  }
];

export default async function ProfilePage() {
  const currentUser = await requireUser();

  const [transactionCount, walletCount, categoryCount] = await Promise.all([
    prisma.transaction.count({
      where: {
        deletedAt: null
      }
    }),
    prisma.wallet.count({
      where: {
        isActive: true
      }
    }),
    prisma.category.count({
      where: {
        isActive: true
      }
    })
  ]);

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">profile</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Profil</h1>
            <p className="mt-1 text-sm text-[#737373]">Pengaturan akun</p>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <section className="mt-5 rounded-[22px] bg-[#E5E5E5] p-4 text-[#171717] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#171717] text-base font-bold text-white">
              {currentUser.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#171717]">{currentUser.displayName}</h2>
              <p className="mt-1 text-sm font-semibold text-[#737373]">
                {currentUser.role} · {currentUser.username}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[14px] bg-[#F5F5F5] px-2 py-3">
              <p className="text-lg font-bold">{transactionCount}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#737373]">transaksi</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F5F5] px-2 py-3">
              <p className="text-lg font-bold">{walletCount}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#737373]">wallet</p>
            </div>
            <div className="rounded-[14px] bg-[#F5F5F5] px-2 py-3">
              <p className="text-lg font-bold">{categoryCount}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#737373]">kategori</p>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[18px] bg-[#E5E5E5] shadow-sm">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex h-14 w-full items-center gap-3 px-4 text-left text-sm font-bold text-[#171717] transition hover:bg-[#D4D4D4] ${
                  index > 0 ? "border-t border-[#D4D4D4]" : ""
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F5F5F5] text-[#737373]">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </section>

        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-50"
          >
            <LogOut size={18} strokeWidth={1.8} />
            Keluar
          </button>
        </form>

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
