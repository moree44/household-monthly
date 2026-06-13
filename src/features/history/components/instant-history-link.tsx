"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type InstantHistoryLinkProps = {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className: string;
  activeClassName: string;
  inactiveClassName: string;
  ariaLabel?: string;
};

export function InstantHistoryLink({
  active = false,
  activeClassName,
  ariaLabel,
  children,
  className,
  href,
  inactiveClassName
}: InstantHistoryLinkProps) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!pressed) {
      return;
    }

    const timeoutId = window.setTimeout(() => setPressed(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [pressed]);

  const isActive = active || pressed;

  return (
    <Link
      href={href}
      prefetch
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      onClick={() => setPressed(true)}
      className={cn(className, isActive ? activeClassName : inactiveClassName)}
      style={isActive ? { color: "#FAFAFA" } : undefined}
    >
      {children}
    </Link>
  );
}
