"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "@/types";
import {
  appRepository,
  subscribeState,
  restoreBackup,
} from "@/repositories/appRepository";
import { reconcile } from "@/services/engine";
import { selectStats } from "@/services/selectors";
import { levelFor } from "@/utils/xpUtils";
import { dayKey } from "@/utils/dateUtils";
type Celebration = { title: string; detail: string };
type Context = {
  state: AppState;
  busy: boolean;
  error: string;
  dismissError: () => void;
  mutate: (fn: (s: AppState) => AppState) => Promise<boolean>;
  replace: (s: AppState) => Promise<boolean>;
  reset: () => Promise<void>;
  celebration: Celebration | null;
  closeCelebration: () => void;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const { t, tn, locale } = useLanguage();

  const [state, setState] = useState<AppState | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [celebration, setCelebration] = useState<Celebration | null>(null);
  const current = useRef<AppState | null>(null),
    locked = useRef(false);
  const adopt = useCallback((s: AppState) => {
    current.current = s;
    setState(s);
  }, []);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const initialize = async () => {
          if (!alive) return;
          const stored = await appRepository.loadState();
          if (!alive) return;
          const next = await appRepository.saveState(reconcile(stored));
          if (alive) adopt(next);
        };
        if (navigator.locks)
          await navigator.locks.request("reality-rank-write", initialize);
        else await initialize();
      } catch (e) {
        if (alive) setError(message(e));
      }
    };
    void load();
    const unsubscribe = subscribeState(() => {
      void appRepository
        .loadState()
        .then((s) => {
          if (alive) adopt(s);
        })
        .catch((e) => setError(message(e)));
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [adopt]);
  const mutate = useCallback(
    async (fn: (s: AppState) => AppState) => {
      if (locked.current || !current.current) return false;
      locked.current = true;
      setBusy(true);
      try {
        // Web Locks serializes writes across tabs where supported; revision checks are the fallback.
        const commit = async () => {
          const before = current.current!,
            next = fn(before),
            saved = await appRepository.saveState(next);
          const old = selectStats(before),
            now = selectStats(saved);
          adopt(saved);
          setError("");
          const latest = saved.rewards.at(-1),
            newReward = latest && saved.rewards.length > before.rewards.length;
          const oldLevel = levelFor(old.xp).level,
            newLevel = levelFor(now.xp).level;
          const rankChanges = now.skills.filter(
            (s) =>
              s.currentRank !==
                old.skills.find((k) => k.id === s.id)?.currentRank &&
              s.currentRating >
                (old.skills.find((k) => k.id === s.id)?.currentRating ?? 0),
          );
          if (newReward) {
            const details = [
              `+${latest.xp} XP · +${Math.round(latest.rating * 100) / 100} Rating`,
              ...rankChanges.map(
                (s) =>
                  `${s.name}: ${old.skills.find((k) => k.id === s.id)?.currentRank} → ${s.currentRank}`,
              ),
              ...(newLevel > oldLevel
                ? [`Level ${oldLevel} → ${newLevel}`]
                : []),
            ];
            if (
              latest.type === "Boss" ||
              rankChanges.length ||
              newLevel > oldLevel
            )
              setCelebration({
                title:
                  latest.type === "Boss"
                    ? "BOSS CLEARED"
                    : rankChanges.length
                      ? "RANK UP"
                      : "LEVEL UP",
                detail: details.join("\n"),
              });
          }
        };
        if (navigator.locks)
          await navigator.locks.request("reality-rank-write", commit);
        else await commit();
        return true;
      } catch (e) {
        setError(message(e));
        return false;
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [adopt],
  );
  useEffect(() => {
    const check = () => {
      if (
        current.current &&
        dayKey(current.current.lastCalculatedAt) !== dayKey()
      )
        void mutate((s) => reconcile(s));
    };
    const timer = setInterval(check, 30000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [mutate]);
  const reset = async () => {
    try {
      adopt(await appRepository.resetState());
      setError("");
    } catch (e) {
      setError(message(e));
    }
  };
  if (!state)
    return (
      <main className="boot">
        <div className="wordmark">
          REALITY<span>RANK</span>
        </div>
        {tn(
          error ? (
            <>
              <p role="alert">
                {t(
                  " Your data could not be loaded. It has not been overwritten. ",
                )}
              </p>
              <p>{tn(error)}</p>
              <button
                onClick={() =>
                  void restoreBackup()
                    .then(adopt)
                    .catch((e) => setError(message(e)))
                }
              >
                {t(" Restore last backup ")}
              </button>
              <button onClick={() => window.location.reload()}>
                {t("Retry")}
              </button>
            </>
          ) : (
            <p>{t("Loading your reality…")}</p>
          ),
        )}
      </main>
    );
  return (
    <AppContext.Provider
      value={{
        state,
        busy,
        error,
        dismissError: () => setError(""),
        mutate,
        replace: (s) =>
          mutate((old) => ({ ...reconcile(s), revision: old.revision })),
        reset,
        celebration,
        closeCelebration: () => setCelebration(null),
      }}
    >
      {tn(children)}
    </AppContext.Provider>
  );
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to save. Export your data and try again.";
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppProvider is required.");
  return value;
}
