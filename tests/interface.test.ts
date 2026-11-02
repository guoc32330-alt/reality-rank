import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createElement as h, StrictMode, useState } from "react";
import { AppProvider, useApp } from "../src/components/AppProvider";
import { QuestCard } from "../src/components/QuestCard";
import { AddQuestModal } from "../src/components/AddQuestModal";
import { selectStats } from "../src/services/selectors";
import { appRepository } from "../src/repositories/appRepository";
import { LanguageProvider, useLanguage } from "../src/i18n/LanguageProvider";

test("React flow: StrictMode boot, create, edit, complete, undo, delete, refresh, export/import, reset", async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost:3000",
  });
  const win = dom.window;
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "HTMLDialogElement",
    "MutationObserver",
    "localStorage",
    "StorageEvent",
    "Event",
    "MouseEvent",
    "navigator",
  ] as const)
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: key === "window" ? win : win[key],
    });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    writable: true,
    value: true,
  });
  win.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  win.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const { render, fireEvent, waitFor, cleanup } =
    await import("@testing-library/react");
  try {
    function Harness() {
      const { state, error } = useApp();
      const [open, setOpen] = useState(false);
      const stats = selectStats(state);
      return h(
        "div",
        null,
        h("output", { "data-testid": "xp" }, String(stats.xp)),
        h("output", { "data-testid": "unlock" }, String(stats.gamingUnlocked)),
        h("output", { "data-testid": "error" }, error),
        h("button", { onClick: () => setOpen(true) }, "New task"),
        ...state.quests.map((q) => h(QuestCard, { quest: q, key: q.id })),
        open ? h(AddQuestModal, { onClose: () => setOpen(false) }) : null,
      );
    }
    const mount = () =>
      render(h(StrictMode, null, h(AppProvider, null, h(Harness))));
    let ui = mount();
    await waitFor(() => assert.equal(ui.getByTestId("xp").textContent, "0"));
    fireEvent.click(ui.getByText("New task"));
    fireEvent.change(ui.getByLabelText("Quest name"), {
      target: { value: "Test a meaningful feature" },
    });
    fireEvent.submit(ui.getByLabelText("Quest name").closest("form")!);
    await waitFor(() => assert.ok(ui.queryByText("Test a meaningful feature")));
    await waitFor(() => assert.equal(ui.queryByRole("dialog") === null, true));
    fireEvent.click(ui.getByLabelText("Options for Test a meaningful feature"));
    fireEvent.click(ui.getByText("Edit quest"));
    fireEvent.change(ui.getByLabelText("Quest name"), {
      target: { value: "Ship a meaningful feature" },
    });
    fireEvent.submit(ui.getByLabelText("Quest name").closest("form")!);
    await waitFor(() => assert.ok(ui.queryByText("Ship a meaningful feature")));
    await waitFor(() => assert.equal(ui.queryByRole("dialog") === null, true));
    fireEvent.click(ui.getByLabelText("Complete Ship a meaningful feature"));
    await waitFor(() => assert.equal(ui.getByTestId("xp").textContent, "60"));
    assert.equal(ui.getByTestId("unlock").textContent, "true");
    assert.equal(ui.getByTestId("error").textContent, "");
    const backup = appRepository.exportState(await appRepository.loadState());
    cleanup();
    ui = mount();
    await waitFor(() => assert.equal(ui.getByTestId("xp").textContent, "60"));
    fireEvent.click(ui.getByLabelText("Undo Ship a meaningful feature"));
    await waitFor(() => assert.equal(ui.getByTestId("xp").textContent, "0"));
    assert.equal(ui.getByTestId("unlock").textContent, "false");
    fireEvent.click(ui.getByLabelText("Options for Ship a meaningful feature"));
    fireEvent.click(ui.getByText("Delete quest"));
    const dialog = ui.getByRole("dialog");
    fireEvent.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Delete quest",
      )!,
    );
    await waitFor(() =>
      assert.equal(ui.queryByText("Ship a meaningful feature") === null, true),
    );
    const current = await appRepository.loadState(),
      imported = appRepository.importState(backup);
    await appRepository.saveState({ ...imported, revision: current.revision });
    cleanup();
    ui = mount();
    await waitFor(() => assert.equal(ui.getByTestId("xp").textContent, "60"));
    assert.throws(() => appRepository.importState('{"version":1}'));
    assert.equal(selectStats(await appRepository.loadState()).xp, 60);
    const stale = await appRepository.loadState();
    await appRepository.saveState(stale);
    await assert.rejects(() => appRepository.saveState(stale), /another tab/);
    const reset = await appRepository.resetState();
    assert.equal(selectStats(reset).xp, 0);
    assert.equal(reset.quests.length, 5);
    cleanup();
    function LocaleHarness() {
      const { language, setLanguage, t } = useLanguage();
      return h(
        "div",
        null,
        h(
          "button",
          {
            onClick: () =>
              setLanguage(language === "zh-CN" ? "en-US" : "zh-CN"),
          },
          "Switch language",
        ),
        h("output", { "data-testid": "translation" }, t("Skills")),
        h(Harness),
      );
    }
    const mountLocalized = () =>
      render(h(LanguageProvider, null, h(AppProvider, null, h(LocaleHarness))));
    ui = mountLocalized();
    await waitFor(() =>
      assert.equal(ui.getByTestId("translation").textContent, "技能"),
    );
    assert.equal(document.documentElement.lang, "zh-CN");
    fireEvent.click(ui.getByText("New task"));
    fireEvent.change(ui.getByLabelText("任务名称"), {
      target: { value: "完成中文界面" },
    });
    fireEvent.change(ui.getByLabelText("任务类型"), {
      target: { value: "Boss" },
    });
    assert.equal(
      (ui.getByLabelText("任务类型") as HTMLSelectElement).value,
      "Boss",
    );
    fireEvent.submit(ui.getByLabelText("任务名称").closest("form")!);
    await waitFor(() => assert.equal(ui.queryByRole("dialog") === null, true));
    const beforeLanguageChange = await appRepository.loadState();
    assert.equal(beforeLanguageChange.quests.at(-1)!.type, "Boss");
    assert.equal(beforeLanguageChange.quests.at(-1)!.title, "完成中文界面");
    fireEvent.click(ui.getByText("Switch language"));
    await waitFor(() =>
      assert.equal(ui.getByTestId("translation").textContent, "Skills"),
    );
    assert.equal(localStorage.getItem("reality-rank:language"), "en-US");
    assert.deepEqual(await appRepository.loadState(), beforeLanguageChange);
    cleanup();
    ui = mountLocalized();
    await waitFor(() =>
      assert.equal(ui.getByTestId("translation").textContent, "Skills"),
    );
    assert.ok(ui.getByText("完成中文界面"));
    cleanup();
  } finally {
    cleanup();
    dom.window.close();
  }
});
