import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function GoalsLoading() {
  return (
    <RouteLoadingShell
      active="goals"
      eyebrow="goals"
      title="Goals"
      subtitle="Memuat target"
      tone="goals"
    />
  );
}
