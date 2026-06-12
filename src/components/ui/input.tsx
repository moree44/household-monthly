import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[14px] border border-transparent bg-[#F5F5F5] px-3 text-sm font-semibold text-[#171717] outline-none transition placeholder:text-[#A3A3A3] focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        className
      )}
      {...props}
    />
  );
}
