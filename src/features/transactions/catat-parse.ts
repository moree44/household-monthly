export type CatatOption = {
  id: string;
  name: string;
};

export type LocalCatatDraft = {
  amount: string | null;
  walletId: string | null;
  categoryId: string | null;
  description: string | null;
  bucket: Bucket;
  confidence: number;
  queryTerm: string | null;
};

export type Bucket =
  | "belanja_dapur"
  | "food_drink"
  | "daily_needs"
  | "bills"
  | "transport"
  | "health"
  | "entertainment"
  | "social"
  | "home_care"
  | "others";

const bucketKeywords: Record<Bucket, string[]> = {
  belanja_dapur: [
    "belanja dapur",
    "bahan dapur",
    "pasar",
    "beras",
    "minyak goreng",
    "gula",
    "telur",
    "ayam potong",
    "ikan",
    "sayur",
    "kangkung",
    "bayam",
    "tomat",
    "bawang",
    "cabai",
    "cabe",
    "santan",
    "tepung",
    "bumbu",
    "lauk",
    "daging",
    "semangka",
    "melon",
    "buah",
    "wortel",
    "kentang",
    "brokoli",
    "sawi"
  ],
  food_drink: [
    "gorengan",
    "bakwan",
    "pisang goreng",
    "tempe goreng",
    "tahu isi",
    "tahu gejrot",
    "cireng",
    "cilok",
    "cimol",
    "batagor",
    "siomay",
    "pentol",
    "sempol",
    "pempek",
    "seblak",
    "bakso",
    "baso",
    "mie ayam",
    "nasi goreng",
    "pecel",
    "warteg",
    "padang",
    "soto",
    "rawon",
    "gado",
    "ketoprak",
    "bubur",
    "lontong",
    "nasi uduk",
    "geprek",
    "mcd",
    "mcdonald",
    "kfc",
    "hokben",
    "starbucks",
    "kopi",
    "coffee",
    "espresso",
    "cappuccino",
    "boba",
    "chatime",
    "mixue",
    "es teh",
    "es jeruk",
    "jus",
    "soda",
    "coca",
    "fanta",
    "sprite",
    "pocari",
    "mizone",
    "aqua",
    "le minerale",
    "lemineral",
    "teh botol",
    "teh kotak",
    "ultramilk",
    "yakult",
    "chitato",
    "nextar",
    "biskuit",
    "roti",
    "donat",
    "kue",
    "coklat",
    "permen",
    "gofood",
    "grabfood",
    "shopeefood",
    "jajan",
    "jajanan",
    "camilan",
    "snack",
    "minuman",
    "makan",
    "lunch",
    "dinner",
    "breakfast",
    "warung",
    "kafe",
    "cafe"
  ],
  daily_needs: [
    "galon",
    "air galon",
    "gas",
    "lpg",
    "sabun",
    "shampoo",
    "sampo",
    "odol",
    "pasta gigi",
    "deterjen",
    "detergen",
    "pewangi",
    "pembalut",
    "popok",
    "tisu",
    "tissue",
    "sunlight",
    "wipol",
    "laundry"
  ],
  bills: [
    "listrik",
    "pln",
    "token",
    "pdam",
    "wifi",
    "internet",
    "indihome",
    "orbit",
    "pulsa",
    "kuota",
    "bpjs",
    "iuran",
    "sampah",
    "keamanan"
  ],
  transport: [
    "bensin",
    "pertalite",
    "pertamax",
    "solar",
    "parkir",
    "tol",
    "grab",
    "gojek",
    "ojol",
    "taxi",
    "krl",
    "mrt",
    "servis motor",
    "servis mobil",
    "oli",
    "stnk"
  ],
  health: [
    "obat",
    "apotik",
    "apotek",
    "paracetamol",
    "bodrex",
    "vitamin",
    "dokter",
    "klinik",
    "gigi",
    "kacamata"
  ],
  entertainment: [
    "netflix",
    "spotify",
    "bioskop",
    "nonton",
    "game",
    "steam",
    "staycation",
    "liburan",
    "konser",
    "karaoke"
  ],
  social: ["kado", "nikahan", "wedding", "amplop", "donasi", "infak", "zakat", "arisan", "qurban"],
  home_care: [
    "kran",
    "cat tembok",
    "keset",
    "ember",
    "panci",
    "rice cooker",
    "kulkas",
    "lampu",
    "sofa",
    "kasur",
    "servis ac"
  ],
  others: []
};

