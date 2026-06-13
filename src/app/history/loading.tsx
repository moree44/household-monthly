import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function HistoryLoading() {
  return (
    <RouteLoadingShell
      active="history"
      eyebrow="history"
      title="History"
      subtitle="Memuat transaksi"
      tone="history"
    />
  );
}
