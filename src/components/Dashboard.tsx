"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import Link from "next/link";
import {
  ArrowUpRight,
  Flame,
  Gamepad2,
  LockKeyhole,
  CheckCheck,
  Plus,
  Target,
  TrendingUp,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { selectStats } from "@/services/selectors";
import { rankProgress } from "@/utils/rankUtils";
import { levelFor } from "@/utils/xpUtils";
import { dayDiff } from "@/utils/dateUtils";
import { RankBadge, Progress, format } from "./primitives";
import { QuestCard } from "./QuestCard";
import { SkillCard } from "./SkillCard";
export function GamingUnlockCard() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    s = selectStats(state);
  return (
    <section className={`gaming-card ${s.gamingUnlocked ? "unlocked" : ""}`}>
      <div className="gaming-icon">
        <Gamepad2 size={25} />
      </div>
      <div>
        <div className="eyebrow">{t("SIDE QUEST · GAMING")}</div>
        <h3>
          {tn(s.gamingUnlocked ? "Gaming unlocked" : "Earn your downtime.")}
        </h3>
        <p>
          {tn(
            s.gamingUnlocked
              ? "Your main work is done. Enjoy your game."
              : `Complete ${state.settings.requiredMainQuests} Main Quest${state.settings.requiredMainQuests > 1 ? "s" : ""} to unlock competitive gaming.`,
          )}
        </p>
      </div>
      <span className="lock-status">
        {tn(
          s.gamingUnlocked ? (
            <CheckCheck size={14} />
          ) : (
            <LockKeyhole size={14} />
          ),
        )}
        {tn(" ")}
        {tn(s.gamingUnlocked ? "UNLOCKED" : "LOCKED")}
      </span>
    </section>
  );
}
export function ActivityList({ limit = 5 }: { limit?: number }) {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp();
  const items = [...state.activities].reverse().slice(0, limit);
  return (
    <div className="activity-list">
      {tn(
        items.length ? (
          items.map((a) => (
            <div className="activity-row" key={a.id}>
              <span className={`activity-dot ${a.type}`} />
              <div>
                <strong>{tn(a.description)}</strong>
                <small>
                  {tn(
                    new Date(a.timestamp).toLocaleString(locale, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                  )}
                  {tn(" ")}· {tn(a.type)}
                </small>
              </div>
              <span
                className={
                  a.xpChange < 0 || a.ratingChange < 0 ? "muted" : "positive"
                }
              >
                {tn(
                  a.xpChange !== 0
                    ? `${a.xpChange > 0 ? "+" : ""}${format(a.xpChange)} XP`
                    : `${a.ratingChange > 0 ? "+" : ""}${Math.round(a.ratingChange * 100) / 100} RP`,
                )}
              </span>
            </div>
          ))
        ) : (
          <div className="empty-inline">
            <Target size={25} />
            <p>{t("Your story starts with your first quest.")}</p>
            <span>{t("Meaningful effort will show up here.")}</span>
          </div>
        ),
      )}
    </div>
  );
}
export function WeeklyChart() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    stats = selectStats(state),
    max = Math.max(100, ...stats.days.map((d) => d.xp));
  return (
    <div
      className="weekly-chart"
      aria-label={t("XP earned each day this week")}
    >
      {tn(
        stats.days.map((d, i) => (
          <div className="chart-column" key={d.day}>
            <span className="bar-value">{tn(d.xp || "")}</span>
            <div className="bar-track">
              <div
                className="bar"
                style={{ height: `${Math.max(2, (d.xp / max) * 100)}%` }}
                title={t(`${d.day}: ${d.xp} XP`)}
              />
            </div>
            <span>
              {tn(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i])}
            </span>
          </div>
        )),
      )}
    </div>
  );
}
export function Dashboard() {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    s = selectStats(state),
    level = levelFor(s.xp),
    rank = rankProgress(s.rating, state.settings.ranks),
    main = state.quests
      .filter((q) => q.type === "Main" && !q.completed)
      .slice(0, 2),
    seasonWeeks = Math.ceil(dayDiff(s.season.endsAt, s.season.startedAt) / 7),
    seasonWeek = Math.min(
      seasonWeeks,
      Math.floor(dayDiff(new Date().toISOString(), s.season.startedAt) / 7) + 1,
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("YOUR PROGRESS, IN REAL LIFE")}</div>
          <h1>
            {t(" Make today count")}
            <span className="accent">.</span>
          </h1>
          <p>
            {t(" Welcome back, ")}
            {state.user.username}
            {t(". Your next rank is earned out here. ")}
          </p>
        </div>
        <Link href="/season/" className="season-pill">
          <span className="season-dot" />
          {tn(s.season.name.toUpperCase())}
          <span>
            {t(" WEEK ")}
            {tn(seasonWeek)} / {tn(seasonWeeks)}
          </span>
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="dashboard-layout">
        <section className="rank-hero">
          <div className="rank-hero-top">
            <span className="eyebrow">{t("REALITY RANK")}</span>
            <span className="subtle-pill">{t("THE MAIN GAME")}</span>
          </div>
          <div className="rank-hero-body">
            <RankBadge color={rank.current.color} />
            <div className="rank-title">
              <span className="eyebrow">{t("CURRENT RANK")}</span>
              <h2 style={{ color: rank.current.color }}>{tn(s.rank.name)}</h2>
              <p>
                <strong>{tn(format(s.rating))}</strong>
                {tn(" ")}
                <span>
                  / {tn(rank.next ? format(rank.next.threshold) : "MAX")}{" "}
                  {t(" RATING ")}
                </span>
              </p>
            </div>
          </div>
          <div className="rank-progress">
            <div>
              <span>{t("Rank progress")}</span>
              <span>
                {tn(
                  rank.next
                    ? `${format(rank.next.threshold - s.rating)} RP to ${rank.next.name}`
                    : "Highest rank reached",
                )}
              </span>
            </div>
            <Progress value={rank.percent} label={t("Reality rank progress")} />
          </div>
          <div className="rank-hero-bottom">
            <div>
              <span>{t("ACCOUNT LEVEL")}</span>
              <strong>
                {tn(level.level.toString().padStart(2, "0"))}
                <small>{t("LEVEL")}</small>
              </strong>
            </div>
            <div>
              <span>{t("LIFETIME XP")}</span>
              <strong>
                {tn(format(s.xp))}
                <small>{t("XP")}</small>
              </strong>
            </div>
            <div className="next-level">
              <span>{t("NEXT LEVEL")}</span>
              <Progress
                value={level.percent}
                label={t("Account level progress")}
              />
              <small>
                {tn(format(level.remaining))} / {tn(format(level.needed))}{" "}
                {t(" XP ")}
              </small>
            </div>
          </div>
        </section>
        <div className="today-stats">
          <section className="stat-card">
            <div className="stat-icon warm">
              <Flame size={21} />
            </div>
            <div>
              <span>{t("CURRENT STREAK")}</span>
              <strong>
                {tn(s.streak.current)}
                <small>{t("days")}</small>
              </strong>
              <p>
                {tn(
                  s.streak.current
                    ? "Keep showing up."
                    : "One Main Quest. Day one.",
                )}
              </p>
            </div>
            <span className="stat-note">
              {t("BEST ")}
              {tn(s.streak.best)}
            </span>
          </section>
          <section className="stat-card">
            <div className="stat-icon">
              <Zap size={21} />
            </div>
            <div>
              <span>{t("TODAY’S XP")}</span>
              <strong>
                {tn(format(s.today.xp))}
                <small>{t("XP")}</small>
              </strong>
              <p>{t("Effective effort. Real output.")}</p>
            </div>
            <TrendingUp size={18} className="stat-note" />
          </section>
          <section className="stat-card">
            <div className="stat-icon">
              <Target size={21} />
            </div>
            <div>
              <span>{t("MAIN QUESTS")}</span>
              <strong>
                {tn(s.today.main)}
                <small>/ {tn(state.settings.requiredMainQuests)}</small>
              </strong>
              <p>
                {tn(
                  s.gamingUnlocked
                    ? "Priority work complete."
                    : "Put your real priorities first.",
                )}
              </p>
            </div>
            <span className="mini-progress">
              {tn(
                s.gamingUnlocked ? (
                  <CheckCheck size={20} />
                ) : (
                  <LockKeyhole size={17} />
                ),
              )}
            </span>
          </section>
        </div>
        <section className="main-quests">
          <div className="section-heading">
            <div>
              <h2>
                {t(" Today’s main quest")}
                {tn(" ")}
                <span className="tiny-label">{t("YOUR PRIORITY")}</span>
              </h2>
              <p>{t("Move the needle. Start with what matters most.")}</p>
            </div>
            <Link href="/quests/">
              {t(" All quests ")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="quest-stack">
            {tn(
              main.length ? (
                main.map((q) => <QuestCard quest={q} key={q.id} />)
              ) : (
                <div className="priority-done">
                  <CheckCheck size={28} />
                  <div>
                    <h3>
                      {tn(
                        s.today.main
                          ? "Main work, done."
                          : "Set today’s priority.",
                      )}
                    </h3>
                    <p>
                      {tn(
                        s.today.main
                          ? "Make room for what comes next."
                          : "Create one meaningful Main Quest to begin.",
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new Event("add-quest"))}
                  >
                    <Plus size={16} />
                    {t(" Add quest ")}
                  </button>
                </div>
              ),
            )}
          </div>
        </section>
        <GamingUnlockCard />
      </div>
      <section className="skills-section">
        <div className="section-heading">
          <div>
            <h2>{t("Your skill ranks")}</h2>
            <p>{t("Six dimensions. One stronger you.")}</p>
          </div>
          <Link href="/skills/">
            {t(" View skills ")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="skill-grid">
          {tn(
            s.skills.map((skill) => <SkillCard key={skill.id} skill={skill} />),
          )}
        </div>
      </section>
      <div className="bottom-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>{t("Recent activity")}</h2>
            <Link href="/weekly/">
              {t(" View all ")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <ActivityList />
        </section>
        <section className="panel weekly-panel">
          <div className="section-heading">
            <h2>{t("This week")}</h2>
            <Link href="/weekly/" aria-label={t("Open weekly review")}>
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="weekly-number">
            {tn(format(s.weekly.xp))} <span>{t("XP earned")}</span>
          </div>
          <WeeklyChart />
          <div className="weekly-caption">
            <span>
              {tn(s.weekly.completed)} {t(" quests completed")}
            </span>
            <span>{t("Keep building.")}</span>
          </div>
        </section>
      </div>
    </>
  );
}
