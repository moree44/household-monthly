import {
  formatAppDateInputValue,
  formatAppMonthLabel,
  getAppDateParts,
  parseAppDateInput
} from "@/lib/date/timezone";

export type MonthContext = {
  key: string;
  label: string;
  start: Date;
  end: Date;
  previousKey: string;
  nextKey: string;
};

function formatMonthKey(date: Date) {
  const { year, month } = getAppDateParts(date);

  return `${year}-${String(month).padStart(2, "0")}`;
}

function getMonthStart(year: number, month: number) {
  const normalizedDate = new Date(Date.UTC(year, month - 1, 1));
  const normalizedYear = normalizedDate.getUTCFullYear();
  const normalizedMonth = String(normalizedDate.getUTCMonth() + 1).padStart(2, "0");

  return parseAppDateInput(`${normalizedYear}-${normalizedMonth}-01`);
}

function parseMonthKey(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || !/^\d{4}-\d{2}$/.test(rawValue)) {
    return parseAppDateInput(`${formatAppDateInputValue(new Date()).slice(0, 7)}-01`);
  }

  const [year, month] = rawValue.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return parseAppDateInput(`${formatAppDateInputValue(new Date()).slice(0, 7)}-01`);
  }

  return getMonthStart(year, month);
}

export function getMonthContext(value?: string | string[]) {
  const selectedDate = parseMonthKey(value) ?? parseAppDateInput(`${formatAppDateInputValue(new Date()).slice(0, 7)}-01`);

  if (!selectedDate) {
    throw new Error("Failed to create month context.");
  }

  const { year, month } = getAppDateParts(selectedDate);
  const start = selectedDate;
  const end = getMonthStart(year, month + 1);
  const previousDate = getMonthStart(year, month - 1);
  const nextDate = end;

  if (!end || !previousDate || !nextDate) {
    throw new Error("Failed to create month boundaries.");
  }

  return {
    key: formatMonthKey(start),
    label: formatAppMonthLabel(start),
    start,
    end,
    previousKey: formatMonthKey(previousDate),
    nextKey: formatMonthKey(nextDate)
  } satisfies MonthContext;
}

export function withMonthParam(path: string, monthKey: string, params?: Record<string, string>) {
  const searchParams = new URLSearchParams({
    month: monthKey,
    ...params
  });

  return `${path}?${searchParams.toString()}`;
}