const bucketCategoryHints: Record<Bucket, string[]> = {
  belanja_dapur: ["belanja dapur", "dapur"],
  food_drink: ["food", "drink", "makan", "minum", "jajanan"],
  daily_needs: ["daily", "kebutuhan harian", "kebutuhan"],
  bills: ["bill", "tagihan"],
  transport: ["transport", "transportasi"],
  health: ["health", "kesehatan"],
  entertainment: ["entertainment", "hiburan"],
  social: ["social", "sosial"],
  home_care: ["home care", "perawatan rumah", "rumah"],
  others: ["other", "lain"]
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s&]/g, " ").replace(/\s+/g, " ").trim();
}

export function parseCatatAmount(prompt: string) {
  const text = prompt.toLowerCase().replace(/,/g, ".");
  const match = text.match(
    /(\d+(?:\.\d{3})+|\d+(?:\.\d+)?)(?:\s*)(rb|ribu|k|jt|juta)?/
  );

  if (!match) {
    return null;
  }

  const raw = match[1];
  const suffix = match[2];
  const grouped = raw.includes(".") && /^\d{1,3}(?:\.\d{3})+$/.test(raw);
  const numeric = grouped ? Number(raw.replace(/\./g, "")) : Number(raw);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  let amount = numeric;

  if (suffix === "jt" || suffix === "juta") {
    amount = numeric * 1_000_000;
  } else if (suffix === "rb" || suffix === "ribu" || suffix === "k") {
    amount = numeric * 1000;
  }

  return String(Math.round(amount));
}

function scoreBucket(haystack: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => {
    if (keyword.length >= 4 && haystack.includes(keyword)) {
      return score + keyword.length;
    }

    const bounded = new RegExp(`(?:^|\\s)${keyword}(?:\\s|$)`);

    if (bounded.test(haystack)) {
      return score + keyword.length + 2;
    }

    return score;
  }, 0);
}

export function pickBucket(prompt: string): { bucket: Bucket; confidence: number } {
  const haystack = normalize(prompt);
  let best: Bucket = "others";
  let bestScore = 0;

  (Object.keys(bucketKeywords) as Bucket[]).forEach((bucket) => {
    const score = scoreBucket(haystack, bucketKeywords[bucket]);

    if (score > bestScore) {
      best = bucket;
      bestScore = score;
    }
  });

  return { bucket: best, confidence: bestScore };
}

export function pickCategory(categories: CatatOption[], bucket: Bucket) {
  const hints = bucketCategoryHints[bucket];
  const hinted = categories.find((category) => {
    const name = normalize(category.name);
    return hints.some((hint) => name.includes(hint));
  });

  if (hinted) {
    return hinted.id;
  }

  const others = categories.find((category) => /other|lain/i.test(category.name));
  return others?.id ?? categories[0]?.id ?? null;
}

function pickWallet(wallets: CatatOption[], prompt: string) {
  const haystack = normalize(prompt);

  if (/(istri|dompet istri|\bdoe\b|jajan dia)/.test(haystack)) {
    const wife = wallets.find((wallet) => /istri|wife/i.test(wallet.name));
    if (wife) {
      return wife.id;
    }
  }

  if (/tabungan/.test(haystack)) {
    const savings = wallets.find((wallet) => /tabungan/i.test(wallet.name));
    if (savings) {
      return savings.id;
    }
  }

  const kas = wallets.find((wallet) => /kas|operasional|rumah tangga/i.test(wallet.name));
  return kas?.id ?? wallets[0]?.id ?? null;
}

function pickDescription(prompt: string) {
  const cleaned = prompt
    .replace(/(\d+(?:[.,]\d+)?)(?:\s*)(rb|ribu|k|jt|juta)?/gi, " ")
    .replace(/\b(kas|rumah tangga|dompet|istri|dari|pakai|beli|buat)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return prompt.trim();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const stopTerms = new Set([
  "rb",
  "ribu",
  "k",
  "jt",
  "juta",
  "kas",
  "rumah",
  "tangga",
  "dompet",
  "istri",
  "dari",
  "pakai",
  "beli",
  "buat",
  "yang",
  "dengan"
]);

export function extractQueryTerm(prompt: string) {
  const tokens = normalize(prompt)
    .split(" ")
    .filter((token) => token && !stopTerms.has(token) && !/^\d/.test(token));

  return tokens.slice(0, 3).join(" ") || null;
}

export function parseCatatLocally(
  prompt: string,
  wallets: CatatOption[],
  categories: CatatOption[]
): LocalCatatDraft {
  const amount = parseCatatAmount(prompt);
  const { bucket, confidence } = pickBucket(prompt);

  return {
    amount: amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : null,
    walletId: pickWallet(wallets, prompt),
    categoryId: pickCategory(categories, bucket),
    description: pickDescription(prompt),
    bucket,
    confidence,
    queryTerm: extractQueryTerm(prompt)
  };
}
