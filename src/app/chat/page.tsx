import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ChatPanel } from "@/features/transactions/components/chat-sheet";
import { requireUser } from "@/lib/auth/session";

// Arbitrase AI butuh 12-15 detik (model reasoning) — di Vercel default
// function limit 10 detik, jadi naikkan lewat segment config halaman ini.
export const maxDuration = 60;

export default async function ChatPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="app-canvas-mid mx-auto flex min-h-screen max-w-[430px] flex-col bg-[#F5F5F5] px-4 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] wide:max-w-none">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0A0A0A]">Chat AI</h1>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm wide:hidden"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <ChatPanel className="mt-4 min-h-[520px] flex-1 wide:min-h-[calc(100vh-8rem)]" />
        <BottomNav active="home" />
      </div>
    </main>
  );
}
