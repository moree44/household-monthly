import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function WealthLoading() {
  return (
    <RouteLoadingShell
      active="profile"
      eyebrow="kekayaan"
      title="Semua keuangan"
      subtitle="Memuat ringkasan"
      tone="profile"
    />
  );
}
