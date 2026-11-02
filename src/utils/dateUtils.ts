// Calendar-day arithmetic avoids 23/25-hour daylight-saving days.
export function dayKey(value: string | Date = new Date()): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function ordinal(day: string): number {
  return Date.parse(`${day}T00:00:00Z`) / 86400000;
}
export function dayDiff(a: string, b: string): number {
  return Math.round(ordinal(dayKey(a)) - ordinal(dayKey(b)));
}
export function shiftDay(day: string, offset: number): string {
  return new Date((ordinal(day) + offset) * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function weekStart(now: string): string {
  const d = new Date(now);
  return shiftDay(dayKey(now), -((d.getDay() + 6) % 7));
}
export function addWeeks(now: string, weeks: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString();
}
