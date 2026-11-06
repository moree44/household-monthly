"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import {
  createAssetAction,
  createHoldingAction,
  toggleAssetAction,
  toggleHoldingAction,
  updateAssetValueAction,
  updateHoldingBalanceAction,
  type WealthFormState
} from "@/features/wealth/actions";
import type { WealthAsset, WealthHolding } from "@/features/wealth/data";
import { PrivateAmount } from "@/features/privacy/privacy";

type WealthManagerProps = {
  holdings: WealthHolding[];
  assets: WealthAsset[];
};

const emptyState: WealthFormState = { error: null, success: null };

const holdingKinds = [
  { value: "bank", label: "ATM" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "crypto", label: "Crypto" }
] as const;

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-[#171717] px-3 text-xs font-bold text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function formatInputAmount(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

function Feedback({ state }: { state: WealthFormState }) {
  if (state.error) {
    return <p className="text-xs font-semibold text-red-600">{state.error}</p>;
  }

  if (state.success) {
    return <p className="text-xs font-semibold text-green-700">{state.success}</p>;
  }

  return null;
}

function HoldingRow({ holding }: { holding: WealthHolding }) {
  const [state, action] = useActionState(updateHoldingBalanceAction, emptyState);

  return (
    <article className={`rounded-[16px] bg-white p-3 shadow-sm ${holding.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#171717]">{holding.name}</p>
        <p className="text-sm font-bold text-[#171717]">
          <PrivateAmount value={holding.idrValue} />
        </p>
      </div>
      <form action={action} className="mt-2 grid gap-1.5">
        <input type="hidden" name="holdingId" value={holding.id} />
        {holding.kind === "crypto" ? (
          <input
            name="quantity"
            defaultValue={holding.quantity ?? ""}
            placeholder="Qty"
            className="h-9 rounded-[11px] bg-[#F5F5F5] px-2 text-xs font-semibold outline-none"
          />
        ) : (
          <input type="hidden" name="quantity" value={holding.quantity ?? ""} />
        )}
        <div className="flex gap-1.5">
          <input
            name="idrValue"
            defaultValue={formatInputAmount(holding.idrValue)}
            className="h-9 min-w-0 flex-1 rounded-[11px] bg-[#F5F5F5] px-2 text-xs font-semibold outline-none"
          />
          <SubmitButton>Update</SubmitButton>
        </div>
      </form>
      <form action={toggleHoldingAction} className="mt-1.5">
        <input type="hidden" name="holdingId" value={holding.id} />
        <button type="submit" className="text-[11px] font-bold text-[#737373]">
          {holding.isActive ? "Sembunyikan" : "Aktifkan"}
        </button>
      </form>
      <Feedback state={state} />
    </article>
  );
}

function AssetRow({ asset }: { asset: WealthAsset }) {
  const [state, action] = useActionState(updateAssetValueAction, emptyState);

  return (
    <article className={`rounded-[16px] bg-white p-3 shadow-sm ${asset.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#171717]">{asset.name}</p>
        <p className="text-sm font-bold text-[#171717]">
          <PrivateAmount value={asset.idrValue} />
        </p>
      </div>
      <form action={action} className="mt-2 flex gap-1.5">
        <input type="hidden" name="assetId" value={asset.id} />
        <input
          name="idrValue"
          defaultValue={formatInputAmount(asset.idrValue)}
          className="h-9 min-w-0 flex-1 rounded-[11px] bg-[#F5F5F5] px-2 text-xs font-semibold outline-none"
        />
        <SubmitButton>Update</SubmitButton>
      </form>
      <form action={toggleAssetAction} className="mt-1.5">
        <input type="hidden" name="assetId" value={asset.id} />
        <button type="submit" className="text-[11px] font-bold text-[#737373]">
          {asset.isActive ? "Sembunyikan" : "Aktifkan"}
        </button>
      </form>
      <Feedback state={state} />
    </article>
  );
}

function HoldingList({
  title,
  items,
  empty
}: {
  title: string;
  items: WealthHolding[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold text-[#171717]">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? (
          <p className="rounded-[16px] bg-white px-3 py-4 text-sm text-[#737373]">{empty}</p>
        ) : (
          items.map((holding) => <HoldingRow key={holding.id} holding={holding} />)
        )}
      </div>
    </section>
  );
}

export function WealthManager({ holdings, assets }: WealthManagerProps) {
  const [holdingState, holdingAction] = useActionState(createHoldingAction, emptyState);
  const [assetState, assetAction] = useActionState(createAssetAction, emptyState);

  const atmHoldings = holdings.filter((holding) => holding.kind === "bank" || holding.kind === "cash" || holding.kind === "other");
  const ewalletHoldings = holdings.filter((holding) => holding.kind === "ewallet");
  const cryptoHoldings = holdings.filter((holding) => holding.kind === "crypto");

  return (
    <div className="grid gap-6 wide:grid-cols-2">
      <div className="grid gap-6">
        <HoldingList title="ATM" items={atmHoldings} empty="Belum ada ATM." />
        <HoldingList title="E-Wallet" items={ewalletHoldings} empty="Belum ada E-Wallet." />
      </div>

      <div className="grid gap-6">
        <HoldingList title="Crypto" items={cryptoHoldings} empty="Belum ada Crypto." />

        <section>
          <h2 className="text-sm font-bold text-[#171717]">Aset</h2>
          <div className="mt-3 grid gap-2">
            {assets.length === 0 ? (
              <p className="rounded-[16px] bg-white px-3 py-4 text-sm text-[#737373]">Belum ada aset.</p>
            ) : (
              assets.map((asset) => <AssetRow key={asset.id} asset={asset} />)
            )}
          </div>
        </section>
      </div>

      <form action={holdingAction} className="grid gap-2 rounded-[16px] bg-white p-3 shadow-sm">
        <p className="text-sm font-bold text-[#171717]">Tambah akun</p>
        <input
          name="name"
          placeholder="Nama"
          className="h-10 rounded-[12px] bg-[#F5F5F5] px-3 text-sm font-semibold outline-none"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <select name="kind" defaultValue="bank" className="h-10 rounded-[12px] bg-[#F5F5F5] px-2 text-sm font-semibold">
            {holdingKinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
          <input
            name="idrValue"
            placeholder="Saldo"
            className="h-10 rounded-[12px] bg-[#F5F5F5] px-3 text-sm font-semibold outline-none"
            required
          />
        </div>
        <input type="hidden" name="visibility" value="household" />
        <SubmitButton>
          <Plus size={14} strokeWidth={2} />
          Simpan
        </SubmitButton>
        <Feedback state={holdingState} />
      </form>

      <form action={assetAction} className="grid gap-2 rounded-[16px] bg-white p-3 shadow-sm">
        <p className="text-sm font-bold text-[#171717]">Tambah aset</p>
        <input
          name="name"
          placeholder="Nama"
          className="h-10 rounded-[12px] bg-[#F5F5F5] px-3 text-sm font-semibold outline-none"
          required
        />
        <input
          name="idrValue"
          placeholder="Nilai"
          className="h-10 rounded-[12px] bg-[#F5F5F5] px-3 text-sm font-semibold outline-none"
          required
        />
        <input type="hidden" name="kind" value="other" />
        <input type="hidden" name="visibility" value="household" />
        <SubmitButton>
          <Plus size={14} strokeWidth={2} />
          Simpan
        </SubmitButton>
        <Feedback state={assetState} />
      </form>
    </div>
  );
}
