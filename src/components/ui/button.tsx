import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "bg-[#171717] text-white shadow-sm hover:bg-[#262626]",
  secondary: "bg-white text-[#171717] shadow-sm hover:bg-[#FAFAFA]",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-[#525252] hover:bg-[#E5E5E5]"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-bold leading-none transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
