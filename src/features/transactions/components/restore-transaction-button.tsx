"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { RotateCcw } from "lucide-react";
import {
  restoreTransactionAction,
  type RestoreTransactionState
} from "@/features/transactions/actions";

type RestoreTransactionButtonProps = {
  transactionId: string;
};

const initialState: RestoreTransactionState = {
  error: null
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-8 items-center justify-center rounded-[10px] px-2 text-xs font-bold text-blue-600 transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Restore transaksi"
      disabled={pending}
    >
      {pending ? "..." : "Restore"}
    </button>
  );
}

export function RestoreTransactionButton({ transactionId }: RestoreTransactionButtonProps) {
  const [state, formAction] = useActionState(restoreTransactionAction, initialState);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#E5E5E5]/80 text-[#737373] transition hover:bg-blue-50 hover:text-blue-600"
        aria-label="Restore transaksi"
        onClick={() => setIsConfirming(true)}
      >
        <RotateCcw size={16} strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <form action={formAction} className="grid justify-items-end gap-2">
      <input type="hidden" name="transactionId" value={transactionId} />
      <div className="flex items-center gap-2 rounded-[12px] bg-blue-50 p-1">
        <button
          type="button"
          className="h-8 rounded-[10px] px-2 text-xs font-bold text-[#737373] transition hover:bg-[#FAFAFA] hover:text-[#171717]"
          onClick={() => setIsConfirming(false)}
        >
          Batal
        </button>
        <SubmitButton />
      </div>
      {state.error ? (
        <p className="max-w-44 text-right text-xs text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
