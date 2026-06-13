import type { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { MonthContext } from "@/lib/date/month";

export type HistoryTypeFilter = "all" | TransactionType;
export type HistoryStatusFilter = "active" | "deleted";
export type HistoryWeekFilter = "all" | "1" | "2" | "3" | "4";
export type HistoryWeek = {
  value: Exclude<HistoryWeekFilter, "all">;
  label: string;
  rangeLabel: string;
  startDay: number;
  endDay: number;
};
export type HistoryItem = {
  id: string;
  type: Exclude<HistoryTypeFilter, "all">;
  typeLabel: string;
  dateGroup: string;
  dayOfMonth: number;
  time: string;
  title: string;
  subtitle: string;
  amount: number;
  note: string | null;
  actor: string;
  deletedAt: string | null;
  deletedBy: string | null;
  deletedLabel: string | null;
};
export type HistoryGroup = {
  date: string;
  items: HistoryItem[];
};

function decimalToNumber(value: { toString(): string } | null | undefined) {
  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

function formatDateGroup(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getTransactionTypeLabel(type: TransactionType) {
  const labels: Record<TransactionType, string> = {
    expense: "Expense",
    top_up: "Top Up",
    transfer: "Transfer",
    adjustment: "Adjustment"
  };

  return labels[type];
}

export function parseHistoryTypeFilter(value: string | string[] | undefined): HistoryTypeFilter {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (
    rawValue === "expense" ||
    rawValue === "top_up" ||
    rawValue === "transfer" ||
    rawValue === "adjustment"
  ) {
    return rawValue;
  }

  return "all";
}

export function parseHistoryStatusFilter(value: string | string[] | undefined): HistoryStatusFilter {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "deleted") {
    return "deleted";
  }

  return "active";
}

export function parseHistoryWeekFilter(value: string | string[] | undefined): HistoryWeekFilter {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "1" || rawValue === "2" || rawValue === "3" || rawValue === "4") {
    return rawValue;
  }

  return "all";
}

function getMonthWeekRanges(month: MonthContext) {
  const ranges: HistoryWeek[] = [];

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "short"
  }).format(month.start);

  const lastDayOfMonth = new Date(month.end.getTime() - 1).getDate();

  for (let index = 0; index < 4; index += 1) {
    const startDay = index * 7 + 1;
    const endDay = index === 3 ? lastDayOfMonth : Math.min(startDay + 6, lastDayOfMonth);

    if (startDay > endDay) {
      break;
    }

    ranges.push({
      value: String(index + 1) as Exclude<HistoryWeekFilter, "all">,
      label: `W${index + 1}`,
      rangeLabel: `${startDay}-${endDay} ${monthLabel}`,
      startDay,
      endDay
    });
  }

  return ranges;
}

export function groupHistoryItems(items: HistoryItem[]) {
  return items.reduce<HistoryGroup[]>((result, item) => {
    const existingGroup = result.find((group) => group.date === item.dateGroup);

    if (existingGroup) {
      existingGroup.items.push(item);
      return result;
    }

    result.push({
      date: item.dateGroup,
      items: [item]
    });

    return result;
  }, []);
}

export async function getHistoryData(
  typeFilter: HistoryTypeFilter,
  statusFilter: HistoryStatusFilter,
  weekFilter: HistoryWeekFilter,
  month: MonthContext
) {
  const weeks = getMonthWeekRanges(month);
  const selectedWeek = weekFilter === "all" ? null : weeks.find((week) => week.value === weekFilter) ?? null;
  const resolvedWeekFilter: HistoryWeekFilter = selectedWeek ? selectedWeek.value : "all";

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: month.start,
        lt: month.end
      }
    },
    orderBy: [
      {
        transactionDate: "desc"
      },
      {
        createdAt: "desc"
      }
    ],
    select: {
      id: true,
      type: true,
      transactionDate: true,
      amount: true,
      description: true,
      deletedAt: true,
      createdAt: true,
      wallet: { select: { name: true } },
      fromWallet: { select: { name: true } },
      toWallet: { select: { name: true } },
      sourceAccount: { select: { name: true } },
      category: { select: { name: true } },
      createdBy: { select: { displayName: true } },
      deletedBy: { select: { displayName: true } }
    }
  });

  const items = transactions.map<HistoryItem>((transaction) => {
    const amount = decimalToNumber(transaction.amount);
    const transferSubtitle = [transaction.fromWallet?.name, transaction.toWallet?.name]
      .filter(Boolean)
      .join(" -> ");

    return {
      id: transaction.id,
      type: transaction.type,
      typeLabel: getTransactionTypeLabel(transaction.type),
      dateGroup: formatDateGroup(transaction.transactionDate),
      dayOfMonth: transaction.transactionDate.getDate(),
      time: formatTime(transaction.createdAt),
      title:
        transaction.category?.name ??
        (transaction.type === "top_up"
          ? `Top Up ${transaction.wallet?.name ?? ""}`.trim()
          : transaction.type === "transfer"
            ? "Transfer"
            : "Adjustment"),
      subtitle:
        transaction.type === "top_up"
          ? transaction.sourceAccount?.name ?? transaction.wallet?.name ?? "-"
          : (transaction.wallet?.name ?? transferSubtitle) || "-",
      amount: transaction.type === "expense" ? -amount : amount,
      note: transaction.description,
      actor: transaction.createdBy.displayName,
      deletedAt: transaction.deletedAt?.toISOString() ?? null,
      deletedBy: transaction.deletedBy?.displayName ?? null,
      deletedLabel: transaction.deletedAt
        ? `${formatDateGroup(transaction.deletedAt)} · ${formatTime(transaction.deletedAt)}`
        : null
    };
  });

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "deleted" ? Boolean(item.deletedAt) : !item.deletedAt;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesWeek =
      resolvedWeekFilter === "all" ||
      (selectedWeek ? item.dayOfMonth >= selectedWeek.startDay && item.dayOfMonth <= selectedWeek.endDay : true);

    return matchesStatus && matchesType && matchesWeek;
  });

  return {
    monthKey: month.key,
    monthLabel: month.label,
    previousMonthKey: month.previousKey,
    nextMonthKey: month.nextKey,
    typeFilter,
    statusFilter,
    weekFilter: resolvedWeekFilter,
    weeks,
    items,
    groups: groupHistoryItems(filteredItems)
  };
}
