"use client";

import {
  CircleUserRound,
  History,
  Home,
  Landmark,
  MessageCircle,
  Plus,
  Target
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", match: "/dashboard", label: "Home", icon: Home },
  { href: "/history", match: "/history", label: "History", icon: History },
  { href: "/chat", match: "/chat", label: "Chat AI", icon: MessageCircle },
  { href: "/goals", match: "/goals", label: "Goals", icon: Target },
  { href: "/wealth", match: "/wealth", label: "Kekayaan", icon: Landmark },
  { href: "/profile", match: "/profile", label: "Profil", icon: CircleUserRound }
];

function isActive(pathname: string, match: string) {
  if (match === "/profile") {
    return pathname === "/profile" || pathname.startsWith("/settings");
  }

  if (match === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }

  return pathname === match || pathname.startsWith(`${match}/`);
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const catatActive =
    pathname.startsWith("/expenses") || pathname.startsWith("/transfers") || pathname.startsWith("/top-ups");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#171717] px-4 py-6 text-white wide:flex">
      <div className="px-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#A3A3A3]">Household</p>
        <p className="mt-1 text-lg font-bold">Monthly</p>
      </div>

      <Link
        href="/expenses/new"
        className={cn(
          "mt-6 flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-bold shadow-lg",
          catatActive
            ? "bg-blue-500 text-white shadow-blue-500/20"
            : "bg-blue-500 text-white shadow-blue-500/20 hover:bg-blue-600"
        )}
      >
        <Plus size={18} strokeWidth={2} />
        Catat
      </Link>

      <nav className="mt-6 grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const on = isActive(pathname, item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "flex h-11 items-center gap-3 rounded-[12px] px-3 text-sm font-semibold transition",
                on ? "bg-white/10 text-white" : "text-[#A3A3A3] hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
