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

// ---------------------------------------------------------------------------
// Command gates for chat: delete / edit / wallet / top-up / transfer / finance
// ---------------------------------------------------------------------------

const commandStopTerms = new Set([
  ...stopTerms,
  "hapus",
  "hapusin",
  "buang",
  "bersihin",
  "bersihkan",
  "delete",
  "edit",
  "ubah",
  "ganti",
  "revisi",
  "update",
  "semua",
  "all",
  "catat",
  "catatan",
  "transaksi",
  "pengeluaran",
  "belanja",
  "bulan",
  "ini",
  "lalu",
  "tadi",
  "kemarin",
  "terakhir",
  "barusan",
  "aja",
  "saja",
  "dong",
  "ya",
  "deh",
  "nih",
  "jadi",
  "jd",
  "ke",
  "di",
  "yg",
  "halo",
  "hai",
  "bro",
  "bang",
  "tolong",
  "coba",
  "biar",
  "data",
  "keuangan",
  "uang",
  "dulu",
  "udah",
  "itu",
  "nanti",
  "please",
  "bersih",
  "beres",
  "beresin",
  "bereskan",
  "saldo",
  "wallet",
  "kan",
  "ada",
  "isinya",
  "juga",
  "semuanya",
  "banget",
  "sudah",
  "sama",
  "dan",
  "atau",
  "terus",
  "trus"
]);

