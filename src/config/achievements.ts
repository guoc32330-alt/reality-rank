import type { Achievement, AppState } from "@/types";
import { selectStats } from "@/services/selectors";
export function achievements(state: AppState, now?: string): Achievement[] {
  const s = selectStats(state, now);
  const defs: [string, string, string, number, number][] = [
    ["first", "First Blood", "Complete your first quest", s.rewards.length, 1],
    [
      "locked",
      "Locked In",
      "Build a 7-day Main Quest streak",
      s.streak.best,
      7,
    ],
    [
      "builder",
      "Builder",
      "Complete 10 Coding quests",
      s.rewards.filter((r) => r.category === "coding").length,
      10,
    ],
    [
      "ship",
      "Ship It",
      "Complete your first Boss Quest",
      s.rewards.filter((r) => r.type === "Boss").length,
      1,
    ],
    ["club", "1000 Club", "Earn 1,000 Lifetime XP", s.xp, 1000],
    [
      "gold",
      "Gold Mindset",
      "Reach Gold Reality Rank",
      s.rating,
      state.settings.ranks[6].threshold,
    ],
    [
      "diamond",
      "Diamond Life",
      "Reach Diamond Reality Rank",
      s.rating,
      state.settings.ranks[12].threshold,
    ],
    [
      "comeback",
      "Comeback",
      "Recover 500 Rating lost to decay",
      s.rewards.reduce((sum, r) => sum + r.recovery, 0),
      500,
    ],
    [
      "consistency",
      "Consistency",
      "Complete Main Quests on 30 distinct days",
      s.streak.totalDays,
      30,
    ],
  ];
  return defs.map(([id, name, description, progress, target]) => ({
    id,
    name,
    description,
    progress,
    target,
    unlocked: progress >= target,
  }));
}
