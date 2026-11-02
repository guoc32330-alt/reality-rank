import type { AppState, Quest, SkillId } from "@/types";
import { RANKS } from "@/config/ranks";
import { DIFFICULTY, REWARDS } from "@/config/xp";
import { DECAY } from "@/config/decay";
import { RECOVERY_MULTIPLIER } from "@/config/recovery";
import { addWeeks, dayKey } from "@/utils/dateUtils";
export function makeQuest(
  title: string,
  category: SkillId,
  type: Quest["type"],
  now: string,
): Quest {
  const reward = REWARDS[type];
  return {
    id: crypto.randomUUID(),
    title,
    category,
    type,
    description: "",
    difficulty: "Easy",
    rewardType:
      type === "Boss"
        ? "Milestone"
        : type === "Main"
          ? "Performance"
          : "Training",
    xpReward: reward.xp,
    ratingReward: reward.rating,
    masteryReward: reward.mastery,
    estimatedMinutes: 30,
    completed: false,
    completedAt: null,
    createdAt: now,
    recurring: type === "Daily",
    lastResetAt: dayKey(now),
    source: "manual",
  };
}
export function initialState(now = new Date().toISOString()): AppState {
  return {
    version: 1,
    revision: 0,
    user: {
      username: "Hendrix",
      createdAt: now,
      gaming: { mainGame: "Delta Force", rank: "Unranked" },
    },
    settings: {
      seasonWeeks: 12,
      requiredMainQuests: 1,
      difficulty: { ...DIFFICULTY },
      xpMultiplier: 1,
      recoveryMultiplier: RECOVERY_MULTIPLIER,
      decay: structuredClone(DECAY),
      ranks: structuredClone(RANKS),
    },
    quests: [
      makeQuest("Code for 60 minutes", "coding", "Main", now),
      makeQuest("Finish math homework", "school", "Daily", now),
      makeQuest("Workout", "fitness", "Daily", now),
      makeQuest("Learn one AI concept", "ai", "Daily", now),
      makeQuest("Build one feature", "project", "Main", now),
    ],
    rewards: [],
    activities: [],
    seasons: [
      {
        id: crypto.randomUUID(),
        name: "Season 1",
        startedAt: now,
        endsAt: addWeeks(now, 12),
        startingRank: "Bronze III",
        peakRating: 0,
        goals: [],
        endedAt: null,
        summary: null,
      },
    ],
    peakRatings: {
      coding: 0,
      ai: 0,
      fitness: 0,
      school: 0,
      project: 0,
      social: 0,
    },
    lastCalculatedAt: now,
  };
}