function cleanTail(fragment: string, maxWords = 3) {
  const fillers = new Set(["dong", "ya", "deh", "aja", "saja", "nih", "yg", "yang"]);
  const tokens = fragment
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  while (tokens.length > 0 && fillers.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens.slice(0, maxWords).join(" ").trim() || null;
}

export function extractTopicTerm(prompt: string) {
  const tokens = normalize(prompt)
    .split(" ")
    .filter((token) => token && !commandStopTerms.has(token) && !/^\d/.test(token));

  return tokens.slice(0, 4).join(" ") || null;
}

export function matchOptionByName(text: string, options: CatatOption[]): CatatOption | null {
  const normalized = normalize(text);

  if (!normalized) {
    return null;
  }

  return (
    options.find((option) => normalize(option.name) === normalized) ??
    options.find((option) => normalized.includes(normalize(option.name))) ??
    options.find((option) => normalized.length >= 3 && normalize(option.name).includes(normalized)) ??
    options.find((option) => {
      const first = normalize(option.name).split(/\s+/)[0];
      return first.length > 3 && normalized.includes(first);
    }) ??
    null
  );
}

export type DeleteCommand = {
  term: string | null;
  bulk: boolean;
  lastOnly: boolean;
  lastMonth: boolean;
  amountDigits: string | null;
};

// Kalau sisa term-nya cuma kata lingkup keuangan (termasuk typo umum),
// berarti user minta membersihkan semuanya, bukan satu jenis catatan.
const financeScopeWords = new Set(["keuangan", "keungan", "uang", "saldo", "dana", "finansial", "keu"]);

export function parseDeleteCommand(prompt: string): DeleteCommand | null {
  const text = prompt.toLowerCase();

  if (!/\b(hapus|hapusin|buang|bersih(in|kan)|kosong(in|kan)?|delete|ilangin)\b/.test(text)) {
    return null;
  }

  let term = extractTopicTerm(text);

  if (term) {
    const tokens = term.split(" ");

    if (tokens.every((token) => financeScopeWords.has(token))) {
      term = null;
    }
  }

  return {
    term,
    bulk: /\b(semua|all|bersih(in|kan)|kosong(in|kan)?)\b/.test(text),
    lastOnly: /\b(tadi|terakhir|barusan)\b/.test(text),
    lastMonth: /\bbulan lalu\b/.test(text),
    amountDigits: parseCatatAmount(text)
  };
}

export type EditCommand = {
  term: string | null;
  amountDigits: string | null;
  categoryName: string | null;
  walletName: string | null;
  description: string | null;
};

export function parseEditCommand(prompt: string): EditCommand | null {
  const text = prompt.toLowerCase();

  if (!/\b(edit|ubah|ganti|revisi)\b/.test(text)) {
    return null;
  }

  let working = text;
  let amountDigits: string | null = null;
  let categoryName: string | null = null;
  let walletName: string | null = null;
  let description: string | null = null;

  const amountMatch = working.match(
    /(?:jadi|jd|nominal(?:nya)?|jumlah(?:nya)?)\s+([\d.,]+\s*(?:rb|ribu|k|jt|juta)?)/
  );

  if (amountMatch) {
    amountDigits = parseCatatAmount(amountMatch[1]);
    working = working.replace(amountMatch[0], " ");
  }

  const categoryMatch =
    working.match(/kategor(?:inya|i)\s*(?:jadi|jd|ke|menjadi)?\s*(.+)/) ??
    working.match(/(?:jadi|jd)\s+kategor(?:inya|i)\s+(.+)/);

  if (categoryMatch) {
    categoryName = cleanTail(categoryMatch[1]);
    working = working.replace(categoryMatch[0], " ");
  }

  const walletMatch =
    working.match(/(?:pindah(?:in)?|mindah(?:in)?)\s+ke\s+(?:wallet|dompet)?\s*(.+)/) ??
    working.match(/(?:wallet|dompet)(?:nya)?\s*(?:jadi|jd|ke)\s*(.+)/);

  if (walletMatch) {
    walletName = cleanTail(walletMatch[1], 4);
    working = working.replace(walletMatch[0], " ");
  }

  const descriptionMatch = working.match(/(?:catatan|note)(?:nya)?\s*(?:jadi|jd)?\s*(.+)/);

  if (descriptionMatch) {
    description = cleanTail(descriptionMatch[1], 8);
    working = working.replace(descriptionMatch[0], " ");
  }

  return {
    term: extractTopicTerm(working),
    amountDigits,
    categoryName,
    walletName,
    description
  };
}

export type WalletCommand = {
  action: "create" | "deactivate";
  name: string | null;
  initialBalanceDigits: string | null;
};

const transactionNouns = /\b(catat|catatan|transaksi|pengeluaran|belanja|transfer|top\s?up)\b/;

export function parseWalletCommand(prompt: string): WalletCommand | null {
  const text = prompt.toLowerCase();

  if (!/\b(wallet|dompet)\b/.test(text) || transactionNouns.test(text)) {
    return null;
  }

  const wantsCreate = /\b(tambah|buat|bikin)\b/.test(text);
  const wantsDeactivate = /\b(hapus|hapusin|buang|nonaktif(?:in)?|mati(?:in)?)\b/.test(text);

  if (!wantsCreate && !wantsDeactivate) {
    return null;
  }

  const verbPattern = wantsCreate
    ? /(?:tambah|buat|bikin)\s+(?:wallet|dompet)\s+(.+)/
    : /(?:hapus|hapusin|buang|nonaktif(?:in)?|mati(?:in)?)\s+(?:wallet|dompet)?\s*(.+)/;
  const verbMatch = text.match(verbPattern);

  let name = verbMatch?.[1] ?? null;

  if (name) {
    name = name
      .replace(/\b(saldo(?:\s+awal)?|isi|sebesar)\s+[\d.,]+\s*(rb|ribu|k|jt|juta)?\b/g, " ")
      .replace(/\b(dong|ya|deh|aja|saja|baru|nih)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    name = name || null;
  }

  return {
    action: wantsCreate ? "create" : "deactivate",
    name,
    initialBalanceDigits: wantsCreate ? parseCatatAmount(text) : null
  };
}

function cleanNameFragment(fragment: string) {
  const cleaned = fragment
    .replace(/\b(wallet|dompet|rekening|rek|saldo|dari)\b/g, " ")
    .replace(/\b(dong|ya|deh|aja|saja)\b/g, " ")
    .replace(/[\d.,]+\s*(rb|ribu|k|jt|juta)?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

export type TransferIntent = {
  type: "top_up" | "transfer";
  amountDigits: string | null;
  fromName: string | null;
  toName: string | null;
};

export function parseTransferIntent(prompt: string): TransferIntent | null {
  const text = prompt.toLowerCase().replace(/\s+/g, " ").trim();
  const amountDigits = parseCatatAmount(text);
  // "top up" khas, boleh di mana saja. "isi saldo/dana" cuma dianggap perintah
  // kalau di awal kalimat, supaya "itu ada isi saldo 9 juta" tidak ikut ke-draft.
  const isTopUp =
    /\btop\s?up\b/.test(text) || /^\s*(isi\s+(?:saldo|dana)|top\s?up)\b/.test(text);
  const isTransfer =
    /\btransfer\b/.test(text) ||
    (Boolean(amountDigits) && /\b(pindah|mindah)(?:in)?\b/.test(text));

  if (!isTopUp && !isTransfer) {
    return null;
  }

  const dariMatch = text.match(/\bdari\s+(.+?)(?:\s+ke\s+|$)/);
  const keMatch = text.match(/\s+ke\s+(.+)$/);

  return {
    type: isTopUp ? "top_up" : "transfer",
    amountDigits,
    fromName: dariMatch ? cleanNameFragment(dariMatch[1]) : null,
    toName: keMatch ? cleanNameFragment(keMatch[1]) : null
  };
}

export type FinanceQuestion = {
  kind: "balance" | "category" | "week" | "person" | "list";
  categoryName: string | null;
  week: number | null;
  person: "istri" | "suami" | null;
  listTerm: string | null;
};

const weekOrdinals: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  pertama: 1,
  kedua: 2,
  ketiga: 3,
  keempat: 4
};

const financeQueryWords =
  /(berapa|habis|abis|total|pengeluaran|belanja|ringkas|summary|daftar|list|catatan|transaksi|saldo|keuangan)/;

export function parseFinanceQuestion(
  prompt: string,
  categories: CatatOption[]
): FinanceQuestion | null {
  const text = prompt.toLowerCase().replace(/\s+/g, " ").trim();
  const weekMatch = text.match(/(?:minggu|pekan)\s+(1|2|3|4|pertama|kedua|ketiga|keempat)\b/);
  const textWithoutWeek = weekMatch ? text.replace(weekMatch[0], " ") : text;
  const hasAmount = Boolean(parseCatatAmount(textWithoutWeek));
  const person = /istri|\bdoe\b/.test(text) ? "istri" : /\b(suami|kita|bersama)\b/.test(text) ? "suami" : null;

  if (weekMatch && !hasAmount) {
    return {
      kind: "week",
      categoryName: null,
      week: weekOrdinals[weekMatch[1]] ?? null,
      person,
      listTerm: null
    };
  }

  if (hasAmount || !financeQueryWords.test(text)) {
    return null;
  }

  if (/\b(daftar|list|catatan|transaksi)\b/.test(text) && !/berapa|total|ringkas|summary/.test(text)) {
    return {
      kind: "list",
      categoryName: null,
      week: null,
      person: null,
      listTerm: extractTopicTerm(text)
    };
  }

  const categoryMatch = matchOptionByName(textWithoutWeek, categories);

  if (categoryMatch) {
    return {
      kind: "category",
      categoryName: categoryMatch.name,
      week: null,
      person: null,
      listTerm: null
    };
  }

  if (person) {
    return { kind: "person", categoryName: null, week: null, person, listTerm: null };
  }

  return { kind: "balance", categoryName: null, week: null, person: null, listTerm: null };
}
