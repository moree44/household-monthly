import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { requireUser } from "@/lib/auth/session";

const swatches = ["#171717", "#262626", "#404040", "#737373", "#A3A3A3", "#D4D4D4", "#E5E5E5", "#F5F5F5"];

export default async function AppearanceSettingsPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">profile</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">Tampilan</h1>
            <p className="mt-1 text-sm text-[#737373]">Theme palette</p>
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-[#A3A3A3]">mode aktif</p>
              <p className="mt-3 text-3xl font-light">Soft Charcoal</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white">
              <Check size={18} strokeWidth={2} />
            </span>
          </div>
        </section>

        <section className="mt-5 rounded-[20px] bg-[#E5E5E5] p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#171717]">Palette</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {swatches.map((color) => (
              <div key={color}>
                <div className="h-14 rounded-[14px] border border-black/5 shadow-sm" style={{ backgroundColor: color }} />
                <p className="mt-2 text-center text-[10px] font-bold text-[#737373]">{color}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[18px] bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-[#171717]">Status</p>
          <p className="mt-2 text-sm font-semibold text-[#737373]">Warna utama sudah dipakai di dashboard, catat, history, dan profil.</p>
        </section>

        <BottomNav active="profile" />
      </div>
    </main>
  );
}
