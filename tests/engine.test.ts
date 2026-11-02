import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, makeQuest } from "../src/services/defaultState";
import {
  completeQuest,
  undoQuest,
  reconcile,
  saveQuest,
  deleteQuest,
  changeSettings,
  startSeason,
} from "../src/services/engine";
import { selectStats } from "../src/services/selectors";
import { rankFor } from "../src/utils/rankUtils";
import { levelFor, streakMultiplier } from "../src/utils/xpUtils";
import { decayFloor } from "../src/utils/decayUtils";
import { achievements } from "../src/config/achievements";
import { parseState } from "../src/storage/schema";
import { RANKS } from "../src/config/ranks";
const at = (day: number) =>
  `2026-06-${String(day).padStart(2, "0")}T16:00:00.000Z`;
function seeded() {
  const s = initialState(at(1));
  const q = makeQuest("Ship useful code", "coding", "Boss", at(1));
  q.ratingReward = 1000;
  q.xpReward = 1000;
  q.masteryReward = 5;
  s.quests.push(q);
  return { s: completeQuest(s, q.id, at(1)), id: q.id };
}
test("new account has six real zeroed skills and five example quests", () => {
  const s = initialState(at(1)),
    v = selectStats(s, at(1));
  assert.equal(s.quests.length, 5);
  assert.equal(v.skills.length, 6);
  assert.equal(v.rank.name, "Bronze III");
  assert.equal(v.xp, 0);
  assert.equal(v.gamingUnlocked, false);
  assert.doesNotThrow(() => parseState(s));
});
test("complete commits XP, rating, mastery, peak, daily/weekly stats and gaming unlock", () => {
  let s = initialState(at(1));
  const q = s.quests[0];
  s = completeQuest(s, q.id, at(1));
  const v = selectStats(s, at(1));
  assert.equal(v.xp, 60);
  assert.equal(v.skills[0].currentRating, 25);
  assert.equal(v.skills[0].mastery, 0.5);
  assert.equal(v.skills[0].peakRating, 25);
  assert.equal(v.today.main, 1);
  assert.equal(v.weekly.xp, 60);
  assert.equal(v.streak.current, 1);
  assert.equal(v.gamingUnlocked, true);
  assert.equal(s.activities.length, 1);
  assert.equal(achievements(s, at(1))[0].unlocked, true);
});
test("repeated completion never awards duplicate rewards", () => {
  const s = initialState(at(1));
  const done = completeQuest(s, s.quests[0].id, at(1));
  assert.throws(() => completeQuest(done, s.quests[0].id, at(1)), /already/);
  assert.throws(() => completeQuest(done, s.quests[0].id, at(2)), /already/);
});
test("recurring Daily resets next day, Main and Boss stay locked", () => {
  let s = initialState(at(1)),
    id = s.quests[1].id;
  s = completeQuest(s, id, at(1));
  assert.throws(() => completeQuest(s, id, at(1)));
  s = reconcile(s, at(2));
  assert.equal(s.quests[1].completed, false);
  s = completeQuest(s, id, at(2));
  assert.equal(selectStats(s, at(2)).xp, 40);
  assert.equal(s.rewards.length, 2);
});
test("undo uses exact snapshot even after multipliers change and revokes derived achievements", () => {
  let s = initialState(at(1)),
    id = s.quests[0].id;
  s = completeQuest(s, id, at(1));
  s.settings.xpMultiplier = 4;
  s.settings.difficulty.Easy = 3;
  s = undoQuest(s, id, at(1));
  const v = selectStats(s, at(1));
  assert.equal(v.xp, 0);
  assert.equal(v.skills[0].currentRating, 0);
  assert.equal(v.skills[0].mastery, 0);
  assert.equal(v.today.completed, 0);
  assert.equal(v.gamingUnlocked, false);
  assert.equal(achievements(s, at(1))[0].unlocked, false);
  assert.equal(s.activities.at(-1)!.xpChange, -60);
  assert.equal(s.peakRatings.coding, 25);
});
test("difficulty scales XP and rating, not time or mastery", () => {
  let s = initialState(at(1));
  s.quests[0].difficulty = "Hard";
  s.quests[0].estimatedMinutes = 1440;
  s = completeQuest(s, s.quests[0].id, at(1));
  assert.equal(s.rewards[0].xp, 102);
  assert.equal(s.rewards[0].rating, 42.5);
  assert.equal(s.rewards[0].mastery, 0.5);
});
test("grace period, compound offline decay and no duplicate refresh decay", () => {
  const { s } = seeded();
  assert.equal(
    selectStats(reconcile(s, at(6)), at(6)).skills[0].currentRating,
    1000,
  );
  const late = reconcile(s, at(8));
  const v = selectStats(late, at(8));
  assert.ok(
    Math.abs(
      v.skills[0].currentRating - 1000 * (1 - 0.0035) * (1 - 0.0035 * 0.8),
    ) < 0.001,
  );
  assert.equal(v.xp, 1000);
  assert.equal(v.skills[0].peakRating, 1000);
  assert.equal(late.activities.filter((a) => a.type === "decay").length, 2);
  assert.deepEqual(reconcile(late, at(8)), late);
});
test("offline batch equals daily reconciliation", () => {
  const { s } = seeded();
  const batch = reconcile(s, at(20));
  let daily = s;
  for (let i = 2; i <= 20; i++) daily = reconcile(daily, at(i));
  assert.equal(
    selectStats(batch, at(20)).skills[0].currentRating,
    selectStats(daily, at(20)).skills[0].currentRating,
  );
});
test("undo never removes or recalculates existing decay", () => {
  let { s, id } = seeded();
  s = reconcile(s, at(10));
  const losses = s.activities.filter((a) => a.type === "decay");
  s = undoQuest(s, id, at(10));
  assert.deepEqual(
    s.activities.filter((a) => a.type === "decay"),
    losses,
  );
  assert.equal(selectStats(s, at(10)).xp, 0);
  assert.equal(selectStats(s, at(10)).skills[0].currentRating, 0);
});
test("recovery increases gain only up to previous peak", () => {
  let { s } = seeded();
  s = reconcile(s, at(8));
  const before = selectStats(s, at(8)).skills[0];
  const q = makeQuest("Return to training", "coding", "Daily", at(8));
  q.ratingReward = 10;
  s = saveQuest(s, q, at(8));
  s = completeQuest(s, q.id, at(8));
  const r = s.rewards.at(-1)!;
  const gap = before.peakRating - before.currentRating;
  assert.equal(r.recoveryMultiplier, 1.25);
  assert.ok(Math.abs(r.rating - (gap + 10 - gap / 1.25)) < 0.0001);
  assert.ok(Math.abs(r.recovery - gap) < 0.0001);
  assert.ok(selectStats(s, at(8)).skills[0].currentRating > 1000);
});
test("decay stops at retained floor, higher mastery retains more", () => {
  const { s } = seeded();
  const late = reconcile(s, "2040-01-01T16:00:00.000Z");
  const skill = selectStats(late, "2040-01-01T16:00:00.000Z").skills[0];
  assert.ok(Math.abs(skill.currentRating - decayFloor(1000, 5)) < 0.01);
  assert.ok(decayFloor(1000, 80) > decayFloor(1000, 20));
  assert.equal(skill.lifetimeXP, 1000);
});
test("Project never decays; momentum depends on trailing seven days", () => {
  let s = initialState(at(1));
  for (let i = 1; i <= 5; i++) {
    const q = makeQuest(`Build ${i}`, "project", "Main", at(i));
    s = saveQuest(s, q, at(i));
    s = completeQuest(s, q.id, at(i));
  }
  assert.equal(selectStats(s, at(5)).momentum, "Locked In");
  const oldRating = selectStats(s, at(5)).skills[4].currentRating;
  s = reconcile(s, at(20));
  assert.equal(selectStats(s, at(20)).momentum, "Dormant");
  assert.equal(selectStats(s, at(20)).skills[4].currentRating, oldRating);
});
test("only Main quests count toward streak and bonuses cap at 20%", () => {
  let s = initialState(at(1));
  s = completeQuest(s, s.quests[1].id, at(1));
  assert.equal(selectStats(s, at(1)).streak.current, 0);
  for (let i = 1; i <= 3; i++) {
    const q = makeQuest(`Main ${i}`, "coding", "Main", at(i));
    s = saveQuest(s, q, at(i));
    s = completeQuest(s, q.id, at(i));
  }
  assert.equal(selectStats(s, at(3)).streak.current, 3);
  assert.equal(s.rewards.at(-1)!.streakMultiplier, 1.05);
  assert.equal(selectStats(s, at(4)).streak.current, 3);
  assert.equal(selectStats(s, at(5)).streak.current, 0);
  assert.equal(selectStats(s, at(5)).streak.best, 3);
  assert.equal(streakMultiplier(999), 1.2);
});
test("level thresholds grow and rank boundaries work", () => {
  assert.equal(levelFor(99).level, 1);
  assert.equal(levelFor(100).level, 2);
  assert.equal(levelFor(240).level, 3);
  assert.equal(rankFor(1299, RANKS).name, "Gold III");
  assert.equal(rankFor(1300, RANKS).name, "Gold II");
  assert.equal(rankFor(100000, RANKS).name, "Immortal");
});
test("delete retains rewards; editing completed category cannot bypass locks", () => {
  let s = initialState(at(1));
  const q = s.quests[0];
  s = completeQuest(s, q.id, at(1));
  assert.throws(() => saveQuest(s, { ...q, category: "ai" }, at(1)), /locked/);
  s = deleteQuest(s, q.id);
  assert.equal(selectStats(s, at(1)).xp, 60);
  assert.equal(s.quests.length, 4);
});
test("settings settle old decay first and do not retroactively alter rewards", () => {
  const { s } = seeded();
  const settings = structuredClone(s.settings);
  settings.decay.coding.rate = 0;
  settings.xpMultiplier = 2;
  const updated = changeSettings(s, settings, at(10));
  assert.ok(selectStats(updated, at(10)).skills[0].currentRating < 1000);
  assert.equal(selectStats(updated, at(10)).xp, 1000);
  assert.equal(
    selectStats(reconcile(updated, at(20)), at(20)).skills[0].currentRating,
    selectStats(updated, at(10)).skills[0].currentRating,
  );
});
test("season rollover archives immutable summary without resetting lifetime growth", () => {
  const { s } = seeded();
  assert.throws(() => startSeason(s, at(2)), /not ended/);
  const next = startSeason(s, "2026-09-01T16:00:00.000Z");
  assert.equal(next.seasons.length, 2);
  assert.equal(next.seasons[0].summary!.xp, 1000);
  assert.equal(next.seasons[1].name, "Season 2");
  assert.equal(selectStats(next, "2026-09-01T16:00:00.000Z").seasonXP, 0);
  assert.equal(selectStats(next, "2026-09-01T16:00:00.000Z").xp, 1000);
});
test("export/import roundtrip and malformed/deep invalid backups rejected", () => {
  const { s } = seeded();
  assert.deepEqual(parseState(JSON.parse(JSON.stringify(s))), s);
  for (const bad of [
    null,
    {},
    { ...s, version: 2 },
    { ...s, rewards: [{ id: "bad" }] },
    { ...s, settings: { ...s.settings, ranks: [] } },
  ])
    assert.throws(() => parseState(bad));
  const bad = structuredClone(s);
  bad.quests[0].xpReward = -1;
  assert.throws(() => parseState(bad));
});
test("clock rollback cannot double-apply decay", () => {
  const { s } = seeded();
  const late = reconcile(s, at(10));
  assert.deepEqual(reconcile(late, at(8)), late);
});
