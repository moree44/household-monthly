"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PencilLine,
  SlidersHorizontal
} from "lucide-react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { DeleteTransactionButton } from "@/features/transactions/components/delete-transaction-button";
import { RestoreTransactionButton } from "@/features/transactions/components/restore-transaction-button";
import { formatRupiah } from "@/lib/format/currency";
import { withMonthParam } from "@/lib/date/month";
import { cn } from "@/lib/utils";
import type {
  HistoryItem,
  HistoryStatusFilter,
  HistoryTypeFilter,
  HistoryWeek,
  HistoryWeekFilter
} from "@/features/history/data";
import { InstantHistoryLink } from "@/features/history/components/instant-history-link";

type HistoryClientProps = {
  history: {
    monthKey: string;
    monthLabel: string;
    previousMonthKey: string;
    nextMonthKey: string;
    typeFilter: HistoryTypeFilter;
    statusFilter: HistoryStatusFilter;
    weekFilter: HistoryWeekFilter;
    weeks: HistoryWeek[];
    items: HistoryItem[];
  };
};

const filters: { label: string; value: HistoryTypeFilter }[] = [
  { label: "Semua", value: "all" },
  { label: "Expense", value: "expense" },
  { label: "Top Up", value: "top_up" },
  { label: "Transfer", value: "transfer" },
  { label: "Adjust", value: "adjustment" }
];

const statusFilters: { label: string; value: HistoryStatusFilter }[] = [
  { label: "Aktif", value: "active" },
  { label: "Deleted", value: "deleted" }
];

const typeTone = {
  expense: "bg-red-50 text-red-700",
  top_up: "bg-blue-50 text-blue-700",
  transfer: "bg-[#E5E5E5] text-[#525252]",
  adjustment: "bg-amber-50 text-amber-700"
};

const typeIconTone = {
  expense: "bg-[#D4D4D4] text-[#525252]",
  top_up: "bg-[#171717] text-[#FAFAFA]",
  transfer: "bg-[#E5E5E5] text-[#525252]",
  adjustment: "bg-amber-50 text-amber-700"
};

function getEditHref(transaction: { id: string; type: HistoryTypeFilter }) {
  if (transaction.type === "expense") {
    return `/expenses/${transaction.id}/edit`;
  }

  if (transaction.type === "top_up") {
    return `/top-ups/${transaction.id}/edit`;
  }

  if (transaction.type === "transfer") {
    return `/transfers/${transaction.id}/edit`;
  }

  return null;
}

function buildHistoryParams({
  statusFilter,
  typeFilter,
  weekFilter
}: {
  statusFilter: HistoryStatusFilter;
  typeFilter: HistoryTypeFilter;
  weekFilter: HistoryWeekFilter;
}) {
  return {
    ...(statusFilter === "deleted" ? { status: "deleted" } : {}),
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    ...(weekFilter !== "all" ? { week: weekFilter } : {})
  };
}

function replaceHistoryUrl({
  monthKey,
  statusFilter,
  typeFilter,
  weekFilter
}: {
  monthKey: string;
  statusFilter: HistoryStatusFilter;
  typeFilter: HistoryTypeFilter;
  weekFilter: HistoryWeekFilter;
}) {
  const params = new URLSearchParams();
  params.set("month", monthKey);

  if (statusFilter === "deleted") {
    params.set("status", "deleted");
  }

  if (typeFilter !== "all") {
    params.set("type", typeFilter);
  }

  if (weekFilter !== "all") {
    params.set("week", weekFilter);
  }

  window.history.replaceState(null, "", `/history?${params.toString()}`);
}

