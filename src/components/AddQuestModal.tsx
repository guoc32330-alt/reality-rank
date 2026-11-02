"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import { useState, type FormEvent } from "react";
import type { Quest } from "@/types";
import { SKILLS } from "@/config/skills";
import { REWARDS } from "@/config/xp";
import { makeQuest } from "@/services/defaultState";
import { saveQuest } from "@/services/engine";
import { questSchema } from "@/storage/schema";
import { useApp } from "./AppProvider";
import { Modal } from "./primitives";
export function AddQuestModal({
  onClose,
  quest,
}: {
  onClose: () => void;
  quest?: Quest;
}) {
  const { t, tn, locale } = useLanguage();

  const { mutate, busy, state } = useApp(),
    [draft, setDraft] = useState<Quest>(
      () => quest ?? makeQuest("", "coding", "Main", new Date().toISOString()),
    ),
    [error, setError] = useState("");
  const locked =
    !!quest && state.rewards.some((r) => r.questId === quest.id && !r.undone);
  const update = <K extends keyof Quest>(key: K, value: Quest[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = questSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (await mutate((s) => saveQuest(s, parsed.data))) onClose();
  };
  const changeType = (type: Quest["type"]) => {
    const r = REWARDS[type];
    setDraft((d) => ({
      ...d,
      type,
      recurring: type === "Daily",
      rewardType:
        type === "Boss"
          ? "Milestone"
          : type === "Main"
            ? "Performance"
            : "Training",
      xpReward: r.xp,
      ratingReward: r.rating,
      masteryReward: r.mastery,
    }));
  };
  return (
    <Modal
      title={t(quest ? "Edit quest" : "Create your next move")}
      onClose={onClose}
    >
      <form onSubmit={submit} className="quest-form">
        <p className="muted">
          {t("Define meaningful work. Reward the output.")}
        </p>
        <label>
          {t(" Quest name ")}
          <input
            autoFocus
            required
            maxLength={160}
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder={t("Build something that matters")}
          />
        </label>
        <label>
          {t(" Description ")}
          <textarea
            rows={2}
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={2000}
            placeholder={t("What does done look like?")}
          />
        </label>
        <div className="form-grid">
          <label>
            {t(" Category ")}
            <select
              value={draft.category}
              disabled={locked}
              onChange={(e) =>
                update("category", e.target.value as Quest["category"])
              }
            >
              {tn(
                SKILLS.map((s) => (
                  <option value={s.id} key={s.id}>
                    {tn(s.name)}
                  </option>
                )),
              )}
            </select>
          </label>
          <label>
            {t(" Quest type ")}
            <select
              value={draft.type}
              disabled={locked}
              onChange={(e) => changeType(e.target.value as Quest["type"])}
            >
              {tn(
                ["Daily", "Main", "Boss"].map((t) => (
                  <option key={t} value={t}>
                    {tn(t)}
                  </option>
                )),
              )}
            </select>
          </label>
          <label>
            {t(" Activity type ")}
            <select
              value={draft.rewardType}
              onChange={(e) => {
                const v = e.target.value as Quest["rewardType"];
                setDraft((d) => ({
                  ...d,
                  rewardType: v,
                  masteryReward:
                    v === "Training" ? 0 : v === "Performance" ? 0.5 : 3,
                }));
              }}
            >
              {tn(
                ["Training", "Performance", "Milestone"].map((t) => (
                  <option key={t} value={t}>
                    {tn(t)}
                  </option>
                )),
              )}
            </select>
          </label>
          <label>
            {t(" Difficulty ")}
            <select
              value={draft.difficulty}
              onChange={(e) =>
                update("difficulty", e.target.value as Quest["difficulty"])
              }
            >
              {tn(
                ["Easy", "Medium", "Hard", "Epic"].map((t) => (
                  <option key={t} value={t}>
                    {tn(t)}
                  </option>
                )),
              )}
            </select>
          </label>
        </div>
        <div className="form-grid three">
          {tn(
            (
              [
                { key: "xpReward", label: "Base XP", max: 10000, step: 1 },
                {
                  key: "ratingReward",
                  label: "Base Rating",
                  max: 1000,
                  step: 0.1,
                },
                {
                  key: "masteryReward",
                  label: "Mastery %",
                  max: 10,
                  step: 0.1,
                },
              ] as const
            ).map((f) => (
              <label key={f.key}>
                {tn(f.label)}
                <input
                  type="number"
                  min={0}
                  max={f.max}
                  step={f.step}
                  required
                  value={draft[f.key]}
                  onChange={(e) => update(f.key, Number(e.target.value))}
                />
              </label>
            )),
          )}
        </div>
        <div className="form-grid">
          <label>
            {t(" Estimated minutes ")}
            <input
              type="number"
              min={0}
              max={1440}
              value={draft.estimatedMinutes}
              onChange={(e) =>
                update("estimatedMinutes", Number(e.target.value))
              }
            />
          </label>
          {tn(
            draft.type === "Daily" && (
              <label className="check-label">
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={draft.recurring}
                  onChange={(e) => update("recurring", e.target.checked)}
                />
                {t(" Repeat each day ")}
              </label>
            ),
          )}
        </div>
        <div className="form-note">
          {t(" Difficulty ×")}
          {tn(state.settings.difficulty[draft.difficulty])}{" "}
          {t(
            " applies to XP and Rating. Streak adds XP; recovery adds Rating. Mastery reflects output. Time never determines XP. ",
          )}
        </div>
        {tn(
          locked && (
            <p className="muted">
              {t(
                " Category and type are locked because this quest has recorded rewards. ",
              )}
            </p>
          ),
        )}
        {tn(
          error && (
            <p role="alert" className="error-text">
              {tn(error)}
            </p>
          ),
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            {t(" Cancel ")}
          </button>
          <button className="primary" disabled={busy} type="submit">
            {tn(quest ? "Save changes" : "Create quest")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
