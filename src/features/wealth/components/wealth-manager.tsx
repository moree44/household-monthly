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
  { value: "bank", label: "Bank / ATM" },
  { value: "ewallet", label: "E-wallet" },
  { value: "crypto", label: "Crypto / CEX" },
  { value: "cash", label: "Tunai lain" },
  { value: "other", label: "Lainnya" }
] as const;

const assetKinds = [
  { value: "vehicle", label: "Kendaraan" },
  { value: "property", label: "Properti" },
  { value: "other", label: "Lainnya" }
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#171717]">{holding.name}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#737373]">
            {holdingKinds.find((kind) => kind.value === holding.kind)?.label}
            {holding.institution ? ` · ${holding.institution}` : ""}
            {holding.visibility === "private" ? " · pribadi" : ""}
          </p>
        </div>
        <p className="text-sm font-bold text-[#171717]"><PrivateAmount value={holding.idrValue} /></p>
      </div>
      <form action={action} className="mt-2 grid gap-1.5">
        <input type="hidden" name="holdingId" value={holding.id} />
        {holding.kind === "crypto" ? (
          <input
            name="quantity"
            defaultValue={holding.quantity ?? ""}
            placeholder="qty, mis. 0.02"
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#171717]">{asset.name}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[#737373]">
            {assetKinds.find((kind) => kind.value === asset.kind)?.label}
            {asset.visibility === "private" ? " · pribadi" : ""}
          </p>
        </div>
        <p className="text-sm font-bold text-[#171717]"><PrivateAmount value={asset.idrValue} /></p>
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

export function WealthManager({ holdings, assets }: WealthManagerProps) {
  const [holdingState, holdingAction] = useActionState(createHoldingAction, emptyState);
  const [assetState, assetAction] = useActionState(createAssetAction, emptyState);

  return (
    <div className="grid gap-5 desktop:grid-cols-2">
      <section>
        <h2 className="text-sm font-bold text-[#171717]">Bank, e-wallet, crypto</h2>
        <p className="mt-1 text-xs text-[#737373]">Saldo diisi manual. Update kapan sempat, bukan setiap hari.</p>
        <form action={holdingAction} className="mt-3 grid gap-2 rounded-[16px] bg-[#E5E5E5] p-3">
          <input name="name" placeholder="ATM BCA / Binance" className="h-10 rounded-[12px] bg-white px-3 text-sm font-semibold outline-none" required />
          <div className="grid grid-cols-2 gap-2">
            <select name="kind" defaultValue="bank" className="h-10 rounded-[12px] bg-white px-2 text-sm font-semibold">
              {holdingKinds.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
            <input name="institution" placeholder="BCA / Binance" className="h-10 rounded-[12px] bg-white px-3 text-sm font-semibold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="idrValue" placeholder="Saldo Rp" className="h-10 rounded-[12px] bg-white px-3 text-sm font-semibold outline-none" required />
            <input name="quantity" placeholder="Qty crypto (opsional)" className="h-10 rounded-[12px] bg-white px-3 text-sm font-semibold outline-none" />
          </div>
          <select name="visibility" defaultValue="household" className="h-10 rounded-[12px] bg-white px-2 text-sm font-semibold">
            <option value="household">Rumah tangga</option>
            <option value="private">Pribadi</option>
          </select>
          <SubmitButton>
            <Plus size={14} strokeWidth={2} />
            Tambah akun
          </SubmitButton>
          <Feedback state={holdingState} />
        </form>
        <div className="mt-3 grid gap-2">
          {holdings.length === 0 ? (
            <p className="rounded-[16px] bg-white px-3 py-4 text-sm text-[#737373]">Belum ada akun. Tambah ATM atau Binance di atas.</p>
          ) : (
            holdings.map((holding) => <HoldingRow key={holding.id} holding={holding} />)
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-[#171717]">Aset</h2>
        <p className="mt-1 text-xs text-[#737373]">Mobil, motor, atau aset lain. Pakai perkiraan nilai jual.</p>
        <form action={assetAction} className="mt-3 grid gap-2 rounded-[16px] bg-[#E5E5E5] p-3">
          <input name="name" placeholder="Motor NMAX / Mobil Avanza" className="h-10 rounded-[12px] bg-white px-3 text-sm font-semibold outline-none" required />
          <select name="kind" defaultValue="vehicle" className="h-10 rounded-[12px] bg-white px-2 text-sm font-semibold">
            {assetKinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
          <input name="idrValue" placeholder="Perkiraan nilai Rp" className="h-10 rounded-[12px] bg-white px-3 text-sm font-semibold outline-none" required />
          <select name="visibility" defaultValue="household" className="h-10 rounded-[12px] bg-white px-2 text-sm font-semibold">
            <option value="household">Rumah tangga</option>
            <option value="private">Pribadi</option>
          </select>
          <SubmitButton>
            <Plus size={14} strokeWidth={2} />
            Tambah aset
          </SubmitButton>
          <Feedback state={assetState} />
        </form>
        <div className="mt-3 grid gap-2">
          {assets.length === 0 ? (
            <p className="rounded-[16px] bg-white px-3 py-4 text-sm text-[#737373]">Belum ada aset.</p>
          ) : (
            assets.map((asset) => <AssetRow key={asset.id} asset={asset} />)
          )}
        </div>
      </section>
    </div>
  );
}
