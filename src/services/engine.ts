import type {
  AppState,
  Quest,
  QuestRewardSnapshot,
  AppSettings,
  ActivityLog,
} from "@/types";
import { selectStats } from "./selectors";
import {
  dayKey,
  dayDiff,
  ordinal,
  shiftDay,
  addWeeks,
} from "@/utils/dateUtils";
import { streaks } from "@/utils/streakUtils";
import { streakMultiplier } from "@/utils/xpUtils";
import { rankFor } from "@/utils/rankUtils";
import { decayFloor } from "@/utils/decayUtils";
const round = (n: number) => Math.round(n * 10000) / 10000;
function log(
  state: AppState,
  event: Omit<ActivityLog, "id" | "source"> & {
    source?: ActivityLog["source"];
  },
) {
  state.activities.push({
    id: crypto.randomUUID(),
    source: "system",
    ...event,
  });
}
function updatePeaks(state: AppState, now: string) {
  const stats = selectStats(state, now);
  for (const skill of stats.skills)
    state.peakRatings[skill.id] = Math.max(
      state.peakRatings[skill.id],
      skill.currentRating,
    );
  const season = state.seasons.at(-1)!;
  if (!season.endedAt)
    season.peakRating = Math.max(season.peakRating, stats.rating);
}
// Pure transformations: React and a future API can use the same tested rules.
export function reconcile(
  input: AppState,
  now = new Date().toISOString(),
): AppState {
  const state = structuredClone(input),
    today = dayKey(now),
    last = dayKey(state.lastCalculatedAt);
  if (new Date(now) < new Date(state.lastCalculatedAt)) return state; // Clock moved backwards: never apply negative/repeated decay.
  if (today !== last) {
    const stats = selectStats(state, now);
    for (const skill of stats.skills) {
      if (skill.id === "project") continue;
      const rule = state.settings.decay[skill.id];
      let rating = skill.currentRating;
      // Replay each missed calendar day; maintenance can change after a rank drops.
      const first = Math.max(
        ordinal(last) + 1,
        ordinal(dayKey(skill.lastActivityAt)) + rule.grace + 1,
      );
      for (let day = first; day <= ordinal(today); day++) {
        const floor = Math.min(
          rating,
          decayFloor(skill.peakRating, skill.mastery),
        );
        const loss = round(
          Math.min(
            rating - floor,
            rating *
              rule.rate *
              rankFor(rating, state.settings.ranks).maintenance,
          ),
        );
        if (loss <= 0) break;
        rating = round(rating - loss);
        log(state, {
          timestamp: new Date(day * 86400000 + 12 * 3600000).toISOString(),
          type: "decay",
          category: skill.id,
          description: `${skill.name} · inactivity adjustment`,
          xpChange: 0,
          ratingChange: -loss,
          masteryChange: 0,
          metadata: { day: shiftDay("1970-01-01", day) },
        });
      }
    }
    for (const quest of state.quests)
      if (quest.recurring && quest.lastResetAt !== today) {
        quest.completed = false;
        quest.completedAt = null;
        quest.lastResetAt = today;
      }
  }
  state.lastCalculatedAt = now;
  return state;
}
export function completeQuest(
  input: AppState,
  id: string,
  now = new Date().toISOString(),
): AppState {
  const state = reconcile(input, now),
    quest = state.quests.find((q) => q.id === id);
  if (!quest) throw new Error("Quest not found.");
  const today = dayKey(now);
  const duplicate = state.rewards.some(
    (r) =>
      !r.undone && r.questId === id && (!quest.recurring || r.day === today),
  );
  if (quest.completed || duplicate)
    throw new Error("This quest has already been completed.");
  const stats = selectStats(state, now),
    skill = stats.skills.find((s) => s.id === quest.category)!;
  const difficulty = state.settings.difficulty[quest.difficulty];
  const mainDays = stats.rewards
    .filter((r) => r.type === "Main")
    .map((r) => r.day);
  if (quest.type === "Main") mainDays.push(today);
  const streak = streakMultiplier(streaks(mainDays, today).current);
  const baseRating = quest.ratingReward * difficulty;
  const gap = Math.max(0, skill.peakRating - skill.currentRating);
  const recoveryMultiplier = gap > 0 ? state.settings.recoveryMultiplier : 1;
  // Apply recovery only to the portion below the old peak, never beyond it.
  const rating =
    gap > 0
      ? Math.min(baseRating * recoveryMultiplier, gap) +
        Math.max(0, baseRating - gap / recoveryMultiplier)
      : baseRating;
  const snapshot: QuestRewardSnapshot = {
    id: crypto.randomUUID(),
    questId: id,
    title: quest.title,
    category: quest.category,
    type: quest.type,
    rewardType: quest.rewardType,
    timestamp: now,
    day: today,
    xp: Math.round(
      quest.xpReward * difficulty * streak * state.settings.xpMultiplier,
    ),
    rating: round(rating),
    mastery: round(Math.min(100 - skill.mastery, quest.masteryReward)),
    recovery: round(Math.min(gap, rating)),
    difficultyMultiplier: difficulty,
    streakMultiplier: streak,
    recoveryMultiplier,
    seasonId: stats.season.id,
    undone: false,
    source: quest.source,
  };
  state.rewards.push(snapshot);
  quest.completed = true;
  quest.completedAt = now;
  log(state, {
    timestamp: now,
    type: "completion",
    category: quest.category,
    description: quest.title,
    xpChange: snapshot.xp,
    ratingChange: snapshot.rating,
    masteryChange: snapshot.mastery,
    source: snapshot.source,
    metadata: { rewardId: snapshot.id, questId: id, type: quest.type },
  });
  updatePeaks(state, now);
  return state;
}
export function undoQuest(
  input: AppState,
  id: string,
  now = new Date().toISOString(),
): AppState {
  const state = reconcile(input, now);
  const reward = [...state.rewards]
    .reverse()
    .find((r) => r.questId === id && !r.undone);
  if (!reward) throw new Error("No completion to undo.");
  reward.undone = true;
  const quest = state.quests.find((q) => q.id === id);
  if (quest) {
    quest.completed = false;
    quest.completedAt = null;
  }
  // Subtract the saved reward. Decay events remain untouched, even after settings change.
  log(state, {
    timestamp: now,
    type: "undo",
    category: reward.category,
    description: `Undid ${reward.title}`,
    xpChange: -reward.xp,
    ratingChange: -reward.rating,
    masteryChange: -reward.mastery,
    source: reward.source,
    metadata: { rewardId: reward.id, questId: id },
  });
  return state;
}
export function saveQuest(
  input: AppState,
  quest: Quest,
  now = new Date().toISOString(),
): AppState {
  const state = reconcile(input, now),
    index = state.quests.findIndex((q) => q.id === quest.id);
  const existing = state.quests[index];
  if (
    existing &&
    state.rewards.some((r) => r.questId === quest.id && !r.undone) &&
    (existing.category !== quest.category ||
      existing.type !== quest.type ||
      existing.recurring !== quest.recurring)
  )
    throw new Error(
      "After completion, category and quest type are locked. Create a new quest instead.",
    );
  if (index < 0) state.quests.push(quest);
  else
    state.quests[index] = {
      ...quest,
      completed: existing.completed,
      completedAt: existing.completedAt,
      lastResetAt: existing.lastResetAt,
    };
  return state;
}
export function deleteQuest(input: AppState, id: string): AppState {
  const state = structuredClone(input);
  state.quests = state.quests.filter((q) => q.id !== id);
  return state;
}
export function changeSettings(
  input: AppState,
  settings: AppSettings,
  now = new Date().toISOString(),
): AppState {
  const state = reconcile(input, now);
  state.settings = structuredClone(settings);
  return state;
}
export function startSeason(
  input: AppState,
  now = new Date().toISOString(),
): AppState {
  const state = reconcile(input, now),
    stats = selectStats(state, now),
    season = state.seasons.at(-1)!;
  if (new Date(now) < new Date(season.endsAt))
    throw new Error("Your current season has not ended yet.");
  season.endedAt = now;
  season.summary = {
    xp: stats.seasonXP,
    quests: stats.rewards.filter((r) => r.seasonId === season.id).length,
    finalRank: stats.rank.name,
    peakRank: rankFor(season.peakRating, state.settings.ranks).name,
  };
  state.seasons.push({
    id: crypto.randomUUID(),
    name: `Season ${state.seasons.length + 1}`,
    startedAt: now,
    endsAt: addWeeks(now, state.settings.seasonWeeks),
    startingRank: stats.rank.name,
    peakRating: stats.rating,
    goals: [],
    endedAt: null,
    summary: null,
  });
  log(state, {
    timestamp: now,
    type: "season",
    category: null,
    description: `Started Season ${state.seasons.length}`,
    xpChange: 0,
    ratingChange: 0,
    masteryChange: 0,
    metadata: { previousSeason: season.id },
  });
  return state;
}
