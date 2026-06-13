import { BottomNav } from "@/components/navigation/bottom-nav";

type LoadingTone = "dashboard" | "history" | "goals" | "profile" | "form";

type RouteLoadingShellProps = {
  active: "home" | "history" | "catat" | "goals" | "profile";
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: LoadingTone;
};

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <>
      <PulseBlock className="mt-4 h-12 rounded-[16px] bg-[#E5E5E5]" />
      <PulseBlock className="mt-5 h-44 rounded-[22px] bg-[#171717] shadow-xl shadow-black/10" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <PulseBlock className="h-[108px] rounded-[16px] bg-[#262626]" />
        <PulseBlock className="h-[108px] rounded-[16px] bg-[#E5E5E5]" />
        <PulseBlock className="h-[108px] rounded-[16px] bg-[#E5E5E5]" />
        <PulseBlock className="h-[108px] rounded-[16px] bg-[#E5E5E5]" />
      </div>
      <PulseBlock className="mt-5 h-36 rounded-[18px] bg-white" />
      <PulseBlock className="mt-5 h-40 rounded-[18px] bg-white" />
    </>
  );
}

function HistorySkeleton() {
  return (
    <>
      <PulseBlock className="mt-4 h-12 rounded-[16px] bg-[#E5E5E5]" />
      <div className="mt-5 rounded-[20px] bg-[#E5E5E5] p-2">
        <div className="grid grid-cols-2 gap-2">
          <PulseBlock className="h-9 rounded-[13px] bg-[#171717]" />
          <PulseBlock className="h-9 rounded-[13px] bg-[#F5F5F5]" />
        </div>
        <div className="mt-3 flex gap-2">
          <PulseBlock className="h-8 w-16 rounded-[12px] bg-[#171717]" />
          <PulseBlock className="h-8 w-20 rounded-[12px] bg-[#F5F5F5]" />
          <PulseBlock className="h-8 w-16 rounded-[12px] bg-[#F5F5F5]" />
          <PulseBlock className="h-8 flex-1 rounded-[12px] bg-[#F5F5F5]" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <PulseBlock className="h-28 rounded-[18px] bg-white" />
        <PulseBlock className="h-28 rounded-[18px] bg-white" />
      </div>
    </>
  );
}

function GoalsSkeleton() {
  return (
    <>
      <PulseBlock className="mt-5 h-28 rounded-[22px] bg-[#171717] shadow-xl shadow-black/10" />
      <PulseBlock className="mt-5 h-48 rounded-[18px] bg-[#E5E5E5]" />
      <div className="mt-5 space-y-3">
        <PulseBlock className="h-44 rounded-[18px] bg-white" />
        <PulseBlock className="h-44 rounded-[18px] bg-white" />
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <PulseBlock className="mt-5 h-44 rounded-[22px] bg-[#E5E5E5]" />
      <div className="mt-5 overflow-hidden rounded-[18px] bg-[#E5E5E5]">
        <PulseBlock className="h-14 bg-[#E5E5E5]" />
        <PulseBlock className="h-14 border-t border-[#D4D4D4] bg-[#E5E5E5]" />
        <PulseBlock className="h-14 border-t border-[#D4D4D4] bg-[#E5E5E5]" />
        <PulseBlock className="h-14 border-t border-[#D4D4D4] bg-[#E5E5E5]" />
      </div>
      <PulseBlock className="mt-6 h-14 rounded-[16px] bg-white" />
    </>
  );
}

function FormSkeleton() {
  return (
    <>
      <PulseBlock className="mt-4 h-11 rounded-[16px] bg-[#E5E5E5]" />
      <PulseBlock className="mt-4 h-24 rounded-[18px] bg-[#171717] shadow-xl shadow-black/10" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PulseBlock className="h-10 rounded-[13px] bg-white" />
        <PulseBlock className="h-10 rounded-[13px] bg-white" />
        <PulseBlock className="h-10 rounded-[13px] bg-white" />
        <PulseBlock className="h-10 rounded-[13px] bg-white" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <PulseBlock key={index} className="h-9 rounded-[12px] bg-white" />
        ))}
      </div>
      <PulseBlock className="mt-4 h-12 rounded-[14px] bg-white" />
      <PulseBlock className="mt-3 h-12 rounded-[14px] bg-white" />
      <PulseBlock className="mt-3 h-12 rounded-[14px] bg-[#171717]" />
    </>
  );
}

export function RouteLoadingShell({
  active,
  eyebrow,
  title,
  subtitle,
  tone = "dashboard"
}: RouteLoadingShellProps) {
  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-4 pb-6 pt-6 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">{eyebrow}</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-[#737373]">{subtitle}</p> : null}
          </div>
          <PulseBlock className="h-11 w-11 rounded-full bg-white shadow-sm" />
        </header>

        {tone === "dashboard" ? <DashboardSkeleton /> : null}
        {tone === "history" ? <HistorySkeleton /> : null}
        {tone === "goals" ? <GoalsSkeleton /> : null}
        {tone === "profile" ? <ProfileSkeleton /> : null}
        {tone === "form" ? <FormSkeleton /> : null}

        <BottomNav active={active} />
      </div>
    </main>
  );
}
