import type { Bucket } from "@/features/transactions/catat-parse";

export type LookupHit = {
  title: string;
  extract: string;
  bucket: Bucket;
  confidence: number;
  reason: string;
};

const extractHints: Array<{ bucket: Bucket; keywords: string[]; reason: string }> = [
  {
    bucket: "food_drink",
    keywords: [
      "makanan khas",
      "hidangan",
      "jajanan",
      "kudapan",
      "camilan",
      "makanan ringan",
      "disajikan",
      "minuman",
      "digoreng",
      "warung",
      "kue",
      "snack",
      "lotek",
      "salad"
    ],
    reason: "jajanan/makanan/minuman"
  },
  {
    bucket: "belanja_dapur",
    keywords: ["bahan pokok", "bumbu dapur", "rempah-rempah", "komoditas pertanian", "sayuran", "tumbuhan"],
    reason: "bahan masak"
  },
  {
    bucket: "daily_needs",
    keywords: ["galon", "deterjen", "sabun", "keperluan rumah tangga", "gas elpiji"],
    reason: "kebutuhan rumah"
  },
  {
    bucket: "transport",
    keywords: ["bahan bakar", "kendaraan", "bensin", "transportasi", "parkir"],
    reason: "transport"
  },
  {
    bucket: "health",
    keywords: ["obat", "kesehatan", "medis", "klinik", "vitamin"],
    reason: "kesehatan"
  },
  {
    bucket: "bills",
    keywords: ["tagihan", "listrik", "pelanggan", "iuran"],
    reason: "tagihan"
  },
  {
    bucket: "entertainment",
    keywords: ["hiburan", "film", "permainan", "streaming"],
    reason: "hiburan"
  },
  {
    bucket: "home_care",
    keywords: ["peralatan rumah", "perabot", "perbaikan"],
    reason: "perawatan rumah"
  }
];

function classifyExtract(text: string): Pick<LookupHit, "bucket" | "confidence" | "reason"> {
  const haystack = text.toLowerCase();
  let best: LookupHit["bucket"] = "others";
  let bestScore = 0;
  let reason = "tidak jelas";

  for (const hint of extractHints) {
    const score = hint.keywords.reduce((sum, keyword) => (haystack.includes(keyword) ? sum + keyword.length : sum), 0);

    if (score > bestScore) {
      best = hint.bucket;
      bestScore = score;
      reason = hint.reason;
    }
  }

  return { bucket: best, confidence: bestScore, reason };
}

async function wikiJson(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "HouseholdMonthly/0.1 (private household catat lookup)"
    },
    signal: AbortSignal.timeout(3500)
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function lookupItemMeaning(term: string): Promise<LookupHit | null> {
  const query = term.trim();

  if (query.length < 3) {
    return null;
  }

  const search = await wikiJson(
    `https://id.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=1`
  );
  const pages = Array.isArray(search?.pages) ? (search.pages as Array<{ title?: string; description?: string; excerpt?: string }>) : [];
  const title = pages[0]?.title;

  if (!title) {
    return null;
  }

  const summary = await wikiJson(
    `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  const extract = String(summary?.extract ?? pages[0]?.description ?? pages[0]?.excerpt ?? "").replace(/<[^>]+>/g, " ");

  if (!extract.trim()) {
    return null;
  }

  const classified = classifyExtract(`${title} ${extract}`);

  if (classified.confidence <= 0) {
    return null;
  }

  return {
    title,
    extract: extract.slice(0, 280),
    bucket: classified.bucket,
    confidence: classified.confidence,
    reason: classified.reason
  };
}
