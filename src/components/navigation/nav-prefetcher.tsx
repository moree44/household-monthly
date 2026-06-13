"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type NavPrefetcherProps = {
  hrefs: string[];
};

export function NavPrefetcher({ hrefs }: NavPrefetcherProps) {
  const router = useRouter();

  useEffect(() => {
    const uniqueHrefs = Array.from(new Set(hrefs));

    for (const href of uniqueHrefs) {
      router.prefetch(href);
    }
  }, [hrefs, router]);

  return null;
}
