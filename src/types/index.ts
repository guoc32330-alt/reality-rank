export type SkillId =
  "coding" | "ai" | "fitness" | "school" | "project" | "social";
export type QuestType = "Daily" | "Main" | "Boss";
export type RewardType = "Training" | "Performance" | "Milestone";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Epic";
export type Source =
  "manual" | "github" | "leetcode" | "fitness" | "system" | "futureIntegration";
export interface RankDefinition {
  name: string;
  threshold: number;
  color: string;
  maintenance: number;
}
export interface GamingProfile {
  mainGame: string;
  rank: string;
}
export interface User {
  username: string;
  createdAt: string;
  gaming: GamingProfile;
}
export interface Quest {
  id: string;
  title: string;
  description: string;
  category: SkillId;
  type: QuestType;
  difficulty: Difficulty;
  rewardType: RewardType;
  xpReward: number;
  ratingReward: number;
  masteryReward: number;
  estimatedMinutes: number;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  recurring: boolean;
  lastResetAt: string;
  source: Source;
}
export interface QuestRewardSnapshot {
  id: string;
  questId: string;
  title: string;
  category: SkillId;
  type: QuestType;
  rewardType: RewardType;
  timestamp: string;
  day: string;
  xp: number;
  rating: number;
  mastery: number;
  recovery: number;
  difficultyMultiplier: number;
  streakMultiplier: number;
  recoveryMultiplier: number;
  seasonId: string;
  undone: boolean;
  source: Source;
}
export interface ActivityLog {
  source: Source;
  id: string;
  timestamp: string;
  type: "completion" | "undo" | "decay" | "season";
  category: SkillId | null;
  description: string;
  xpChange: number;
  ratingChange: number;
  masteryChange: number;
  metadata: Record<string, string | number | boolean>;
}
export interface Skill {
  id: SkillId;
  name: string;
  currentRating: number;
  peakRating: number;
  lifetimeXP: number;
  mastery: number;
  currentRank: string;
  peakRank: string;
  lastActivityAt: string;
  currentStreak: number;
  totalActivities: number;
  weeklyXP: number;
  todayXP: number;
}
export interface SeasonGoal {
  id: string;
  title: string;
  completed: boolean;
}
export interface Season {
  id: string;
  name: string;
  startedAt: string;
  endsAt: string;
  startingRank: string;
  peakRating: number;
  goals: SeasonGoal[];
  endedAt: string | null;
  summary: {
    xp: number;
    quests: number;
    finalRank: string;
    peakRank: string;
  } | null;
}
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
}
export interface DailyStats {
  day: string;
  xp: number;
  completed: number;
  main: number;
  boss: number;
}
export interface WeeklyStats {
  xp: number;
  completed: number;
  main: number;
  boss: number;
  bySkill: Record<SkillId, number>;
}
export interface AppSettings {
  seasonWeeks: number;
  requiredMainQuests: number;
  difficulty: Record<Difficulty, number>;
  xpMultiplier: number;
  recoveryMultiplier: number;
  decay: Record<SkillId, { grace: number; rate: number }>;
  ranks: RankDefinition[];
}
export interface AppState {
  version: 1;
  revision: number;
  user: User;
  settings: AppSettings;
  quests: Quest[];
  rewards: QuestRewardSnapshot[];
  activities: ActivityLog[];
  seasons: Season[];
  peakRatings: Record<SkillId, number>;
  lastCalculatedAt: string;
}
