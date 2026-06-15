export const APP_TIME_ZONE = "Asia/Jakarta";

const APP_TIME_ZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getOffsetDate(date: Date) {
  return new Date(date.getTime() + APP_TIME_ZONE_OFFSET_MS);
}

function parseDateInputParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function parseAppDateInput(value: string) {
  const parts = parseDateInputParts(value);

  if (!parts) {
    return null;
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - APP_TIME_ZONE_OFFSET_MS);
}

export function formatAppDateInputValue(date: Date) {
  const offsetDate = getOffsetDate(date);
  const year = offsetDate.getUTCFullYear();
  const month = pad2(offsetDate.getUTCMonth() + 1);
  const day = pad2(offsetDate.getUTCDate());

  return `${year}-${month}-${day}`;
}

export function getAppDateParts(date: Date) {
  const offsetDate = getOffsetDate(date);

  return {
    year: offsetDate.getUTCFullYear(),
    month: offsetDate.getUTCMonth() + 1,
    day: offsetDate.getUTCDate()
  };
}

export function formatAppDateLong(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE
  }).format(date);
}

export function formatAppMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE
  }).format(date);
}

export function formatAppMonthShort(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: APP_TIME_ZONE
  }).format(date);
}

export function formatAppTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE
  }).format(date);
}
