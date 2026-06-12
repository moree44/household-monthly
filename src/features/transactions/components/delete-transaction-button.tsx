"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  deleteTransactionAction,
  type DeleteTransactionState
} from "@/features/transactions/actions";

type DeleteTransactionButtonProps = {
  transactionId: string;
};

const initialState: DeleteTransactionState = {
  error: null
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-8 items-center justify-center rounded-[10px] px-2 text-xs font-bold text-red-600 transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Hapus transaksi"
      disabled={pending}
    >
      {pending ? "..." : "Hapus"}
    </button>
  );
}

export function DeleteTransactionButton({ transactionId }: DeleteTransactionButtonProps) {
  const [state, formAction] = useActionState(deleteTransactionAction, initialState);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#E5E5E5]/80 text-[#737373] transition hover:bg-red-50 hover:text-red-600"
        aria-label="Hapus transaksi"
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 size={16} strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <form action={formAction} className="absolute right-3 top-14 z-10 grid justify-items-end gap-2">
      <input type="hidden" name="transactionId" value={transactionId} />
      <div className="flex items-center gap-1 rounded-[12px] bg-red-50 p-1 shadow-lg shadow-black/10">
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
