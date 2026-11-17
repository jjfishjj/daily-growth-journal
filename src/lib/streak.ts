import { addDays, format, parseISO } from "date-fns";

/** Consecutive days with an entry, ending today (or yesterday if today not yet filled). */
export function calcStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let d = parseISO(today);
  if (!set.has(today)) d = addDays(d, -1);
  let n = 0;
  while (set.has(format(d, "yyyy-MM-dd"))) { n++; d = addDays(d, -1); }
  return n;
}
