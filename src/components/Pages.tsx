"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpRight,
  Medal,
  Check,
  Trash2,
  Flag,
  Flame,
  Trophy,
  Target,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { selectStats } from "@/services/selectors";
import { achievements } from "@/config/achievements";
import { dayDiff } from "@/utils/dateUtils";
import { rankFor } from "@/utils/rankUtils";
import { levelFor } from "@/utils/xpUtils";
import { startSeason } from "@/services/engine";
import { decayFloor } from "@/utils/decayUtils";
import { SkillCard } from "./SkillCard";
import { QuestCard } from "./QuestCard";
import { ActivityList, WeeklyChart } from "./Dashboard";
import { RankBadge, Progress, format, Modal, SkillIcon } from "./primitives";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const { t, tn, locale } = useLanguage();

  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{tn(eyebrow)}</div>
        <h1>
          {tn(title)}
          <span className="accent">.</span>
        </h1>
        <p>{tn(description)}</p>
      </div>
      {tn(children)}
    </div>
  );
}
export function QuestsPage() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    [filter, setFilter] = useState("All"),
    [query, setQuery] = useState("");
  const quests = state.quests.filter(
    (q) =>
      (filter === "All" ||
        (filter === "Completed" && q.completed) ||
        (q.type === filter && !q.completed)) &&
      q.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={t("TURN INTENT INTO ACTION")}
        title={t("Your quest board")}
        description={t(
          "Train with purpose. Perform under pressure. Ship the milestone.",
        )}
      >
        <button
          className="primary"
          onClick={() => window.dispatchEvent(new Event("add-quest"))}
        >
          <Plus size={17} />
          {t(" Add quest ")}
        </button>
      </PageHeading>
      <div className="filter-bar">
        <div className="tabs" role="tablist" aria-label={t("Quest filters")}>
          {tn(
            ["All", "Main", "Daily", "Boss", "Completed"].map((f) => (
              <button
                role="tab"
                aria-selected={filter === f}
                className={f === filter ? "selected" : ""}
                key={f}
                onClick={() => setFilter(f)}
              >
                {tn(f)}
              </button>
            )),
          )}
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label={t("Search quests")}
            placeholder={t("Search quests")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="quest-stack">
        {tn(quests.map((q) => <QuestCard quest={q} key={q.id} />))}
        {tn(
          quests.length === 0 && (
            <div className="empty panel">
              <Target />
              <h2>{t("No quests here yet")}</h2>
              <p>{t("Try a different filter or create your next quest.")}</p>
            </div>
          ),
        )}
      </div>
      <div className="explain-grid">
        <div>
          <strong>{t("Training")}</strong>
          <p>{t("Build foundations. Earn XP and modest Rating.")}</p>
        </div>
        <div>
          <strong>{t("Performance")}</strong>
          <p>{t("Apply what you know. Grow your current ability.")}</p>
        </div>
        <div>
          <strong>{t("Milestone")}</strong>
          <p>{t("Prove what you own. Earn lasting Mastery.")}</p>
        </div>
      </div>
    </>
  );
}
export function SkillsPage() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    s = selectStats(state);
  return (
    <>
      <PageHeading
        eyebrow={t("CURRENT ABILITY. LASTING MASTERY.")}
        title={t("Your skill profile")}
        description={t(
          "Rating is where you are. Peak is where you’ve been. Mastery is what stays.",
        )}
      />
      <div className="skill-detail-grid">
        {tn(
          s.skills.map((skill) => (
            <section id={skill.id} key={skill.id}>
              <SkillCard skill={skill} detail />
              <div className="skill-history">
                <span>{t("RETAINED RATING FLOOR")}</span>
                <strong>
                  {tn(format(decayFloor(skill.peakRating, skill.mastery)))}{" "}
                  {t(" RP ")}
                </strong>
                <p>
                  {t("Peak × (25% + 50% × mastery). Lifetime XP never decays.")}
                </p>
                <h4>{t("Rating timeline")}</h4>
                {tn(
                  state.activities
                    .filter(
                      (a) => a.category === skill.id && a.ratingChange !== 0,
                    )
                    .slice(-5)
                    .reverse()
                    .map((a) => (
                      <div className="timeline-line" key={a.id}>
                        <span>
                          {tn(new Date(a.timestamp).toLocaleDateString(locale))}{" "}
                          · {tn(a.type)}
                        </span>
                        <strong>
                          {tn(a.ratingChange > 0 ? "+" : "")}
                          {tn(a.ratingChange.toFixed(2))} {t(" RP ")}
                        </strong>
                      </div>
                    )),
                )}
                {tn(
                  !state.activities.some((a) => a.category === skill.id) && (
                    <p>{t("Complete a quest to start your timeline.")}</p>
                  ),
                )}
              </div>
            </section>
          )),
        )}
      </div>
    </>
  );
}
export function WeeklyPage() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    s = selectStats(state),
    sorted = [...s.skills].sort((a, b) => b.weeklyXP - a.weeklyXP);
  return (
    <>
      <PageHeading
        eyebrow={t("REFLECT. ADJUST. GO AGAIN.")}
        title={t("Weekly review")}
        description={t("A clear look at the work behind your rank.")}
      />
      <div className="metrics-grid">
        {tn(
          [
            ["THIS WEEK’S XP", format(s.weekly.xp)],
            ["QUESTS COMPLETED", s.weekly.completed],
            ["MAIN / BOSS", `${s.weekly.main} / ${s.weekly.boss}`],
            ["CURRENT STREAK", `${s.streak.current} days`],
          ].map(([label, value]) => (
            <div className="panel metric" key={label}>
              <span>{tn(label)}</span>
              <strong>{tn(value)}</strong>
            </div>
          )),
        )}
      </div>
      <div className="bottom-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>{t("Consistency over intensity")}</h2>
            <span className="muted">{t("Mon — Sun")}</span>
          </div>
          <WeeklyChart />
        </section>
        <section className="panel">
          <h2>{t("Where your effort went")}</h2>
          <div className="skill-bars">
            {tn(
              s.skills.map((skill) => (
                <div key={skill.id}>
                  <span>
                    <SkillIcon id={skill.id} size={16} />
                    {tn(skill.name)}
                    <strong>
                      {tn(format(skill.weeklyXP))} {t(" XP")}
                    </strong>
                  </span>
                  <Progress
                    value={
                      s.weekly.xp ? (skill.weeklyXP / s.weekly.xp) * 100 : 0
                    }
                    label={t(`${skill.name} weekly XP`)}
                  />
                </div>
              )),
            )}
          </div>
        </section>
      </div>
      <div className="review-grid">
        <section className="panel">
          <span className="eyebrow">{t("STRONGEST AREA")}</span>
          <h2>{tn(s.weekly.xp ? sorted[0].name : "A fresh start")}</h2>
          <p>
            {tn(
              s.weekly.xp
                ? `${sorted[0].name} leads with ${format(sorted[0].weeklyXP)} XP this week. Keep turning effort into output.`
                : "Your first completed quest will give this review something to reflect on.",
            )}
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">{t("NEEDS ATTENTION")}</span>
          <h2>
            {tn(s.weekly.xp ? sorted.at(-1)!.name : "Choose one priority")}
          </h2>
          <p>
            {tn(
              s.weekly.xp
                ? `Make space for a small ${sorted.at(-1)!.name} quest next week.`
                : "A single meaningful Main Quest is a good place to start.",
            )}
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">{t("REALITY RANK")}</span>
          <h2 style={{ color: s.rank.color }}>{tn(s.rank.name)}</h2>
          <p>
            {tn(format(s.rating))} {t(" Rating · ")}
            {tn(s.streak.current)} {t(" day streak ")}
          </p>
          <Link className="text-link" href="/skills/">
            {t(" Review your skills ")}
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>{t("Activity history")}</h2>
          <span className="muted">{t("Most recent 100 events")}</span>
        </div>
        <ActivityList limit={100} />
      </section>
    </>
  );
}
export function SeasonPage() {
  const { t, tn, locale } = useLanguage();

  const { state, mutate } = useApp(),
    s = selectStats(state),
    [goal, setGoal] = useState(""),
    [confirm, setConfirm] = useState(false);
  const season = s.season,
    total = Math.max(1, dayDiff(season.endsAt, season.startedAt)),
    elapsed = dayDiff(new Date().toISOString(), season.startedAt),
    ended = new Date() >= new Date(season.endsAt);
  return (
    <>
      <PageHeading
        eyebrow={t("PLAY THE LONG GAME")}
        title={t(season.name)}
        description={t("A focused chapter. Your growth carries forward.")}
      />
      <section className="season-hero panel">
        <div>
          <span className="eyebrow">
            {tn(ended ? "SEASON COMPLETE" : "SEASON IN PROGRESS")}
          </span>
          <h2>
            {t(" Week ")}
            {tn(Math.min(Math.floor(elapsed / 7) + 1, Math.ceil(total / 7)))}
            {tn(" ")}
            <span>/ {tn(Math.ceil(total / 7))}</span>
          </h2>
          <p>
            {tn(new Date(season.startedAt).toLocaleDateString(locale))} —
            {tn(" ")}
            {tn(new Date(season.endsAt).toLocaleDateString(locale))}
          </p>
          <Progress
            value={Math.min(100, (elapsed / total) * 100)}
            label={t("Season time progress")}
          />
        </div>
        <Trophy size={78} strokeWidth={1} />
        <div>
          <span className="eyebrow">{t("SEASON XP")}</span>
          <h2>{tn(format(s.seasonXP))}</h2>
          <p>
            {tn(Math.max(0, total - elapsed))} {t(" days remaining")}
          </p>
        </div>
      </section>
      <div className="review-grid">
        {tn(
          [
            ["STARTING RANK", season.startingRank],
            ["CURRENT RANK", s.rank.name],
            [
              "SEASON PEAK",
              rankFor(season.peakRating, state.settings.ranks).name,
            ],
          ].map(([label, value]) => (
            <div className="panel metric" key={label}>
              <span>{tn(label)}</span>
              <h2>{tn(value)}</h2>
            </div>
          )),
        )}
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>{t("Season goals")}</h2>
          <span className="muted">
            {tn(season.goals.length)} {t(" / 3 goals")}
          </span>
        </div>
        {tn(
          season.goals.map((g) => (
            <div className="goal-row" key={g.id}>
              <button
                aria-label={t(`Toggle ${g.title}`)}
                className={`quest-check ${g.completed ? "checked" : ""}`}
                onClick={() =>
                  void mutate((st) => {
                    const copy = structuredClone(st);
                    const target = copy.seasons
                      .at(-1)!
                      .goals.find((x) => x.id === g.id)!;
                    target.completed = !target.completed;
                    return copy;
                  })
                }
              >
                {tn(g.completed && <Check size={18} />)}
              </button>
              <span className={g.completed ? "struck" : ""}>{g.title}</span>
              <button
                className="icon-button"
                aria-label={t(`Delete goal ${g.title}`)}
                onClick={() =>
                  void mutate((st) => {
                    const copy = structuredClone(st);
                    copy.seasons.at(-1)!.goals = copy.seasons
                      .at(-1)!
                      .goals.filter((x) => x.id !== g.id);
                    return copy;
                  })
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          )),
        )}
        {tn(
          season.goals.length < 3 && (
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!goal.trim()) return;
                if (
                  await mutate((st) => {
                    const copy = structuredClone(st);
                    if (copy.seasons.at(-1)!.goals.length >= 3)
                      throw new Error("Maximum 3 goals.");
                    copy.seasons.at(-1)!.goals.push({
                      id: crypto.randomUUID(),
                      title: goal.trim(),
                      completed: false,
                    });
                    return copy;
                  })
                )
                  setGoal("");
              }}
            >
              <input
                aria-label={t("New season goal")}
                placeholder={t("What will you achieve this season?")}
                maxLength={160}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                required
              />
              <button type="submit">
                <Plus size={16} />
                {t(" Add goal ")}
              </button>
            </form>
          ),
        )}
        <div className="section-note">
          <Flag size={17} />
          <span>
            {t(
              " Choose outcomes worth working toward, not numbers worth chasing. ",
            )}
          </span>
        </div>
      </section>
      <div className="season-end">
        <p>
          {tn(
            ended
              ? "Archive this chapter and set your next direction."
              : "Your next season becomes available when this one ends.",
          )}
          {tn(" ")}
          {t(" XP, skills and peaks carry forward. ")}
        </p>
        <button
          className="primary"
          disabled={!ended}
          onClick={() => setConfirm(true)}
        >
          {t(" Start new season ")}
        </button>
      </div>
      <section className="panel">
        <h2>{t("Season history")}</h2>
        {tn(
          state.seasons
            .filter((x) => x.endedAt)
            .map((x) => (
              <div className="history-row" key={x.id}>
                <strong>{tn(x.name)}</strong>
                <span>
                  {tn(format(x.summary?.xp ?? 0))} {t(" XP")}
                </span>
                <span>{tn(x.summary?.finalRank)}</span>
                <span>
                  {t("Peak: ")}
                  {tn(x.summary?.peakRank)}
                </span>
              </div>
            )),
        )}
        {tn(
          state.seasons.length === 1 && (
            <p className="muted">
              {t(" Your completed seasons will be preserved here. ")}
            </p>
          ),
        )}
      </section>
      {tn(
        confirm && (
          <Modal
            title={t("Begin a new season?")}
            onClose={() => setConfirm(false)}
          >
            <p>
              {t(
                " This season’s goals, results and peak rank will be archived permanently. ",
              )}
            </p>
            <div className="modal-actions">
              <button onClick={() => setConfirm(false)}>{t("Cancel")}</button>
              <button
                className="primary"
                onClick={async () => {
                  if (await mutate((st) => startSeason(st))) setConfirm(false);
                }}
              >
                {t(" Archive & start ")}
              </button>
            </div>
          </Modal>
        ),
      )}
    </>
  );
}
export function AchievementsPage() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    all = achievements(state);
  return (
    <>
      <PageHeading
        eyebrow={t("PROOF OF PROGRESS")}
        title={t("Your achievements")}
        description={t(
          `${all.filter((a) => a.unlocked).length} of ${all.length} earned. Milestones with meaning.`,
        )}
      />
      <div className="achievement-grid">
        {tn(
          all.map((a) => (
            <article
              className={`panel achievement ${a.unlocked ? "earned" : ""}`}
              key={a.id}
            >
              <div className="achievement-icon">
                <Medal size={34} strokeWidth={1.25} />
              </div>
              <span className="tiny-label">
                {tn(a.unlocked ? "UNLOCKED" : "LOCKED")}
              </span>
              <h2>{tn(a.name)}</h2>
              <p>{tn(a.description)}</p>
              <Progress
                value={Math.min(100, (a.progress / a.target) * 100)}
                label={t(`${a.name} progress`)}
              />
              <small>
                {tn(format(Math.min(a.progress, a.target)))} /{" "}
                {tn(format(a.target))}
              </small>
            </article>
          )),
        )}
      </div>
    </>
  );
}
export function ProfilePage() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    s = selectStats(state),
    all = achievements(state),
    level = levelFor(s.xp);
  return (
    <>
      <PageHeading
        eyebrow={t("YOUR REALITY, RANKED")}
        title={state.user.username}
        description={t("Build an identity backed by real work.")}
      >
        <Link href="/settings/" className="button">
          {t(" Edit profile ")}
          <ArrowUpRight size={16} />
        </Link>
      </PageHeading>
      <section className="panel profile-hero">
        <RankBadge color={s.rank.color} />
        <div>
          <span className="eyebrow">{t("REALITY RANK")}</span>
          <h2 style={{ color: s.rank.color }}>{tn(s.rank.name)}</h2>
          <p>
            {t(" Level ")}
            {tn(level.level)} · {tn(format(s.xp))} {t(" Lifetime XP · ")}
            {tn(s.season.name)}
          </p>
        </div>
      </section>
      <div className="metrics-grid">
        {tn(
          [
            ["CURRENT / BEST STREAK", `${s.streak.current} / ${s.streak.best}`],
            ["QUESTS COMPLETED", s.rewards.length],
            [
              "BOSSES CLEARED",
              s.rewards.filter((r) => r.type === "Boss").length,
            ],
            [
              "ACHIEVEMENTS",
              `${all.filter((a) => a.unlocked).length} / ${all.length}`,
            ],
          ].map(([label, value]) => (
            <div className="panel metric" key={label}>
              <span>{tn(label)}</span>
              <strong>{tn(value)}</strong>
            </div>
          )),
        )}
      </div>
      <section className="panel">
        <h2>{t("Current skills & personal bests")}</h2>
        <div className="profile-skills">
          {tn(
            s.skills.map((skill) => (
              <div key={skill.id}>
                <SkillIcon id={skill.id} />
                <strong>{tn(skill.name)}</strong>
                <span>{tn(skill.currentRank)}</span>
                <span>
                  {t(" Peak: ")}
                  {tn(skill.peakRank)} · {tn(format(skill.peakRating))}{" "}
                  {t(" RP ")}
                </span>
              </div>
            )),
          )}
        </div>
      </section>
      <section className="panel gaming-profile">
        <div>
          <span className="eyebrow">{t("SIDE RANK · GAMING PROFILE")}</span>
          <h2>{tn(state.user.gaming.mainGame || "Choose your game")}</h2>
          <p>
            {tn(state.user.gaming.rank || "Unranked")}{" "}
            {t(" · manually tracked")}
          </p>
        </div>
        <Link href="/settings/" className="text-link">
          {t(" Edit gaming profile ")}
          <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="mobile-links">
        <Link href="/weekly/">{t("Weekly review")}</Link>
        <Link href="/achievements/">{t("Achievements")}</Link>
        <Link href="/settings/">{t("Settings")}</Link>
      </div>
    </>
  );
}
