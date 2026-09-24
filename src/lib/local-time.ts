// Local-day helpers shared by server actions and UI. All keys are YYYY-MM-DD
// in a fixed zone; UTC here means "server default" — profile timezone is
// threaded through per-call by callers that have it (see TODOs in actions).

import { CORRECTION_WINDOW_DAYS } from "@/lib/engine";

/** Local day key for an instant, in the given IANA zone (default UTC). */
export function localDayKey(date: Date, timezone = "UTC"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    calendar: "iso8601",
  }).format(date);
}

/** Day key N whole days away (calendar-day arithmetic on the UTC anchor). */
export function addLocalDays(
  date: Date,
  days: number,
  timezone = "UTC",
): string {
  // Shift to the zone's "now", add days, normalize back through the zone so
  // DST offsets cannot pull the key across an unintended boundary.
  const shifted = new Date(date.getTime() + days * 86_400_000);
  return localDayKey(shifted, timezone);
}

/** Editable day keys: today + the previous CORRECTION_WINDOW_DAYS closed days. */
export function correctionWindowDates(now: Date, timezone = "UTC"): string[] {
  const dates: string[] = [localDayKey(now, timezone)];
  for (let i = 1; i <= CORRECTION_WINDOW_DAYS; i++) {
    dates.push(addLocalDays(now, -i, timezone));
  }
  return dates; // [today, yesterday, day-before] — caller may sort()
}
