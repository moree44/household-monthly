"use client";

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
  lastExpense?: LastExpenseRepeat | null;
};

export function CatatWorkspace({
  wallets,
  categories,
  defaultDate,
  lastExpense = null
}: CatatWorkspaceProps) {
  return (
    <div className="mt-3">
      <ExpenseForm
        wallets={wallets}
        categories={categories}
        defaultDate={defaultDate}
        lastExpense={lastExpense}
      />
    </div>
  );
}
