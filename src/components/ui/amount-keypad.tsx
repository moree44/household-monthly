"use client";

import { Delete } from "lucide-react";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const;

type AmountKeypadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
};

export function AmountKeypad({ onDigit, onBackspace }: AmountKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => (key === "back" ? onBackspace() : onDigit(key))}
          className="flex h-11 items-center justify-center rounded-[12px] bg-white/12 text-lg font-bold text-white transition active:bg-white/20"
          aria-label={key === "back" ? "Hapus" : key}
        >
          {key === "back" ? <Delete size={18} strokeWidth={1.8} /> : key}
        </button>
      ))}
    </div>
  );
}
