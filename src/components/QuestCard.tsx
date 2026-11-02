"use client";
import { useLanguage } from "@/i18n/LanguageProvider";

import { useState } from "react";
import {
  Check,
  Clock3,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
import type { Quest } from "@/types";
import { useApp } from "./AppProvider";
import { completeQuest, undoQuest, deleteQuest } from "@/services/engine";
import { AddQuestModal } from "./AddQuestModal";
import { Modal, SkillIcon } from "./primitives";
export function QuestCard({ quest }: { quest: Quest }) {
  const { t, tn, locale } = useLanguage();

  const { mutate, busy, state } = useApp(),
    [edit, setEdit] = useState(false),
    [remove, setRemove] = useState(false),
    [menu, setMenu] = useState(false);
  return (
    <>
      <article className={`quest-card ${quest.completed ? "completed" : ""}`}>
        <button
          className="quest-check"
          disabled={busy}
          aria-label={t(
            quest.completed ? `Undo ${quest.title}` : `Complete ${quest.title}`,
          )}
          onClick={() =>
            void mutate((s) =>
              quest.completed
                ? undoQuest(s, quest.id)
                : completeQuest(s, quest.id),
            )
          }
        >
          {tn(quest.completed && <Check size={18} />)}
        </button>
        <div className="quest-content">
          <div className="quest-meta">
            <span className={`tag ${quest.type.toLowerCase()}`}>
              {tn(quest.type.toUpperCase())} {t(" QUEST ")}
            </span>
            <span>
              <SkillIcon id={quest.category} size={13} />
              {tn(quest.category)}
            </span>
          </div>
          <h3>{quest.title}</h3>
          {tn(quest.description && <p>{quest.description}</p>)}
          <div className="quest-detail">
            <span>
              <Clock3 size={13} />
              {tn(quest.estimatedMinutes)} {t(" min ")}
            </span>
            <span>{tn(quest.rewardType)}</span>
            <span>{tn(quest.difficulty)}</span>
          </div>
        </div>
        <div className="quest-reward">
          <strong>
            +
            {tn(
              Math.round(
                quest.xpReward *
                  state.settings.difficulty[quest.difficulty] *
                  state.settings.xpMultiplier,
              ),
            )}
            {tn(" ")}
            <span>{t("XP")}</span>
          </strong>
          <small>{t("base reward")}</small>
        </div>
        <div className="quest-menu">
          <button
            className="icon-button"
            aria-label={t(`Options for ${quest.title}`)}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <MoreHorizontal size={19} />
          </button>
          {tn(
            menu && (
              <div className="dropdown">
                <button
                  onClick={() => {
                    setEdit(true);
                    setMenu(false);
                  }}
                >
                  <Pencil size={15} />
                  {t(" Edit quest ")}
                </button>
                {tn(
                  quest.completed && (
                    <button
                      onClick={() => {
                        void mutate((s) => undoQuest(s, quest.id));
                        setMenu(false);
                      }}
                    >
                      <Undo2 size={15} />
                      {t(" Undo completion ")}
                    </button>
                  ),
                )}
                <button
                  className="danger-text"
                  onClick={() => {
                    setRemove(true);
                    setMenu(false);
                  }}
                >
                  <Trash2 size={15} />
                  {t(" Delete quest ")}
                </button>
              </div>
            ),
          )}
        </div>
      </article>
      {tn(
        edit && <AddQuestModal quest={quest} onClose={() => setEdit(false)} />,
      )}
      {tn(" ")}
      {tn(
        remove && (
          <Modal
            title={t("Delete this quest?")}
            onClose={() => setRemove(false)}
          >
            <p>
              “{quest.title}
              {t(
                "” will be removed from your quest list. Existing rewards and activity history are kept. Undo its completion first if you want to reverse its rewards. ",
              )}
            </p>
            <div className="modal-actions">
              <button onClick={() => setRemove(false)}>
                {t("Keep quest")}
              </button>
              <button
                className="danger"
                onClick={async () => {
                  if (await mutate((s) => deleteQuest(s, quest.id)))
                    setRemove(false);
                }}
              >
                {t(" Delete quest ")}
              </button>
            </div>
          </Modal>
        ),
      )}
    </>
  );
}
