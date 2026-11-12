/** Date helpers. Dates are plain "YYYY-MM-DD" strings in the owner's timezone (Africa/Lagos). */

export const APP_TIMEZONE = "Africa/Lagos";

/** Today's date in Lagos, whatever timezone the server runs in. */
export function lagosToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = toUtc(date);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(date: string): number {
  return toUtc(date).getUTCDay();
}

/** The Monday of the week that contains `date`. */
export function weekStart(date: string): string {
  const day = weekday(date);
  return addDays(date, day === 0 ? -6 : 1 - day);
}

export function weekDates(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(toUtc(date));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(toUtc(date));
}

export function formatLong(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtc(date));
}

/** Default LinkedIn posting days: Tuesday, Wednesday, Thursday. */
export const DEFAULT_POSTING_DAYS = [2, 3, 4];

/**
 * The next posting day, from today onwards, that has no post yet.
 * Looks up to eight weeks ahead, then falls back to today.
 */
export function nextPostingDate(
  today: string,
  takenDates: readonly string[],
  postingDays: readonly number[] = DEFAULT_POSTING_DAYS,
): string {
  const taken = new Set(takenDates);
  for (let i = 0; i < 56; i++) {
    const candidate = addDays(today, i);
    if (postingDays.includes(weekday(candidate)) && !taken.has(candidate)) return candidate;
  }
  return today;
}

/** The same weekday in the following week. */
export function sameDayNextWeek(date: string): string {
  return addDays(date, 7);
}
