"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { RotateCcw, Save, Sparkles } from "lucide-react";
import { AmountInput } from "@/components/ui/amount-input";
import { Input } from "@/components/ui/input";
import { parseCatatDraftAction } from "@/features/transactions/ai-actions";
import { BarcodeScanButton } from "@/features/transactions/components/barcode-scan-button";
import {
  createExpenseAction,
  type ExpenseFormState,
  updateExpenseAction
} from "@/features/transactions/actions";

type WalletOption = {
  id: string;
  name: string;
};

type CategoryOption = {
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

type ExpenseFormProps = {
  wallets: WalletOption[];
  categories: CategoryOption[];
  defaultDate: string;
  mode?: "create" | "edit";
  lastExpense?: LastExpenseRepeat | null;
  initialValues?: {
    transactionId: string;
    amount: string;
    walletId: string;
    categoryId: string;
    description: string;
  };
};

const initialState: ExpenseFormState = {
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

export function ExpenseForm({
  wallets,
  categories,
  defaultDate,
  initialValues,
  lastExpense = null,
  mode = "create"
}: ExpenseFormProps) {
  const [state, formAction] = useActionState(
    mode === "edit" ? updateExpenseAction : createExpenseAction,
    initialState
  );
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [walletId, setWalletId] = useState(initialValues?.walletId ?? wallets[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [step, setStep] = useState<1 | 2>(mode === "edit" ? 2 : 1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  async function fillFromAi() {
    setAiBusy(true);
    setAiError(null);
    setAiNote("Cari tahu dulu...");
    const draft = await parseCatatDraftAction({
      prompt: aiPrompt,
      wallets,
      categories
    });
    setAiBusy(false);

    if (draft.error && !draft.amount) {
      setAiError(draft.error);
      setAiNote(null);
      return;
    }

    if (draft.amount) {
      setAmount(draft.amount);
    }

    if (draft.walletId) {
      setWalletId(draft.walletId);
    }

    if (draft.categoryId) {
      setCategoryId(draft.categoryId);
    }

    if (draft.description) {
      setDescription(draft.description);
    }

    setAiError(draft.error);
    setAiNote(draft.note);
    if (draft.amount) {
      setStep(2);
    }
  }

  function fillFromLastExpense() {
    if (!lastExpense) {
      return;
    }

    setAmount(lastExpense.amount);
    setWalletId(lastExpense.walletId);
    setCategoryId(lastExpense.categoryId);
    setDescription(lastExpense.description);
    setAiError(null);
    setAiNote(null);
    setStep(2);
  }

  return (
    <form action={formAction} className="grid gap-2.5">
      {initialValues ? (
        <input type="hidden" name="transactionId" value={initialValues.transactionId} />
      ) : null}

      {mode === "create" && step === 1 ? (
        <div className="rounded-[18px] bg-white p-3 shadow-sm">
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-normal text-[#737373]" htmlFor="aiPrompt">
            <Sparkles size={13} strokeWidth={2} />
            Isi cepat
          </label>
          <div className="mt-2 flex gap-1.5">
            <input
              id="aiPrompt"
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="gorengan 5k"
              className="h-10 min-w-0 flex-1 rounded-[12px] border-0 bg-[#F5F5F5] px-3 text-sm font-medium text-[#171717] outline-none placeholder:text-[#A3A3A3] focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => void fillFromAi()}
              disabled={aiBusy}
              className="h-10 shrink-0 rounded-[12px] bg-[#171717] px-3 text-xs font-bold text-white disabled:opacity-60"
            >
              {aiBusy ? "Cari..." : "Isi"}
            </button>
          </div>
          {lastExpense ? (
            <button
              type="button"
              onClick={fillFromLastExpense}
              className="mt-2 flex h-9 w-full items-center gap-2 rounded-[12px] bg-[#F5F5F5] px-2.5 text-left"
            >
              <RotateCcw size={13} strokeWidth={2} className="shrink-0 text-[#737373]" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#525252]">
                Ulang {lastExpense.label}
              </span>
              <span className="shrink-0 text-xs font-bold text-[#171717]">Rp {lastExpense.amount}</span>
            </button>
          ) : null}
          {aiNote ? <p className="mt-1.5 text-[11px] font-medium text-[#525252]">{aiNote}</p> : null}
          {aiError ? <p className="mt-1.5 text-[11px] font-medium text-red-600">{aiError}</p> : null}
        </div>
      ) : null}

      <div className="rounded-[18px] bg-[#171717] px-4 py-3 text-white shadow-xl shadow-black/10">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-[11px] font-bold uppercase tracking-normal text-[#A3A3A3]" htmlFor="amount">
            Nominal
          </label>
          {mode === "create" && step === 2 ? (
            <button type="button" onClick={() => setStep(1)} className="text-[11px] font-bold text-[#A3A3A3]">
              Ubah
            </button>
          ) : null}
        </div>
        <AmountInput
          id="amount"
          name="amount"
          placeholder="85.000"
          keypad={mode === "create" && step === 1}
          value={amount}
          onValueChange={setAmount}
          className="mt-1 h-10 border-0 bg-transparent px-0 text-2xl font-semibold text-white placeholder:text-[#737373] focus:border-transparent focus:ring-0"
          required
        />
      </div>

      {mode === "create" && step === 1 ? (
        <button
          type="button"
          disabled={!amount}
          onClick={() => setStep(2)}
          className="inline-flex h-[42px] w-full items-center justify-center rounded-[14px] bg-blue-500 text-sm font-bold text-white disabled:opacity-50"
        >
          Lanjut
        </button>
      ) : null}

      {step === 2 ? (
        <>
          <fieldset>
        <legend className="block text-xs font-bold text-[#171717]">Wallet</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {wallets.map((wallet) => (
            <label key={wallet.id} className="cursor-pointer">
              <input
                type="radio"
                name="walletId"
                value={wallet.id}
                checked={walletId === wallet.id}
                onChange={() => setWalletId(wallet.id)}
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
        <legend className="block text-xs font-bold text-[#171717]">Kategori</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {categories.map((category) => (
            <label key={category.id} className="cursor-pointer">
              <input
                type="radio"
                name="categoryId"
                value={category.id}
                checked={categoryId === category.id}
                onChange={() => setCategoryId(category.id)}
                className="peer sr-only"
                required
              />
              <span className="flex min-h-9 items-center justify-center rounded-[12px] bg-white px-1.5 text-center text-[11px] font-bold leading-tight text-[#525252] shadow-sm shadow-black/5 transition peer-checked:bg-[#171717] peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold text-[#171717]" htmlFor="description">
            Catatan
          </label>
          {mode === "create" ? (
            <BarcodeScanButton
              onDetected={(label) =>
                setDescription((current) => (current ? `${current} · ${label}` : label))
              }
            />
          ) : null}
        </div>
        <textarea
          id="description"
          name="description"
          rows={1}
          placeholder="opsional..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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
        </>
      ) : null}
    </form>
  );
}
