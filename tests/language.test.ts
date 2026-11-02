import { test } from "node:test";
import assert from "node:assert/strict";
import { translate } from "../src/i18n/translate";
test("Chinese covers ranks, dynamic status and errors while preserving original English", () => {
  assert.equal(translate("Skills", "zh-CN"), "技能");
  assert.equal(translate("Gold II", "zh-CN"), "黄金 II");
  assert.equal(translate("Season 12", "zh-CN"), "第 12 赛季");
  assert.equal(
    translate("Complete 2 Main Quests to unlock competitive gaming.", "zh-CN"),
    "完成 2 个主线任务，解锁竞技游戏。",
  );
  assert.equal(
    translate("3 days of grace remaining. Decay begins afterward.", "zh-CN"),
    "宽限期还剩 3 天，之后开始衰减。",
  );
  assert.equal(translate("Skills", "en-US"), "Skills");
  assert.equal(
    translate("我的自定义任务 / My task", "zh-CN"),
    "我的自定义任务 / My task",
  );
});
