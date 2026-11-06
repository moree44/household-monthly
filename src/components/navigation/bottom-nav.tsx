import { CircleUserRound, History, Home, Plus, Target } from "lucide-react";
import Link from "next/link";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { ChatDock } from "@/features/transactions/components/chat-dock";
import { cn } from "@/lib/utils";
import { withMonthParam } from "@/lib/date/month";

type BottomNavItem = "home" | "history" | "catat" | "goals" | "profile";

type BottomNavProps = {
  active: BottomNavItem;
  monthKey?: string;
};

export function BottomNav({ active, monthKey }: BottomNavProps) {
  const dashboardHref = monthKey ? withMonthParam("/dashboard", monthKey) : "/dashboard";
  const historyHref = monthKey ? withMonthParam("/history", monthKey) : "/history";

  const itemClass = (item: BottomNavItem) =>
    cn(
      "grid h-12 place-items-center transition hover:text-white",
      active === item ? "text-white" : "text-[#737373]"
    );

  const itemStyle = (item: BottomNavItem) => ({
    color: active === item ? "#FFFFFF" : "#737373"
  });

  return (
    <>
      <DesktopSidebar />
      <ChatDock />
      <div className="h-[calc(8.75rem+env(safe-area-inset-bottom,0px))] wide:hidden" />
      <nav className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-20 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 overflow-visible rounded-[24px] bg-[#171717] px-5 py-3 shadow-xl shadow-black/20 wide:hidden">
        <div className="grid h-full grid-cols-5 items-center">
          <Link href={dashboardHref} prefetch className={itemClass("home")} style={itemStyle("home")} aria-label="Home">
            <Home size={20} strokeWidth={1.8} />
          </Link>
          <Link href={historyHref} prefetch className={itemClass("history")} style={itemStyle("history")} aria-label="History">
            <History size={20} strokeWidth={1.8} />
          </Link>
          <Link href="/expenses/new" prefetch className={cn("relative", itemClass("catat"))} style={itemStyle("catat")} aria-label="Catat">
            <span className="absolute -top-8 grid h-14 w-14 place-items-center rounded-full border-4 border-[#171717] bg-blue-500 text-white shadow-lg shadow-blue-500/30">
              <Plus size={24} strokeWidth={2} />
            </span>
          </Link>
          <Link href="/goals" prefetch className={itemClass("goals")} style={itemStyle("goals")} aria-label="Goals">
            <Target size={20} strokeWidth={1.8} />
          </Link>
          <Link href="/profile" prefetch className={itemClass("profile")} style={itemStyle("profile")} aria-label="Profil">
            <CircleUserRound size={20} strokeWidth={1.8} />
          </Link>
        </div>
      </nav>
    </>
  );
}
