"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Plus, RotateCcw, X } from "lucide-react";
import {
  createWalletAction,
  type WalletFormState,
  toggleWalletAction,
  updateWalletAction
} from "@/features/settings/wallet-actions";
import { formatRupiah } from "@/lib/format/currency";

type WalletItem = {
  id: string;
  name: string;
  type: "operational" | "wife" | "home_setup" | "emergency" | "custom";
  initialBalance: number;
  isActive: boolean;
  transactionCount: number;
};

type WalletManagerProps = {
  wallets: WalletItem[];
};

const emptyWalletFormState: WalletFormState = {
  error: null,
  success: null
};

const walletTypes = [
  { value: "operational", label: "Operational" },
  { value: "wife", label: "Dompet Istri" },
  { value: "home_setup", label: "Tabungan Rumah" },
  { value: "emergency", label: "Dana Darurat" },
  { value: "custom", label: "Custom" }
] as const;

function formatInputAmount(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(value);
}

function SubmitButton({ children, variant = "dark" }: { children: React.ReactNode; variant?: "dark" | "light" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        variant === "dark"
          ? "inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-[12px] bg-[#171717] px-3 text-xs font-bold leading-none text-white shadow-sm transition hover:bg-[#262626] disabled:opacity-60"
          : "inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-[12px] bg-white px-3 text-xs font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA] disabled:opacity-60"
      }
    >
      {children}
    </button>
  );
}

function StatusText({ error, success }: { error: string | null; success: string | null }) {
  if (!error && !success) {
    return null;
  }

  return (
    <p className={`mt-2 text-xs font-bold ${error ? "text-red-600" : "text-emerald-600"}`}>
      {error ?? success}
    </p>
  );
}

function RowActionButton({
  children,
  formId
}: {
  children: React.ReactNode;
  formId: string;
}) {
  return (
    <button
      type="submit"
      form={formId}
      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-white px-3 text-xs font-bold leading-none text-[#171717] shadow-sm transition hover:bg-[#FAFAFA]"
    >
      {children}
    </button>
  );
}

function WalletTypeSelect({ defaultValue }: { defaultValue?: WalletItem["type"] }) {
  return (
    <select
      name="type"
      defaultValue={defaultValue ?? "custom"}
      className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
    >
      {walletTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

function WalletRow({ wallet }: { wallet: WalletItem }) {
  const [updateState, updateAction] = useActionState(updateWalletAction, emptyWalletFormState);
  const [toggleState, toggleAction] = useActionState(toggleWalletAction, emptyWalletFormState);
  const updateFormId = `update-wallet-${wallet.id}`;
  const toggleFormId = `toggle-wallet-${wallet.id}`;

  return (
    <div className="rounded-[17px] bg-[#E5E5E5] p-2.5 shadow-sm">
      <form id={updateFormId} action={updateAction} className="space-y-2">
        <input type="hidden" name="walletId" value={wallet.id} />
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-3 h-2.5 w-2.5 shrink-0 rounded-full ${
              wallet.isActive ? "bg-blue-500" : "bg-[#A3A3A3]"
            }`}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              name="name"
              defaultValue={wallet.name}
              className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <WalletTypeSelect defaultValue={wallet.type} />
              <input
                name="initialBalance"
                defaultValue={formatInputAmount(wallet.initialBalance)}
                inputMode="numeric"
                className="h-10 w-full rounded-[13px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition focus:border-blue-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#737373]">
              <span>{wallet.transactionCount} transaksi</span>
              <span>{wallet.isActive ? "aktif" : "nonaktif"}</span>
              <span>
                saldo awal <span className="text-sm text-[#525252]">{formatRupiah(wallet.initialBalance)}</span>
              </span>
            </div>
            <StatusText error={updateState.error} success={updateState.success} />
          </div>
        </div>
      </form>
      <form id={toggleFormId} action={toggleAction} className="hidden">
        <input type="hidden" name="walletId" value={wallet.id} />
      </form>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <RowActionButton formId={updateFormId}>
          <Check size={14} strokeWidth={2} />
          Simpan
        </RowActionButton>
        <RowActionButton formId={toggleFormId}>
          {wallet.isActive ? <X size={14} strokeWidth={2} /> : <RotateCcw size={14} strokeWidth={2} />}
          {wallet.isActive ? "Nonaktif" : "Aktifkan"}
        </RowActionButton>
      </div>
      <StatusText error={toggleState.error} success={toggleState.success} />
    </div>
  );
}

export function WalletManager({ wallets }: WalletManagerProps) {
  const [createState, createAction] = useActionState(createWalletAction, emptyWalletFormState);
  const activeWallets = wallets.filter((wallet) => wallet.isActive);
  const inactiveWallets = wallets.filter((wallet) => !wallet.isActive);

  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[22px] bg-[#171717] p-4 text-white shadow-lg shadow-black/10">
        <p className="text-xs font-bold uppercase tracking-normal text-[#A3A3A3]">wallet aktif</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-5xl">{activeWallets.length}</p>
            <p className="mt-1 text-xs font-semibold text-[#A3A3A3]">tersedia di form catat</p>
          </div>
          <div className="rounded-full bg-[#404040] px-4 py-2 text-xs font-bold">
            {inactiveWallets.length} nonaktif
          </div>
        </div>
      </section>

      <section className="rounded-[20px] bg-[#E5E5E5] p-3 shadow-sm">
        <form action={createAction} className="space-y-3">
          <label className="text-sm font-bold text-[#171717]" htmlFor="wallet-name">
            Tambah Wallet
          </label>
          <input
            id="wallet-name"
            name="name"
            placeholder="Nama wallet"
            className="h-12 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <WalletTypeSelect />
            <input
              name="initialBalance"
              placeholder="Saldo awal"
              inputMode="numeric"
              className="h-12 w-full rounded-[15px] border border-transparent bg-[#F5F5F5] px-4 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400"
            />
          </div>
          <SubmitButton>
            <Plus size={15} strokeWidth={2} />
            Tambah
          </SubmitButton>
          <StatusText error={createState.error} success={createState.success} />
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#171717]">Daftar Wallet</h2>
        {wallets.map((wallet) => (
          <WalletRow key={wallet.id} wallet={wallet} />
        ))}
      </section>
    </div>
  );
}