function groupHistoryItems(items: HistoryItem[]) {
  return items.reduce<{ date: string; items: HistoryItem[] }[]>((result, item) => {
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

function TransactionTypeIcon({ type }: { type: Exclude<HistoryTypeFilter, "all"> }) {
  const iconProps = {
    size: 17,
    strokeWidth: 1.9
  };

  if (type === "expense") {
    return <ArrowUpRight {...iconProps} />;
  }

  if (type === "top_up") {
    return <ArrowDownLeft {...iconProps} />;
  }

  if (type === "transfer") {
    return <ArrowRightLeft {...iconProps} />;
  }

  return <SlidersHorizontal {...iconProps} />;
}

export function HistoryClient({ history }: HistoryClientProps) {
  const [statusFilter, setStatusFilter] = useState(history.statusFilter);
  const [typeFilter, setTypeFilter] = useState(history.typeFilter);
  const [weekFilter, setWeekFilter] = useState(history.weekFilter);

  const selectedWeek = weekFilter === "all" ? null : history.weeks.find((week) => week.value === weekFilter) ?? null;
  const resolvedWeekFilter = selectedWeek ? selectedWeek.value : "all";

  const groups = useMemo(() => {
    const filteredItems = history.items.filter((item) => {
      const matchesStatus = statusFilter === "deleted" ? Boolean(item.deletedAt) : !item.deletedAt;
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesWeek =
        resolvedWeekFilter === "all" ||
        (selectedWeek ? item.dayOfMonth >= selectedWeek.startDay && item.dayOfMonth <= selectedWeek.endDay : true);

      return matchesStatus && matchesType && matchesWeek;
    });

    return groupHistoryItems(filteredItems);
  }, [history.items, resolvedWeekFilter, selectedWeek, statusFilter, typeFilter]);

  function updateFilters(nextFilters: {
    statusFilter?: HistoryStatusFilter;
    typeFilter?: HistoryTypeFilter;
    weekFilter?: HistoryWeekFilter;
  }) {
    const nextStatusFilter = nextFilters.statusFilter ?? statusFilter;
    const nextTypeFilter = nextFilters.typeFilter ?? typeFilter;
    const nextWeekFilter = nextFilters.weekFilter ?? weekFilter;

    setStatusFilter(nextStatusFilter);
    setTypeFilter(nextTypeFilter);
    setWeekFilter(nextWeekFilter);

    replaceHistoryUrl({
      monthKey: history.monthKey,
      statusFilter: nextStatusFilter,
      typeFilter: nextTypeFilter,
      weekFilter: nextWeekFilter
    });
  }

  return (
    <>
      <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[#E5E5E5] p-1.5 shadow-sm">
        <InstantHistoryLink
          href={withMonthParam(
            "/history",
            history.previousMonthKey,
            buildHistoryParams({ statusFilter, typeFilter, weekFilter: resolvedWeekFilter })
          )}
          className="grid h-9 w-9 place-items-center rounded-[12px] transition"
          activeClassName="bg-[#171717] text-[#FAFAFA]"
          inactiveClassName="bg-[#F5F5F5] text-[#525252] hover:bg-[#D4D4D4]"
          ariaLabel="Bulan sebelumnya"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </InstantHistoryLink>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">periode</p>
          <p className="text-sm font-bold text-[#171717]">{history.monthLabel}</p>
        </div>
        <InstantHistoryLink
          href={withMonthParam(
            "/history",
            history.nextMonthKey,
            buildHistoryParams({ statusFilter, typeFilter, weekFilter: resolvedWeekFilter })
          )}
          className="grid h-9 w-9 place-items-center rounded-[12px] transition"
          activeClassName="bg-[#171717] text-[#FAFAFA]"
          inactiveClassName="bg-[#F5F5F5] text-[#525252] hover:bg-[#D4D4D4]"
          ariaLabel="Bulan berikutnya"
        >
          <ChevronRight size={18} strokeWidth={1.8} />
        </InstantHistoryLink>
      </div>

      <div className="mt-5 rounded-[20px] bg-[#E5E5E5] p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => updateFilters({ statusFilter: filter.value })}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-[13px] px-4 text-sm font-bold transition",
                statusFilter === filter.value
                  ? "bg-[#171717] text-[#FAFAFA]"
                  : "bg-[#F5F5F5] text-[#525252] hover:bg-[#FAFAFA]"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <p className="px-1 text-[10px] font-bold uppercase tracking-normal text-[#737373]">Tipe</p>
          <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => updateFilters({ typeFilter: filter.value })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-[11px] px-3 text-[11px] font-bold transition",
                  typeFilter === filter.value
                    ? "bg-[#171717] text-[#FAFAFA]"
                    : "bg-[#F5F5F5] text-[#525252] hover:bg-[#FAFAFA]"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[10px] font-bold uppercase tracking-normal text-[#737373]">Minggu</p>
            <p className="text-[10px] font-bold text-[#737373]">
              {resolvedWeekFilter === "all" ? "Semua minggu" : selectedWeek?.rangeLabel}
            </p>
          </div>
          <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => updateFilters({ weekFilter: "all" })}
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-[11px] px-3 text-[11px] font-bold transition",
                resolvedWeekFilter === "all"
                  ? "bg-[#171717] text-[#FAFAFA]"
                  : "bg-[#F5F5F5] text-[#525252] hover:bg-[#FAFAFA]"
              )}
            >
              Semua
            </button>
            {history.weeks.map((week) => (
              <button
                key={week.value}
                type="button"
                onClick={() => updateFilters({ weekFilter: week.value })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-[11px] px-3 text-[11px] font-bold transition",
                  resolvedWeekFilter === week.value
                    ? "bg-[#171717] text-[#FAFAFA]"
                    : "bg-[#F5F5F5] text-[#525252] hover:bg-[#FAFAFA]"
                )}
              >
                {week.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {groups.length > 0 ? (
          groups.map((group) => (
            <section key={group.date}>
              <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-normal text-[#737373]">
                {group.date}
              </h2>

              <div className="space-y-2">
                {group.items.map((transaction) => {
                  const editHref = getEditHref(transaction);

                  return (
                    <article
                      key={transaction.id}
                      className={cn(
                        "relative rounded-[18px] px-3 py-3 shadow-sm",
                        statusFilter === "deleted" ? "bg-[#E5E5E5]" : "bg-[#FAFAFA]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-[12px]",
                            typeIconTone[transaction.type]
                          )}
                        >
                          <TransactionTypeIcon type={transaction.type} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex rounded-[9px] px-2 py-0.5 text-[11px] font-bold",
                                typeTone[transaction.type]
                              )}
                            >
                              {transaction.typeLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8A8A8A]">
                              <Clock3 size={12} strokeWidth={1.8} />
                              {transaction.time}
                            </span>
                          </div>

                          <p className="mt-1.5 truncate text-[13px] font-extrabold text-[#171717]">
                            {transaction.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] font-medium text-[#737373]">
                            {transaction.subtitle} · {transaction.actor}
                          </p>
                          {transaction.note ? (
                            <p className="mt-2 line-clamp-2 max-w-[220px] rounded-[11px] bg-[#E5E5E5] px-3 py-1.5 text-[11px] font-medium leading-4 text-[#525252]">
                              {transaction.note}
                            </p>
                          ) : null}
                          {statusFilter === "deleted" ? (
                            <p className="mt-2 text-[11px] font-semibold text-red-600">
                              Dihapus oleh {transaction.deletedBy ?? "-"} · {transaction.deletedLabel}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid w-[88px] shrink-0 justify-items-end gap-2">
                          <p
                            className={cn(
                              "w-full text-right text-[13px] font-extrabold tabular-nums",
                              transaction.amount > 0 ? "text-blue-600" : "text-[#171717]"
                            )}
                          >
                            {formatRupiah(transaction.amount)}
                          </p>
                          {statusFilter === "active" ? (
                            <div className="flex items-center gap-2">
                              {editHref ? (
                                <Link
                                  href={editHref}
                                  className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#E5E5E5]/80 text-[#737373] transition hover:bg-[#D4D4D4] hover:text-[#171717]"
                                  aria-label="Edit transaksi"
                                >
                                  <PencilLine size={16} strokeWidth={1.8} />
                                </Link>
                              ) : null}
                              <DeleteTransactionButton transactionId={transaction.id} />
                            </div>
                          ) : (
                            <RestoreTransactionButton transactionId={transaction.id} />
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-[18px] bg-[#E5E5E5] px-4 py-10 text-center shadow-sm">
            <p className="text-sm font-bold text-[#171717]">Belum ada transaksi</p>
            <p className="mt-2 text-sm text-[#737373]">
              {statusFilter === "deleted"
                ? "Transaksi yang dihapus bulan ini akan tampil di sini."
                : "Transaksi bulan ini akan tampil di sini setelah dibuat."}
            </p>
          </div>
        )}
      </div>

      <BottomNav active="history" monthKey={history.monthKey} />
    </>
  );
}
