"use client";

import { useState } from "react";
import { Keyboard, MessageCircle } from "lucide-react";
import { ChatPanel } from "@/features/transactions/components/chat-sheet";
import { ExpenseForm } from "@/features/transactions/components/expense-form";

type Option = {
  id: string;
  name: string;
};

type LastExpenseRepeat = {
  amount: string;
  walletId: string;
  categoryId: string;
  description: string;
  label: string;
};

type CatatWorkspaceProps = {
  wallets: Option[];
  categories: Option[];
  defaultDate: string;
  defaultMode?: "manual" | "chat";
  lastExpense?: LastExpenseRepeat | null;
};

export function CatatWorkspace({
  wallets,
  categories,
  defaultDate,
  defaultMode = "manual",
  lastExpense = null
}: CatatWorkspaceProps) {
  const [mode, setMode] = useState<"manual" | "chat">(defaultMode);

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-1.5 rounded-[15px] bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={
            mode === "manual"
              ? "flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-[#171717] text-xs font-bold text-white"
              : "flex h-9 items-center justify-center gap-1.5 rounded-[11px] text-xs font-bold text-[#737373]"
          }
        >
          <Keyboard size={15} strokeWidth={2} />
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={
            mode === "chat"
              ? "flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-blue-500 text-xs font-bold text-white"
              : "flex h-9 items-center justify-center gap-1.5 rounded-[11px] text-xs font-bold text-[#737373]"
          }
        >
          <MessageCircle size={15} strokeWidth={2} />
          Chat AI
        </button>
      </div>

      {mode === "manual" ? (
        <div className="mt-3">
          <ExpenseForm
            wallets={wallets}
            categories={categories}
            defaultDate={defaultDate}
            lastExpense={lastExpense}
          />
        </div>
      ) : (
        <ChatPanel />
      )}
    </div>
  );
}
