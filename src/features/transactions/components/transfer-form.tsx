"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import {
  createTransferAction,
  type TransferFormState,
  updateTransferAction
} from "@/features/transactions/actions";

type WalletOption = {
  id: string;
  name: string;
};

type TransferFormProps = {
  wallets: WalletOption[];
  defaultDate: string;
  mode?: "create" | "edit";
  initialValues?: {
    transactionId: string;
    amount: string;
    fromWalletId: string;
    toWalletId: string;
    description: string;
  };
};

const initialState: TransferFormState = {
  error: null
};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[42px] min-h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#171717] px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save size={18} strokeWidth={1.75} />
      {pending ? "Saving..." : mode === "edit" ? "Update" : "Save"}
    </button>
  );
}

export function TransferForm({
  wallets,
  defaultDate,
  initialValues,
  mode = "create"
}: TransferFormProps) {
  const [state, formAction] = useActionState(
    mode === "edit" ? updateTransferAction : createTransferAction,
    initialState
  );

  return (
    <form action={formAction} className="grid gap-2.5">
      {initialValues ? (
        <input type="hidden" name="transactionId" value={initialValues.transactionId} />
      ) : null}
      <div className="rounded-[18px] bg-[#171717] px-4 py-3 text-white shadow-xl shadow-black/10">
        <label className="block text-[11px] font-bold uppercase tracking-normal text-[#A3A3A3]" htmlFor="amount">
          Nominal
        </label>
        <AmountInput
          id="amount"
          name="amount"
          placeholder="500.000"
          defaultValue={initialValues?.amount}
          className="mt-1 h-10 border-0 bg-transparent px-0 text-2xl font-semibold text-white placeholder:text-[#737373] focus:border-transparent focus:ring-0"
          required
        />
      </div>

      <fieldset>
        <legend className="block text-xs font-bold text-[#171717]">Dari Wallet</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="cursor-pointer">
              <input
                type="radio"
                name="fromWalletId"
                value={wallet.id}
                defaultChecked={initialValues?.fromWalletId === wallet.id}
                className="peer sr-only"
                required
              />
              <span className="flex min-h-9 items-center justify-center rounded-[12px] bg-white px-2 text-center text-xs font-bold text-[#525252] shadow-sm shadow-black/5 transition peer-checked:bg-[#171717] peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100">
                {wallet.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-xs font-bold text-[#171717]">Ke Wallet</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="cursor-pointer">
              <input
                type="radio"
                name="toWalletId"
                value={wallet.id}
                defaultChecked={initialValues?.toWalletId === wallet.id}
                className="peer sr-only"
                required
              />
              <span className="flex min-h-9 items-center justify-center rounded-[12px] bg-white px-2 text-center text-xs font-bold text-[#525252] shadow-sm shadow-black/5 transition peer-checked:bg-[#171717] peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100">
                {wallet.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-xs font-bold text-[#171717]" htmlFor="description">
          Catatan
        </label>
        <textarea
          id="description"
          name="description"
          rows={1}
          placeholder="opsional..."
          defaultValue={initialValues?.description}
          className="mt-1.5 w-full resize-none rounded-[14px] border-0 bg-white px-3 py-2 text-sm font-medium text-[#171717] shadow-sm shadow-black/5 outline-none transition placeholder:text-[#A3A3A3] focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#171717]" htmlFor="transactionDate">
          Tanggal
        </label>
        <Input
          id="transactionDate"
          name="transactionDate"
          type="date"
          defaultValue={defaultDate}
          className="mt-1.5 h-10 rounded-[14px] border-0 bg-white px-3 text-[#171717] shadow-sm shadow-black/5 focus:ring-blue-100"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-[14px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton mode={mode} />
    </form>
  );
}
