import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getHistoryData,
  parseHistoryStatusFilter,
  parseHistoryTypeFilter,
  parseHistoryWeekFilter
} from "@/features/history/data";
import { HistoryClient } from "@/features/history/components/history-client";
import { requireUser } from "@/lib/auth/session";
import { getMonthContext, withMonthParam } from "@/lib/date/month";

type HistoryPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    type?: string | string[];
    month?: string | string[];
    week?: string | string[];
  }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  await requireUser();

  const resolvedSearchParams = await searchParams;
  const typeFilter = parseHistoryTypeFilter(resolvedSearchParams.type);
  const statusFilter = parseHistoryStatusFilter(resolvedSearchParams.status);
  const weekFilter = parseHistoryWeekFilter(resolvedSearchParams.week);
  const month = getMonthContext(resolvedSearchParams.month);
  const history = await getHistoryData(typeFilter, statusFilter, weekFilter, month);

  return (
    <main className="min-h-screen bg-[#262626] px-0 py-0 text-[#171717] sm:px-4 sm:py-6">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#F5F5F5] px-3 pb-6 pt-5 shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-[30px] sm:px-4 lg:max-w-4xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#737373]">history</p>
            <h1 className="text-lg font-bold text-[#0A0A0A]">History</h1>
            <p className="mt-1 text-sm text-[#737373]">{history.monthLabel}</p>
          </div>
          <Link
            href={withMonthParam("/dashboard", history.monthKey)}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#262626] shadow-sm transition hover:bg-[#FAFAFA]"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={19} strokeWidth={1.8} />
          </Link>
        </header>

        <HistoryClient history={history} />
      </div>
    </main>
  );
}
