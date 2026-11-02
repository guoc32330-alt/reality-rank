import type { AppState, DailyStats, Skill, WeeklyStats } from "@/types";
import { SKILLS } from "@/config/skills";
import { dayKey, shiftDay, weekStart } from "@/utils/dateUtils";
import { rankFor } from "@/utils/rankUtils";
import { streaks } from "@/utils/streakUtils";
import { momentum } from "@/utils/momentumUtils";
export const activeRewards = (state: AppState) =>
  state.rewards.filter((r) => !r.undone);
export function selectStats(state: AppState, now = new Date().toISOString()) {
  const rewards = activeRewards(state),
    today = dayKey(now),
    start = weekStart(now);
  const skills: Skill[] = SKILLS.map((def) => {
    const records = rewards.filter((r) => r.category === def.id);
    const sum = (key: "xp" | "rating" | "mastery") =>
      records.reduce((total, r) => total + r[key], 0);
    const loss = state.activities
      .filter((a) => a.type === "decay" && a.category === def.id)
      .reduce((total, a) => total + a.ratingChange, 0);
    const rating = Math.max(0, sum("rating") + loss),
      peak = state.peakRatings[def.id];
    return {
      ...def,
      currentRating: rating,
      peakRating: peak,
      lifetimeXP: sum("xp"),
      mastery: Math.min(100, Math.max(0, sum("mastery"))),
      currentRank: rankFor(rating, state.settings.ranks).name,
      peakRank: rankFor(peak, state.settings.ranks).name,
      lastActivityAt: records.at(-1)?.timestamp ?? state.user.createdAt,
      currentStreak: streaks(
        records.map((r) => r.day),
        today,
      ).current,
      totalActivities: records.length,
      weeklyXP: records
        .filter((r) => r.day >= start && r.day <= today)
        .reduce((s, r) => s + r.xp, 0),
      todayXP: records
        .filter((r) => r.day === today)
        .reduce((s, r) => s + r.xp, 0),
    };
  });
  const days: DailyStats[] = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(start, i),
      records = rewards.filter((r) => r.day === day);
    return {
      day,
      xp: records.reduce((s, r) => s + r.xp, 0),
      completed: records.length,
      main: records.filter((r) => r.type === "Main").length,
      boss: records.filter((r) => r.type === "Boss").length,
    };
  });
  const weekly: WeeklyStats = {
    xp: days.reduce((s, d) => s + d.xp, 0),
    completed: days.reduce((s, d) => s + d.completed, 0),
    main: days.reduce((s, d) => s + d.main, 0),
    boss: days.reduce((s, d) => s + d.boss, 0),
    bySkill: Object.fromEntries(
      skills.map((s) => [s.id, s.weeklyXP]),
    ) as WeeklyStats["bySkill"],
  };
  const todayStats = days.find((d) => d.day === today)!;
  const streak = streaks(
    rewards.filter((r) => r.type === "Main").map((r) => r.day),
    today,
  );
  const rating =
    skills.reduce((s, k) => s + k.currentRating, 0) / skills.length;
  const season = state.seasons.at(-1)!;
  const projectCount = rewards.filter(
    (r) =>
      r.category === "project" &&
      r.day >= shiftDay(today, -6) &&
      r.day <= today,
  ).length;
  return {
    skills,
    rewards,
    today: todayStats,
    weekly,
    days,
    streak,
    rating,
    rank: rankFor(rating, state.settings.ranks),
    xp: rewards.reduce((s, r) => s + r.xp, 0),
    gamingUnlocked: todayStats.main >= state.settings.requiredMainQuests,
    momentum: momentum(projectCount),
    projectCount,
    season,
    seasonXP: rewards
      .filter((r) => r.seasonId === season.id)
      .reduce((s, r) => s + r.xp, 0),
  };
}
