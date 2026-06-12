export type MonthContext = {
  key: string;
  label: string;
  start: Date;
  end: Date;
  previousKey: string;
  nextKey: string;
};

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function parseMonthKey(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || !/^\d{4}-\d{2}$/.test(rawValue)) {
    return new Date();
  }

  const [year, month] = rawValue.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return new Date();
  }

  return new Date(year, month - 1, 1);
}

export function getMonthContext(value?: string | string[]) {
  const selectedDate = parseMonthKey(value);
  const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
  const previousDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const nextDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);

  return {
    key: formatMonthKey(start),
    label: new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric"
    }).format(start),
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
