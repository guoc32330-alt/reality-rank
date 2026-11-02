"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import { useRef, useState, type FormEvent } from "react";
import { Download, Upload, RotateCcw, Save, Check } from "lucide-react";
import type { AppState } from "@/types";
import { useApp } from "./AppProvider";
import { PageHeading } from "./Pages";
import { Modal } from "./primitives";
import { settingsSchema } from "@/storage/schema";
import { appRepository } from "@/repositories/appRepository";
import { changeSettings } from "@/services/engine";
import { SKILLS } from "@/config/skills";
export function SettingsPage() {
  const { t, tn, locale, language, setLanguage } = useLanguage();

  const { state, mutate, replace, reset, busy } = useApp(),
    [settings, setSettings] = useState(() => structuredClone(state.settings)),
    [user, setUser] = useState(() => structuredClone(state.user)),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [resetStep, setResetStep] = useState(0),
    [confirmation, setConfirmation] = useState(""),
    [pending, setPending] = useState<AppState | null>(null);
  const file = useRef<HTMLInputElement>(null);
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = settingsSchema.safeParse(settings);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (
      await mutate((s) => ({
        ...changeSettings(s, parsed.data),
        user: {
          ...s.user,
          username: user.username.trim(),
          gaming: user.gaming,
        },
      }))
    )
      setNotice(
        "Settings saved. New reward rules apply to future completions. Season length applies to the next season.",
      );
  }
  function download() {
    const blob = new Blob([appRepository.exportState(state)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `reality-rank-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Backup exported. Keep a copy somewhere safe.");
  }
  return (
    <>
      <PageHeading
        eyebrow={t("MAKE THE SYSTEM YOURS")}
        title={t("Settings")}
        description={t(
          "Simple rules. Transparent rewards. Your data stays yours.",
        )}
      />
      {tn(
        notice && (
          <div role="status" className="success-banner">
            <Check size={17} />
            {tn(notice)}
          </div>
        ),
      )}
      {tn(
        error && (
          <p role="alert" className="error-banner">
            {tn(error)}
          </p>
        ),
      )}
      <form onSubmit={save}>
        <section className="panel settings-panel">
          <h2>{t("Profile & preferences")}</h2>
          <div className="form-grid">
            <label>
              {language === "zh-CN"
                ? "界面语言（立即保存）"
                : "Interface language (saved immediately)"}
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "zh-CN" | "en-US")
                }
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </label>
            <label>
              {t(" Username ")}
              <input
                required
                maxLength={40}
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />
            </label>
            <label>
              {t(" Season length (weeks) ")}
              <input
                required
                type="number"
                min={1}
                max={52}
                value={settings.seasonWeeks}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seasonWeeks: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              {t(" Main Quests to unlock gaming ")}
              <input
                required
                type="number"
                min={1}
                max={20}
                value={settings.requiredMainQuests}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    requiredMainQuests: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              {t(" Main game ")}
              <select
                value={user.gaming.mainGame}
                onChange={(e) =>
                  setUser({
                    ...user,
                    gaming: { ...user.gaming, mainGame: e.target.value },
                  })
                }
              >
                {tn(
                  [
                    "Delta Force",
                    "Valorant",
                    "CS2",
                    "Rainbow Six Siege",
                    "Apex",
                    "PUBG",
                    "COD",
                    "Other",
                  ].map((g) => (
                    <option key={g} value={g}>
                      {tn(g)}
                    </option>
                  )),
                )}
              </select>
            </label>
            <label>
              {t(" Gaming rank ")}
              <input
                maxLength={60}
                value={user.gaming.rank}
                onChange={(e) =>
                  setUser({
                    ...user,
                    gaming: { ...user.gaming, rank: e.target.value },
                  })
                }
              />
            </label>
          </div>
        </section>
        <section className="panel settings-panel">
          <h2>{t("Reward multipliers")}</h2>
          <p className="muted">
            {t(
              " Difficulty scales XP and Rating. Recovery only boosts Rating below your peak. Streak XP bonuses are capped at 20%. ",
            )}
          </p>
          <div className="form-grid three">
            {tn(
              (["Easy", "Medium", "Hard", "Epic"] as const).map((d) => (
                <label key={d}>
                  {tn(d)} {t(" multiplier ")}
                  <input
                    required
                    type="number"
                    min={0.1}
                    max={5}
                    step={0.05}
                    value={settings.difficulty[d]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        difficulty: {
                          ...settings.difficulty,
                          [d]: Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              )),
            )}
            <label>
              {t(" XP multiplier ")}
              <input
                required
                type="number"
                min={0.1}
                max={5}
                step={0.05}
                value={settings.xpMultiplier}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    xpMultiplier: Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              {t(" Recovery multiplier ")}
              <input
                required
                type="number"
                min={1}
                max={3}
                step={0.05}
                value={settings.recoveryMultiplier}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    recoveryMultiplier: Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
        </section>
        <section className="panel settings-panel">
          <h2>{t("Skill maintenance")}</h2>
          <p className="muted">
            {t(
              " A gentle adjustment after your grace period. Current rank adjusts the base rate. Project never decays. ",
            )}
          </p>
          <div className="decay-table">
            {tn(
              SKILLS.filter((s) => s.id !== "project").map((s) => (
                <div className="decay-row" key={s.id}>
                  <strong>{tn(s.name)}</strong>
                  <label>
                    {t(" Grace days ")}
                    <input
                      required
                      type="number"
                      min={0}
                      max={365}
                      value={settings.decay[s.id].grace}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          decay: {
                            ...settings.decay,
                            [s.id]: {
                              ...settings.decay[s.id],
                              grace: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    {t(" Daily decay % ")}
                    <input
                      required
                      type="number"
                      min={0}
                      max={2}
                      step={0.01}
                      value={Number(
                        (settings.decay[s.id].rate * 100).toFixed(4),
                      )}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          decay: {
                            ...settings.decay,
                            [s.id]: {
                              ...settings.decay[s.id],
                              rate: Number(e.target.value) / 100,
                            },
                          },
                        })
                      }
                    />
                  </label>
                </div>
              )),
            )}
          </div>
        </section>
        <details className="panel settings-panel">
          <summary>
            {t(" Rank thresholds ")}
            <span className="muted">{t("17 ranks · advanced")}</span>
          </summary>
          <p className="muted">
            {t(
              " The first threshold must be 0. Every next threshold must be higher. Reality Rating is the average of all six skills. ",
            )}
          </p>
          <div className="form-grid three">
            {tn(
              settings.ranks.map((r, i) => (
                <label key={r.name}>
                  {tn(r.name)}
                  <input
                    required
                    type="number"
                    min={0}
                    max={1000000000}
                    value={r.threshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ranks: settings.ranks.map((x, j) =>
                          j === i
                            ? { ...x, threshold: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
              )),
            )}
          </div>
        </details>
        <div className="save-row">
          <button className="primary" type="submit" disabled={busy}>
            <Save size={17} />
            {t(" Save settings ")}
          </button>
        </div>
      </form>
      <section className="panel settings-panel">
        <h2>{t("Your data")}</h2>
        <p className="muted">
          {t(
            " Saved in this browser, on this device. Export regularly: clearing browser data removes local progress. Import replaces current data after your confirmation. No cloud sync is enabled. ",
          )}
        </p>
        <div className="data-actions">
          <button onClick={download}>
            <Download size={17} />
            {t(" Export data ")}
          </button>
          <button onClick={() => file.current?.click()}>
            <Upload size={17} />
            {t(" Import backup ")}
          </button>
          <button className="danger-text" onClick={() => setResetStep(1)}>
            <RotateCcw size={17} />
            {t(" Reset all data ")}
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden-input"
          aria-label={t("Import backup file")}
          onChange={async (e) => {
            const selected = e.target.files?.[0];
            if (!selected) return;
            try {
              if (selected.size > 20_000_000)
                throw new Error("Backup must be smaller than 20 MB.");
              setPending(appRepository.importState(await selected.text()));
              setError("");
            } catch {
              setError(
                "This file is not a valid Reality Rank v1 backup. Current data has not changed.",
              );
            }
            e.target.value = "";
          }}
        />
      </section>
      {tn(
        pending && (
          <Modal
            title={t("Replace data with this backup?")}
            onClose={() => setPending(null)}
          >
            <p>
              {t(" This backup belongs to ")}
              {pending.user.username} {t(" and contains")}
              {tn(" ")}
              {tn(pending.quests.length)} {t(" quests and")}
              {tn(" ")}
              {tn(pending.rewards.filter((r) => !r.undone).length)}{" "}
              {t(
                " completions. Export current data first if you want to keep it. ",
              )}
            </p>
            <div className="modal-actions">
              <button onClick={download}>{t("Export current data")}</button>
              <button
                className="primary"
                onClick={async () => {
                  if (await replace(pending)) {
                    setSettings(pending.settings);
                    setUser(pending.user);
                    setPending(null);
                    setNotice("Backup imported.");
                  }
                }}
              >
                {t(" Replace data ")}
              </button>
            </div>
          </Modal>
        ),
      )}
      {tn(
        resetStep > 0 && (
          <Modal
            title={t(
              resetStep === 1 ? "Reset all progress?" : "Final confirmation",
            )}
            onClose={() => {
              setResetStep(0);
              setConfirmation("");
            }}
          >
            {tn(
              resetStep === 1 ? (
                <>
                  <p>
                    {t(
                      " This clears your quests, rewards, skills and season history, and restores the example quests. Export a backup before continuing. ",
                    )}
                  </p>
                  <div className="modal-actions">
                    <button onClick={download}>{t("Export first")}</button>
                    <button className="danger" onClick={() => setResetStep(2)}>
                      {t(" Continue to confirmation ")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    {t(" Type RESET to start over ")}
                    <input
                      autoFocus
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder={t("RESET")}
                    />
                  </label>
                  <div className="modal-actions">
                    <button onClick={() => setResetStep(0)}>
                      {t("Cancel")}
                    </button>
                    <button
                      className="danger"
                      disabled={confirmation !== "RESET"}
                      onClick={async () => {
                        await reset();
                        setResetStep(0);
                        setConfirmation("");
                        window.location.reload();
                      }}
                    >
                      {t(" Reset everything ")}
                    </button>
                  </div>
                </>
              ),
            )}
          </Modal>
        ),
      )}
    </>
  );
}
