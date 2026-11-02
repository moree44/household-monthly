"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatRupiah } from "@/lib/format/currency";

const STORAGE_KEY = "household-hide-amounts";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

function emitPrivacyChange() {
  listeners.forEach((listener) => listener());
}

const PrivacyContext = createContext<{
  hidden: boolean;
  toggle: () => void;
}>({
  hidden: false,
  toggle: () => undefined
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    window.localStorage.setItem(STORAGE_KEY, hidden ? "0" : "1");
    emitPrivacyChange();
  }

  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function PrivateAmount({ value, className }: { value: number; className?: string }) {
  const { hidden } = usePrivacy();

  return <span className={className}>{hidden ? "Rp ••••••" : formatRupiah(value)}</span>;
}

export function PrivacyToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { hidden, toggle } = usePrivacy();

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        tone === "dark"
          ? "grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
          : "grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm"
      }
      aria-label={hidden ? "Tampilkan nominal" : "Sembunyikan nominal"}
    >
      {hidden ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
    </button>
  );
}

export function PrivacySettingsCard() {
  const { hidden, toggle } = usePrivacy();

  return (
    <section className="mt-5 rounded-[18px] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#171717]">Sembunyikan nominal</p>
          <p className="mt-1 text-sm text-[#737373]">
            Tutup saldo di dashboard, history, goals, dan kekayaan. Disimpan di perangkat ini.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={
            hidden
              ? "h-10 shrink-0 rounded-full bg-[#171717] px-4 text-xs font-bold text-white"
              : "h-10 shrink-0 rounded-full bg-[#E5E5E5] px-4 text-xs font-bold text-[#171717]"
          }
        >
          {hidden ? "Aktif" : "Mati"}
        </button>
      </div>
    </section>
  );
}
