import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type CatatType = "expense" | "transfer" | "topup";

const items = [
  { type: "expense" as const, href: "/expenses/new", label: "Expense", icon: ArrowUpRight },
  { type: "transfer" as const, href: "/transfers/new", label: "Transfer", icon: ArrowRightLeft },
  { type: "topup" as const, href: "/top-ups/new", label: "Top Up", icon: ArrowDownLeft }
];

export function CatatTypeNav({ active }: { active: CatatType }) {
  return (
    <nav className="mt-3 grid grid-cols-3 gap-1.5 rounded-[15px] bg-[#E5E5E5] p-1.5 shadow-sm">
      {items.map((item) => {
        const Icon = item.icon;
        const on = item.type === active;

        return (
          <Link
            key={item.type}
            href={item.href}
            className={
              on
                ? "flex h-8 items-center justify-center gap-1.5 rounded-[11px] bg-[#171717] text-xs font-bold !text-[#FAFAFA] shadow-sm"
                : "flex h-8 items-center justify-center gap-1.5 rounded-[11px] text-xs font-bold text-[#737373] transition hover:bg-[#F5F5F5]"
            }
          >
            <Icon size={15} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
