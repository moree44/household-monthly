import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-[20px] bg-white p-4 shadow-sm shadow-black/5", className)}
      {...props}
    />
  );
}
