import { shiftDay } from "./dateUtils";
export function streaks(days: string[], today: string) {
  const unique = [...new Set(days)].sort();
  const set = new Set(unique);
  let cursor = set.has(today) ? today : shiftDay(today, -1),
    current = 0,
    best = 0,
    run = 0,
    previous = "";
  while (set.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  for (const day of unique) {
    run = previous === shiftDay(day, -1) ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return { current, best, totalDays: unique.length };
}
