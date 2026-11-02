import { z } from "zod";
import type { AppState } from "@/types";
const num = z.number().finite().min(0).max(1e9);
const date = z.string().datetime({ offset: true });
const id = z.string().min(1).max(100);
const text = z.string().max(2000);
const skill = z.enum([
  "coding",
  "ai",
  "fitness",
  "school",
  "project",
  "social",
]);
const type = z.enum(["Daily", "Main", "Boss"]);
const rewardType = z.enum(["Training", "Performance", "Milestone"]);
const source = z.enum([
  "manual",
  "github",
  "leetcode",
  "fitness",
  "system",
  "futureIntegration",
]);
const skillMap = <T extends z.ZodType>(item: T) =>
  z.object({
    coding: item,
    ai: item,
    fitness: item,
    school: item,
    project: item,
    social: item,
  });
const rank = z.object({
  name: z.string().min(1).max(50),
  threshold: num,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  maintenance: z.number().min(0).max(2),
});
export const settingsSchema = z
  .object({
    seasonWeeks: z.number().int().min(1).max(52),
    requiredMainQuests: z.number().int().min(1).max(20),
    difficulty: z.object({
      Easy: z.number().min(0.1).max(5),
      Medium: z.number().min(0.1).max(5),
      Hard: z.number().min(0.1).max(5),
      Epic: z.number().min(0.1).max(5),
    }),
    xpMultiplier: z.number().min(0.1).max(5),
    recoveryMultiplier: z.number().min(1).max(3),
    decay: skillMap(
      z.object({
        grace: z.number().int().min(0).max(365),
        rate: z.number().min(0).max(0.02),
      }),
    ),
    ranks: z
      .array(rank)
      .length(17)
      .refine(
        (rs) =>
          rs[0].threshold === 0 &&
          rs.every((r, i) => i === 0 || r.threshold > rs[i - 1].threshold),
        "Rank thresholds must start at 0 and strictly increase.",
      ),
  })
  .refine((s) => s.decay.project.rate === 0, "Project must not decay.");
export const questSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(160),
    description: text,
    category: skill,
    type,
    difficulty: z.enum(["Easy", "Medium", "Hard", "Epic"]),
    rewardType,
    xpReward: z.number().int().min(0).max(10000),
    ratingReward: z.number().min(0).max(1000),
    masteryReward: z.number().min(0).max(10),
    estimatedMinutes: z.number().int().min(0).max(1440),
    completed: z.boolean(),
    completedAt: date.nullable(),
    createdAt: date,
    recurring: z.boolean(),
    lastResetAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source,
  })
  .refine(
    (q) => q.type === "Daily" || !q.recurring,
    "Only daily quests can recur.",
  );
export const stateSchema = z
  .object({
    version: z.literal(1),
    revision: z.number().int().min(0),
    user: z.object({
      username: z.string().trim().min(1).max(40),
      createdAt: date,
      gaming: z.object({
        mainGame: z.string().max(60),
        rank: z.string().max(60),
      }),
    }),
    settings: settingsSchema,
    quests: z.array(questSchema).max(10000),
    rewards: z
      .array(
        z.object({
          id,
          questId: id,
          title: text,
          category: skill,
          type,
          rewardType,
          timestamp: date,
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          xp: num,
          rating: num,
          mastery: z.number().min(0).max(100),
          recovery: num,
          difficultyMultiplier: num,
          streakMultiplier: num,
          recoveryMultiplier: num,
          seasonId: id,
          undone: z.boolean(),
          source,
        }),
      )
      .max(100000),
    activities: z
      .array(
        z.object({
          id,
          timestamp: date,
          type: z.enum(["completion", "undo", "decay", "season"]),
          category: skill.nullable(),
          description: text,
          xpChange: z.number().finite(),
          ratingChange: z.number().finite(),
          masteryChange: z.number().finite(),
          source,
          metadata: z.record(
            z.string(),
            z.union([z.string(), z.number().finite(), z.boolean()]),
          ),
        }),
      )
      .max(300000),
    seasons: z
      .array(
        z.object({
          id,
          name: z.string().min(1).max(80),
          startedAt: date,
          endsAt: date,
          startingRank: text,
          peakRating: num,
          goals: z
            .array(
              z.object({
                id,
                title: z.string().trim().min(1).max(160),
                completed: z.boolean(),
              }),
            )
            .max(3),
          endedAt: date.nullable(),
          summary: z
            .object({ xp: num, quests: num, finalRank: text, peakRank: text })
            .nullable(),
        }),
      )
      .min(1)
      .max(1000),
    peakRatings: skillMap(num),
    lastCalculatedAt: date,
  })
  .superRefine((s, ctx) => {
    for (const collection of [s.quests, s.rewards, s.activities, s.seasons])
      if (new Set(collection.map((x) => x.id)).size !== collection.length)
        ctx.addIssue({
          code: "custom",
          message: "Duplicate IDs are not allowed.",
        });
    const activeKeys = new Set<string>();
    for (const r of s.rewards) {
      if (!s.seasons.some((season) => season.id === r.seasonId))
        ctx.addIssue({
          code: "custom",
          message: "A reward references an unknown season.",
        });
      if (!r.undone) {
        const key = r.questId + (r.type === "Daily" ? r.day : "");
        if (activeKeys.has(key))
          ctx.addIssue({ code: "custom", message: "Duplicate quest rewards." });
        activeKeys.add(key);
      }
    }
    if (
      s.seasons.at(-1)?.endedAt !== null ||
      s.seasons.slice(0, -1).some((x) => !x.endedAt)
    )
      ctx.addIssue({ code: "custom", message: "Invalid season history." });
    if (
      s.activities.some(
        (a) =>
          a.type === "decay" &&
          (a.ratingChange > 0 ||
            a.xpChange !== 0 ||
            a.masteryChange !== 0 ||
            a.category === "project"),
      )
    )
      ctx.addIssue({ code: "custom", message: "Invalid decay event." });
  });
export function parseState(raw: unknown): AppState {
  return stateSchema.parse(raw) as AppState;
}
