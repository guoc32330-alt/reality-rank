"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import Link from "next/link";
import { ArrowUpRight, Activity } from "lucide-react";
import type { Skill } from "@/types";
import { useApp } from "./AppProvider";
import { SkillIcon, Progress, format } from "./primitives";
import { rankProgress } from "@/utils/rankUtils";
import { dayDiff } from "@/utils/dateUtils";
import { selectStats } from "@/services/selectors";
export function SkillCard({
  skill,
  detail = false,
}: {
  skill: Skill;
  detail?: boolean;
}) {
  const { t, tn, locale } = useLanguage();

  const { state } = useApp(),
    progress = rankProgress(skill.currentRating, state.settings.ranks),
    days = dayDiff(new Date().toISOString(), skill.lastActivityAt),
    grace = state.settings.decay[skill.id].grace;
  return (
    <article className="skill-card">
      <div className="skill-top">
        <span className="skill-icon">
          <SkillIcon id={skill.id} />
        </span>
        <span className="skill-name">{tn(skill.name)}</span>
        <Link
          href={`/skills/#${skill.id}`}
          aria-label={t(`View ${skill.name} details`)}
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="skill-rank">
        <h3 style={{ color: progress.current.color }}>
          {tn(skill.currentRank)}
        </h3>
        <span>
          {tn(format(skill.currentRating))} <small>{t("RP")}</small>
        </span>
      </div>
      <Progress
        value={progress.percent}
        label={t(`${skill.name} rank progress`)}
      />
      <div className="skill-foot">
        <span>
          {tn(
            skill.id === "project" ? (
              <>
                <Activity size={13} />
                {tn(selectStats(state).momentum)} {t(" momentum ")}
              </>
            ) : skill.totalActivities === 0 ? (
              "Ready to begin"
            ) : days > grace ? (
              "Ready for a comeback"
            ) : (
              `Trained ${days === 0 ? "today" : `${days}d ago`}`
            ),
          )}
        </span>
        <span>
          +{tn(format(skill.weeklyXP))} {t(" XP ")}
          <small>{t("/ wk")}</small>
        </span>
      </div>
      {tn(
        detail && (
          <div className="skill-more">
            <div>
              <span>{t("Peak Rating")}</span>
              <strong>
                {tn(format(skill.peakRating))} · {tn(skill.peakRank)}
              </strong>
            </div>
            <div>
              <span>{t("Lifetime XP")}</span>
              <strong>{tn(format(skill.lifetimeXP))}</strong>
            </div>
            <div>
              <span>{t("Mastery")}</span>
              <strong>{tn(skill.mastery.toFixed(1))}%</strong>
            </div>
            <Progress
              value={skill.mastery}
              label={t(`${skill.name} mastery`)}
            />
            <div>
              <span>{t("Today / weekly XP")}</span>
              <strong>
                {tn(format(skill.todayXP))} / {tn(format(skill.weeklyXP))}
              </strong>
            </div>
            <div>
              <span>{t("Last trained")}</span>
              <strong>
                {tn(
                  skill.totalActivities
                    ? new Date(skill.lastActivityAt).toLocaleDateString(locale)
                    : "Not yet",
                )}
              </strong>
            </div>
            <p className="muted">
              {tn(
                skill.id === "project"
                  ? "Project Rating never decays. Momentum follows your last 7 days."
                  : days > grace
                    ? `Inactive · base ${(state.settings.decay[skill.id].rate * 100).toFixed(2)}% / day, adjusted for rank.`
                    : `${Math.max(0, grace - days)} days of grace remaining. Decay begins afterward.`,
              )}
            </p>
          </div>
        ),
      )}
    </article>
  );
}
