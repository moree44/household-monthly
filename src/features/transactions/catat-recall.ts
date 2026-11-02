import { prisma } from "@/lib/db/prisma";

export type ChatHistoryTurn = {
  role: "user" | "bot";
  text: string;
};

export function normalizeMemoryTerm(value: string) {
  return value
    .toLowerCase()
    .replace(/\d+/g, " ")
    .replace(/\b(rb|ribu|k|jt|juta|rp)\b/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function listLearnedFacts() {
  return prisma.catatMemory.findMany({
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      term: true,
      kind: true,
      value: true,
      label: true
    }
  });
}

export async function recallCategoryId(term: string | null) {
  const normalized = term ? normalizeMemoryTerm(term) : "";

  if (!normalized) {
    return null;
  }

  const memory = await prisma.catatMemory.findUnique({
    where: {
      term_kind: {
        term: normalized,
        kind: "category"
      }
    },
    select: {
      value: true,
      label: true
    }
  });

  return memory;
}

export async function rememberCategory(input: {
  userId: string;
  term: string | null;
  categoryId: string;
  label: string;
}) {
  const term = input.term ? normalizeMemoryTerm(input.term) : "";

  if (!term || term.length < 3) {
    return;
  }

  await prisma.catatMemory.upsert({
    where: {
      term_kind: {
        term,
        kind: "category"
      }
    },
    update: {
      value: input.categoryId,
      label: input.label,
      createdById: input.userId
    },
    create: {
      term,
      kind: "category",
      value: input.categoryId,
      label: input.label,
      createdById: input.userId
    }
  });
}

export async function loadChatHistory(userId: string): Promise<ChatHistoryTurn[]> {
  const rows = await prisma.catatChatTurn.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { role: true, text: true }
  });

  return rows
    .reverse()
    .filter((row) => row.role === "user" || row.role === "bot")
    .map((row) => ({
      role: row.role as "user" | "bot",
      text: row.text
    }));
}

export async function appendChatTurns(userId: string, turns: ChatHistoryTurn[]) {
  if (turns.length === 0) {
    return;
  }

  await prisma.catatChatTurn.createMany({
    data: turns.map((turn) => ({
      userId,
      role: turn.role,
      text: turn.text.slice(0, 500)
    }))
  });

  const extra = await prisma.catatChatTurn.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 40,
    select: { id: true }
  });

  if (extra.length > 0) {
    await prisma.catatChatTurn.deleteMany({
      where: {
        id: { in: extra.map((row) => row.id) }
      }
    });
  }
}

export function formatLearnedFacts(
  facts: Array<{ term: string; kind: string; label: string }>
) {
  if (facts.length === 0) {
    return "";
  }

  return facts
    .slice(0, 25)
    .map((fact) => `- ${fact.term} → ${fact.label} (${fact.kind})`)
    .join("\n");
}
