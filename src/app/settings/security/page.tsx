import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { requireUser } from "@/lib/auth/session";

export default async function SecuritySettingsPage() {
  const currentUser = await requireUser();

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">profile</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Keamanan</h1>
            <p className="mt-1 text-sm text-[#737373]">Account security</p>
          </div>
          <Link
            href="/profile"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke profil"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <section className="mt-5 rounded-[22px] bg-[#171717] p-4 text-white shadow-lg shadow-black/10">
          <p className="text-xs font-bold uppercase tracking-normal text-[#A3A3A3]">login aktif</p>
          <p className="mt-3 text-3xl font-light">{currentUser.username}</p>
          <p className="mt-1 text-xs font-semibold text-[#A3A3A3]">{currentUser.role} · password protected</p>
        </section>

        <section className="mt-5 overflow-hidden rounded-[18px] bg-[#E5E5E5] shadow-sm">
          <div className="flex h-16 items-center gap-3 px-4">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#F5F5F5] text-[#737373]">
              <KeyRound size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#171717]">Password</p>
              <p className="mt-1 text-xs font-semibold text-[#737373]">Aktif</p>
            </div>
          </div>
          <div className="flex h-16 items-center gap-3 border-t border-[#D4D4D4] px-4">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#F5F5F5] text-[#737373]">
              <ShieldCheck size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#171717]">Session</p>
              <p className="mt-1 text-xs font-semibold text-[#737373]">Cookie lokal</p>
            </div>
          </div>
        </section>

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
