"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type MonthNavigationProps = {
  label: string;
  previousHref: string;
  nextHref: string;
};

const buttonClass =
  "grid h-9 w-9 place-items-center rounded-[12px] bg-[#F5F5F5] text-[#525252] transition hover:bg-[#D4D4D4]";

export function MonthNavigation({ label, previousHref, nextHref }: MonthNavigationProps) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch(previousHref);
    router.prefetch(nextHref);
  }, [nextHref, previousHref, router]);

  const warmRoute = (href: string) => {
    router.prefetch(href);
  };

  return (
    <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[#E5E5E5] p-1.5 shadow-sm">
      <Link
        href={previousHref}
        prefetch
        className={cn(buttonClass, pendingHref === previousHref && "scale-95 bg-[#D4D4D4]")}
        aria-label="Bulan sebelumnya"
        onClick={() => setPendingHref(previousHref)}
        onPointerEnter={() => warmRoute(previousHref)}
        onTouchStart={() => warmRoute(previousHref)}
      >
        <ChevronLeft size={18} strokeWidth={1.8} />
      </Link>
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">periode</p>
        <p className="text-sm font-bold text-[#171717]">{label}</p>
      </div>
      <Link
        href={nextHref}
        prefetch
        className={cn(buttonClass, pendingHref === nextHref && "scale-95 bg-[#D4D4D4]")}
        aria-label="Bulan berikutnya"
        onClick={() => setPendingHref(nextHref)}
        onPointerEnter={() => warmRoute(nextHref)}
        onTouchStart={() => warmRoute(nextHref)}
      >
        <ChevronRight size={18} strokeWidth={1.8} />
      </Link>
    </div>
  );
}
