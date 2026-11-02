export const DIFFICULTY = { Easy: 1, Medium: 1.3, Hard: 1.7, Epic: 2.5 };
export const LEVEL_BASE = 100;
export const LEVEL_GROWTH = 40;
export const STREAK_BONUSES = [
  { days: 30, bonus: 0.2 },
  { days: 14, bonus: 0.15 },
  { days: 7, bonus: 0.1 },
  { days: 3, bonus: 0.05 },
];
export const REWARDS = {
  Daily: { xp: 20, rating: 8, mastery: 0 },
  Main: { xp: 60, rating: 25, mastery: 0.5 },
  Boss: { xp: 400, rating: 120, mastery: 3 },
};
