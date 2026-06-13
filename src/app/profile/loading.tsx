import { RouteLoadingShell } from "@/components/ui/route-loading-shell";

export default function ProfileLoading() {
  return (
    <RouteLoadingShell
      active="profile"
      eyebrow="profile"
      title="Profil"
      subtitle="Memuat pengaturan"
      tone="profile"
    />
  );
}
