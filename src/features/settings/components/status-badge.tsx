import { CheckCircle2, XCircle } from "lucide-react";

type StatusBadgeProps = {
  error: string | null;
  success: string | null;
};

export function StatusBadge({ error, success }: StatusBadgeProps) {
  const message = error ?? success;

  if (!message) {
    return null;
  }

  const isError = Boolean(error);
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${
        isError ? "bg-red-50 text-red-700" : "bg-white text-[#525252]"
      }`}
    >
      <Icon size={13} strokeWidth={2} />
      <span className="truncate">{message}</span>
    </div>
  );
}
