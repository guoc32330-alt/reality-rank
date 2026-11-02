"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import { useEffect, useRef, type ReactNode } from "react";
import {
  Shield,
  ChevronUp,
  X,
  Code2,
  BrainCircuit,
  Dumbbell,
  GraduationCap,
  Rocket,
  Users,
} from "lucide-react";
import type { SkillId } from "@/types";
export const skillIcons = {
  coding: Code2,
  ai: BrainCircuit,
  fitness: Dumbbell,
  school: GraduationCap,
  project: Rocket,
  social: Users,
};
export function SkillIcon({ id, size = 20 }: { id: SkillId; size?: number }) {
  const { t, tn, locale } = useLanguage();

  const Icon = skillIcons[id];
  return <Icon size={size} />;
}
export function RankBadge({
  color = "#bf916e",
  small = false,
}: {
  color?: string;
  small?: boolean;
}) {
  const { t, tn, locale } = useLanguage();

  return (
    <div
      className={`rank-badge ${small ? "small" : ""}`}
      style={{ color }}
      aria-hidden="true"
    >
      <Shield strokeWidth={1.15} />
      <ChevronUp className="chevron first" strokeWidth={3} />
      <ChevronUp className="chevron second" strokeWidth={3} />
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  const { t, tn, locale } = useLanguage();

  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={t(label)}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { t, tn, locale } = useLanguage();

  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modal"
    >
      <div className="modal-head">
        <h2>{tn(title)}</h2>
        <button
          className="icon-button"
          aria-label={t("Close dialog")}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {tn(children)}
    </dialog>
  );
}
export const format = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
