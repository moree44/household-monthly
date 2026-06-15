"use client";

import type { WalletType } from "@prisma/client";
import { Heart, House, Plus, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatRupiah } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

type DashboardWallet = {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
};

type WalletSectionProps = {
  wallets: DashboardWallet[];
};

const walletIcon = {
  operational: House,
  wife: Heart,
  home_setup: MoneyBagIcon,
  emergency: Shield,
  custom: Wallet
};

function MoneyBagIcon({ size = 17, strokeWidth = 1.9 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      <path d="M9 3h6l-2 4h-2L9 3Z" />
      <path d="M7.5 9.5C5.7 11.2 4.5 14 4.5 16.5C4.5 20 7.4 21 12 21s7.5-1 7.5-4.5c0-2.5-1.2-5.3-3-7" />
      <path d="M8 8h8" />
      <circle cx="12" cy="15" r="1.5" />
    </svg>
  );
}

export function WalletSection({ wallets }: WalletSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleWallets = showAll ? wallets : wallets.slice(0, 4);
  const hasHiddenWallets = wallets.length > 4;

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#171717]">Wallet</h2>
        <div className="flex items-center gap-2">
          {hasHiddenWallets ? (
            <button
              type="button"
              className="rounded-full bg-white px-3.5 py-2 text-xs font-bold text-[#525252] shadow-sm transition hover:bg-[#FAFAFA]"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? "Hide" : "View all"}
            </button>
          ) : null}
          <Link
            href="/settings/wallets"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kelola wallet"
          >
            <Plus size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {visibleWallets.map((wallet, index) => {
          const Icon = walletIcon[wallet.type] ?? Wallet;

          return (
            <div
              key={wallet.id}
              className={cn(
                "min-h-[108px] rounded-[16px] p-4 shadow-sm",
                index === 0 ? "bg-[#262626] text-white" : "bg-[#E5E5E5] text-[#171717]"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-[11px]",
                  index === 0 ? "bg-[#404040] text-[#F5F5F5]" : "bg-[#D4D4D4] text-[#404040]"
                )}
              >
                <Icon size={17} strokeWidth={1.9} />
              </span>
              <p
                className={cn(
                  "mt-3 text-xs font-semibold",
                  index === 0 ? "text-[#D4D4D4]" : "text-[#737373]"
                )}
              >
                {wallet.name}
              </p>
              <p className={cn("mt-2 text-xl font-semibold", index === 0 ? "text-white" : "text-[#171717]")}>
                {formatRupiah(wallet.balance)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
