# 验证记录

验证日期：2026-09-22。

## 已验证

- 中文更新：新增词典及动态文案测试；React 流程覆盖中文任务创建、下拉框仍保存原始 Boss 枚举、中文任务名称保留、语言切换不改变 AppState、刷新后恢复语言选择。

- Next.js production build 成功，八个路由全部静态生成。
- TypeScript 严格检查通过，未使用 `ignoreBuildErrors`。
- 开发服务器实际启动，首页 HTTP 200。
- 生产静态服务器启动，首页、Quests、Skills、Weekly、Season、Achievements、Profile、Settings 均 HTTP 200。
- 19 个业务测试：初始状态、完成奖励、重复领取保护、Daily 跨天重置、精确 Undo、难度系数、宽限期、复利离线衰减、刷新幂等、Undo 保留衰减、恢复不越过旧 Peak 加成、Decay Floor、Project Momentum、Streak 与加成上限、等级和段位边界、编辑锁定和删除、规则变更、赛季归档、导入验证、时钟回拨。
- React + jsdom 交互流程：StrictMode 初始化，新建、编辑、完成、撤销、删除任务；重新挂载恢复 localStorage；Gaming Unlock；导出 / 导入往返；错误文件不覆盖数据；旧 revision 写入被拒绝；重置。

## 尚未完成的验证

真实浏览器视觉检查和 390 / 768 / 1024 / 1440 px 的无横向滚动检查未完成。当前执行环境拒绝 Chromium/Edge 需要的 Windows 进程通信（`mojo platform_channel: Access denied`），独立浏览器同样无法稳定渲染。

已按这些断点编写响应式 CSS，但代码检查与 jsdom 不等同于真实浏览器验收。原生 dialog 的焦点与手机键盘体验、移动导航、长文本、200% 字体缩放仍需在正常浏览器中人工检查。

WebMCP `start_quest_creation` 已提供，功能是打开任务表单，不会自动提交。缺少支持该 API 的可用浏览器环境，注册及运行验证暂不可用。

## 复现

```bash
npm install
npm run typecheck
npm test
npm run build
npm start
```

本次执行环境的 Node 管道受限，所以使用外置临时适配器运行 Next 构建，用 TypeScript loader 执行同一套测试；不改动测试断言，不跳过类型检查。适配器不包含在发布应用中。

## 建议的首次人工检查

1. 在四个指定宽度打开首页与任务弹窗，确认无横向滚动、按钮可点击、文字不重叠。
2. 用真实手机创建 Main Quest，完成后刷新，检查 XP、Gaming Unlock 和 Streak，再撤销。
3. 在 Settings 导出，确认文件可以重新导入；尝试错误 JSON，不应改变现有数据。
4. 在两个标签页修改任务，确认另一个标签页更新；测试重置的第二次确认。
5. 正式开始记录前保存第一份备份。不同地址、设备和浏览器不会自动共享 localStorage。
