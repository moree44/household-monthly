import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function NewExpenseLoading() {
  return (
    <RouteLoadingShell
      active="catat"
      eyebrow="catat transaksi"
      title="Catat"
      subtitle="Memuat form"
      tone="form"
    />
  );
}
