import { CircleUserRound, History, Home, Plus, Target } from "lucide-react";
import Link from "next/link";
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
      "grid h-12 content-end justify-items-center gap-1 transition hover:text-white",
      active === item ? "text-white" : "text-[#737373]"
    );

  const itemStyle = (item: BottomNavItem) => ({
    color: active === item ? "#FFFFFF" : "#737373"
  });

  return (
    <>
      <div className="h-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:hidden" />
      <nav className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-20 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 overflow-visible rounded-[24px] bg-[#171717] px-5 py-3 text-[11px] font-semibold shadow-xl shadow-black/20 lg:hidden">
        <div className="grid h-full grid-cols-5 items-end">
          <Link href={dashboardHref} className={itemClass("home")} style={itemStyle("home")}>
            <Home size={18} strokeWidth={1.8} />
            home
          </Link>
          <Link href={historyHref} className={itemClass("history")} style={itemStyle("history")}>
            <History size={18} strokeWidth={1.8} />
            history
          </Link>
          <Link href="/expenses/new" className={cn("relative", itemClass("catat"))} style={itemStyle("catat")}>
            <span className="absolute -top-8 grid h-14 w-14 place-items-center rounded-full border-4 border-[#171717] bg-blue-500 text-white shadow-lg shadow-blue-500/30">
              <Plus size={24} strokeWidth={2} />
            </span>
            catat
          </Link>
          <Link href="/goals" className={itemClass("goals")} style={itemStyle("goals")}>
            <Target size={18} strokeWidth={1.8} />
            goals
          </Link>
          <Link href="/profile" className={itemClass("profile")} style={itemStyle("profile")}>
            <CircleUserRound size={18} strokeWidth={1.8} />
            profil
          </Link>
        </div>
      </nav>
    </>
  );
}
