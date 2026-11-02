"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Swords,
  ChartNoAxesCombined,
  CalendarDays,
  Trophy,
  Medal,
  UserRound,
  Settings,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { useApp } from "./AppProvider";
import { AddQuestModal } from "./AddQuestModal";
import { Modal, RankBadge } from "./primitives";
import { selectStats } from "@/services/selectors";
import { levelFor } from "@/utils/xpUtils";
const navigation = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/quests/", label: "Quests", icon: Swords },
  { path: "/skills/", label: "Skills", icon: ChartNoAxesCombined },
  { path: "/weekly/", label: "Weekly review", icon: CalendarDays },
  { path: "/season/", label: "Season", icon: Trophy },
  { path: "/achievements/", label: "Achievements", icon: Medal },
];
const mobile = [
  navigation[0],
  navigation[1],
  navigation[2],
  navigation[4],
  { path: "/profile/", label: "Profile", icon: UserRound },
];
export function Shell({ children }: { children: ReactNode }) {
  const { t, tn, locale, language, setLanguage } = useLanguage();

  const path = usePathname(),
    { state, error, dismissError, celebration, closeCelebration } = useApp(),
    [adding, setAdding] = useState(false);
  const stats = selectStats(state),
    level = levelFor(stats.xp);
  useEffect(() => {
    const open = () => setAdding(true);
    window.addEventListener("add-quest", open);
    return () => window.removeEventListener("add-quest", open);
  }, []);
  useEffect(() => {
    type Registry = {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Registry })
      .modelContext;
    if (!context) return;
    const abort = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "start_quest_creation",
            description:
              "Open the Add Quest form for the user to review and submit. Does not create or complete a quest.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute(input) {
              if (
                typeof input !== "object" ||
                input === null ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Expected an empty object.");
              setAdding(true);
              return { status: "form_opened" };
            },
          },
          { signal: abort.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => abort.abort();
  }, []);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <ShieldCheck size={28} />
          <span>
            REALITY<span className="brand-light">RANK</span>
          </span>
        </Link>
        <div className="side-label">{t("YOUR MAIN GAME")}</div>
        <nav aria-label={t("Main navigation")}>
          {tn(
            navigation.map(({ path: href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={
                  path === href || (href !== "/" && path === href.slice(0, -1))
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                <Icon size={19} />
                <span>{tn(label)}</span>
                {tn(
                  label === "Quests" && (
                    <span className="nav-count">
                      {tn(state.quests.filter((q) => !q.completed).length)}
                    </span>
                  ),
                )}
              </Link>
            )),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-manifesto">
            <span>{t("THE REAL WORLD.")}</span>
            <strong>{t("YOUR MAIN RANK.")}</strong>
            <p>{t("Progress that stays with you.")}</p>
            <ArrowUpRight size={20} />
          </div>
          <Link href="/settings/" className="nav-link">
            <Settings size={19} />
            {t(" Settings ")}
          </Link>
          <Link href="/profile/" className="side-profile">
            <span className="avatar">
              {tn(state.user.username.slice(0, 1).toUpperCase())}
            </span>
            <span>
              <strong>{state.user.username}</strong>
              <small>
                {t(" Level ")}
                {tn(level.level)} · {tn(stats.rank.name)}
              </small>
            </span>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            {t(" Workspace ")}
            <span>/</span>
            {tn(" ")}
            <strong>
              {tn(
                navigation.find(
                  (n) => n.path === path || n.path.slice(0, -1) === path,
                )?.label ??
                  (path.includes("settings") ? "Settings" : "Profile"),
              )}
            </strong>
          </span>
          <div className="top-actions">
            <button
              className="language-toggle"
              aria-label={
                language === "zh-CN" ? "Switch to English" : "切换到中文"
              }
              onClick={() =>
                setLanguage(language === "zh-CN" ? "en-US" : "zh-CN")
              }
            >
              <span className={language === "zh-CN" ? "selected-language" : ""}>
                中文
              </span>
              <span aria-hidden="true">/</span>
              <span className={language === "en-US" ? "selected-language" : ""}>
                EN
              </span>
            </button>
            <span className="local-status">
              <span /> {t(" Saved on this device ")}
            </span>
            <button className="primary compact" onClick={() => setAdding(true)}>
              <Plus size={17} />
              {t(" Add quest ")}
            </button>
            <Link
              href="/profile/"
              className="avatar small-avatar"
              aria-label={t("Open profile")}
            >
              {tn(state.user.username.slice(0, 1).toUpperCase())}
            </Link>
          </div>
        </header>
        <main className="main-content">
          {tn(
            error && (
              <div role="alert" className="error-banner">
                <span>{tn(error)}</span>
                <button aria-label={t("Dismiss error")} onClick={dismissError}>
                  <X size={18} />
                </button>
              </div>
            ),
          )}
          {tn(children)}
        </main>
        <footer className="footer">
          <span>{t("REALITY IS THE MAIN GAME.")}</span>
          <span>{t("Every meaningful effort counts.")}</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label={t("Mobile navigation")}>
        {tn(
          mobile.map(({ path: href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={
                path === href || path === href.slice(0, -1) ? "active" : ""
              }
            >
              <Icon size={21} />
              <span>{tn(label === "Overview" ? "Home" : label)}</span>
            </Link>
          )),
        )}
      </nav>
      <button
        className="floating-add"
        aria-label={t("Add quest")}
        onClick={() => setAdding(true)}
      >
        <Plus />
      </button>
      {tn(adding && <AddQuestModal onClose={() => setAdding(false)} />)}
      {tn(" ")}
      {tn(
        celebration && (
          <Modal title={t(celebration.title)} onClose={closeCelebration}>
            <div className="celebration">
              <RankBadge />
              <h3>
                {tn(
                  celebration.title === "BOSS CLEARED"
                    ? "Real work. Real achievement."
                    : "You earned this.",
                )}
              </h3>
              <p>{tn(celebration.detail)}</p>
              <button className="primary" onClick={closeCelebration}>
                {t(" Keep moving forward ")}
              </button>
            </div>
          </Modal>
        ),
      )}
    </div>
  );
}
