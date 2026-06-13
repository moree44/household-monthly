import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function DashboardLoading() {
  return <RouteLoadingShell active="home" eyebrow="loading" title="Household Monthly" tone="dashboard" />;
}
