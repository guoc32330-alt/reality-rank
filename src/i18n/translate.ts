import { zh } from "./zh";
export type Language = "zh-CN" | "en-US";
const rankNames: Record<string, string> = {
  Bronze: "青铜",
  Silver: "白银",
  Gold: "黄金",
  Platinum: "铂金",
  Diamond: "钻石",
  Master: "大师",
  Immortal: "不朽",
};
export function translate(text: string, language: Language): string {
  if (language === "en-US") return text;
  const key = text.trim();
  if (zh[key]) return text.replace(key, zh[key]);
  const rank = key.match(
    /^(Bronze|Silver|Gold|Platinum|Diamond|Master|Immortal)( [IV]+)?$/,
  );
  if (rank) return rankNames[rank[1]] + (rank[2] ?? "");
  const tr = (s: string) => translate(s, language);
  const patterns: [RegExp, (...groups: string[]) => string][] = [
    [/^Season (\d+)$/, (n) => `第 ${n} 赛季`],
    [/^SEASON (\d+)$/, (n) => `第 ${n} 赛季`],
    [/^(\d+) days$/, (n) => `${n} 天`],
    [
      /^Complete (\d+) Main Quests? to unlock competitive gaming\.$/,
      (n) => `完成 ${n} 个主线任务，解锁竞技游戏。`,
    ],
    [/^([\d,]+) RP to (.+)$/, (n, r) => `距离${tr(r)}还差 ${n} 实力分`],
    [/^Trained today$/, () => `今天已训练`],
    [/^Trained (\d+)d ago$/, (n) => `${n} 天前训练`],
    [
      /^(\d+) days of grace remaining\. Decay begins afterward\.$/,
      (n) => `宽限期还剩 ${n} 天，之后开始衰减。`,
    ],
    [
      /^Inactive · base ([\d.]+)% \/ day, adjusted for rank\.$/,
      (n) => `暂无训练 · 基础每日衰减 ${n}%，按当前段位调整。`,
    ],
    [
      /^(.+) leads with ([\d,]+) XP this week\. Keep turning effort into output\.$/,
      (s, xp) => `本周${tr(s)}领先，获得 ${xp} XP。继续将努力变成成果。`,
    ],
    [
      /^Make space for a small (.+) quest next week\.$/,
      (s) => `下周可以安排一个小型${tr(s)}任务。`,
    ],
    [
      /^(\d+) of (\d+) earned\. Milestones with meaning\.$/,
      (n, total) => `已解锁 ${n} / ${total} 项成就。记录有意义的成长。`,
    ],
    [/^View (.+) details$/, (s) => `查看${tr(s)}详情`],
    [/^(.+) rank progress$/, (s) => `${tr(s)}段位进度`],
    [/^(.+) weekly XP$/, (s) => `${tr(s)}本周经验`],
    [/^(.+) mastery$/, (s) => `${tr(s)}掌握度`],
    [/^(.+) progress$/, (s) => `${tr(s)}进度`],
    [/^Options for (.+)$/, (s) => `${s}的操作`],
    [/^Complete (.+)$/, (s) => `完成 ${s}`],
    [/^Undo (.+)$/, (s) => `撤销 ${s}`],
    [/^Toggle (.+)$/, (s) => `切换目标状态：${s}`],
    [/^Delete goal (.+)$/, (s) => `删除目标：${s}`],
    [/^Undid (.+)$/, (s) => `已撤销：${s}`],
    [/^(.+) · inactivity adjustment$/, (s) => `${tr(s)} · 长期未训练调整`],
    [/^Started Season (\d+)$/, (n) => `开启第 ${n} 赛季`],
    [/^Level (\d+) → (\d+)$/, (a, b) => `等级 ${a} → ${b}`],
    [
      /^\+([\d.]+) XP · \+([\d.]+) Rating$/,
      (xp, rp) => `+${xp} XP · +${rp} 实力分`,
    ],
    [
      /^(Coding|AI|Fitness|School|Project|Social): (.+) → (.+)$/,
      (s, a, b) => `${tr(s)}：${tr(a)} → ${tr(b)}`,
    ],
    [/^Too small: expected (.+)$/, () => `输入值太小，请检查允许的范围。`],
    [/^Too big: expected (.+)$/, () => `输入值太大，请检查允许的范围。`],
    [/^Invalid input(.+)$/, () => `输入内容无效，请检查后重试。`],
  ];
  if (key.includes("\n")) return text.split("\n").map(tr).join("\n");
  for (const [pattern, render] of patterns) {
    const match = key.match(pattern);
    if (match) return render(...match.slice(1));
  }
  return text;
}
