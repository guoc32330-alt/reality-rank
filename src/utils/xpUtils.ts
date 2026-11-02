import { LEVEL_BASE, LEVEL_GROWTH, STREAK_BONUSES } from "@/config/xp";
export function levelFor(xp: number) {
  let level = 1,
    remaining = xp,
    needed = LEVEL_BASE;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = LEVEL_BASE + (level - 1) * LEVEL_GROWTH;
  }
  return { level, remaining, needed, percent: (remaining / needed) * 100 };
}
export function streakMultiplier(streak: number) {
  return 1 + (STREAK_BONUSES.find((x) => streak >= x.days)?.bonus ?? 0);
}
