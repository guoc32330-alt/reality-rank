# Reality Rank

把现实当成主排位，把游戏当成副排位。

一个可在自己设备上使用的个人成长 MVP。Next.js App Router、React、TypeScript、Tailwind CSS、Lucide；不需要账号、数据库或 API 密钥。

## 本地运行

使用 Node.js 22 LTS 或更新版本，在本目录打开终端：

```bash
npm install
npm run dev
```

访问 http://localhost:3000。开发服务器仅监听本机。

```bash
npm run typecheck
npm test
npm run build
```

生产构建是静态网站，输出在 `out/`，可以部署到支持静态资源的服务器。构建后运行 `npm start`，使用附带的本地静态文件服务器预览。部署后的八个页面不依赖 Node 后端。

## 第一次使用

界面默认使用简体中文。顶部「中文 / EN」或设置里的「界面语言」可切换英文，选择会自动保存在当前浏览器。语言仅影响显示，不修改任务内容、内部枚举、经验、段位或奖励记录；已有 v1 数据无需迁移。

1. 从 Hendrix、Level 1、Bronze III 开始，五个示例任务不包含虚构成长数据。
2. 在 Quests 新建或编辑任务，选择技能、Daily / Main / Boss、行为类型和难度。
3. 点击任务左侧方框完成；再次点击撤销。完成可能触发等级、技能段位或 Boss 成就弹窗。
4. Main Quest 计入 Reality Streak，同时满足当天 Gaming Unlock 条件。
5. 在 Season 设置最多三个目标；在 Weekly review 查看自动统计。
6. 在 Settings 导出 JSON 备份。手机与电脑的数据分别存在各自浏览器，第一版没有云同步。

## 规则与重要取舍

- **Reality Rating**：六个技能当前 Rating 的算术平均值。Reality Rank 使用同一组段位门槛。
- **XP**：任务基础 XP × 难度 × 当天 Streak 加成 × 自定义 XP 系数，取整。预估分钟数不参与奖励计算。
- **Level**：第一档 100 XP，每升一级，下一档增加 40 XP。正常使用中 XP / Level 不下降；Undo 是纠正错误记录的例外。
- **Rating**：基础 Rating × 难度。低于历史 Peak 的部分可获得恢复加成；超过旧 Peak 的部分恢复正常收益。
- **Mastery**：直接使用任务设定值，最高 100%。不乘时间、难度或 Streak，第一版不衰减。表单按行为类型建议奖励，用户可以手动调整。
- **Decay**：以设备本地日历日期结算，宽限期之后每天按当前 Rating 复利扣减。低段位系数 0.7–0.8，Gold / Platinum 为 1，Diamond 以上 1.1–1.2。
- **Decay Floor**：`Peak Rating × (0.25 + 0.50 × Mastery / 100)`。Floor 只限制衰减，不能凭空增加 Rating。
- **Project**：不衰减；过去七个日历日的有效完成次数决定 Momentum：0 Dormant、1 Low、2 Stable、3–4 High、5+ Locked In。
- **Streak**：某天至少完成一个 Main Quest 才算。3 / 7 / 14 / 30 天对应 5% / 10% / 15% / 20% XP 加成。当天第一次 Main Quest 可以触发新档位。
- **Undo**：按已保存快照撤回奖励；已有衰减记录不变；统计、解锁与成就重新推导。历史 Peak 保留。撤销曾经封顶的 Mastery 时也使用当时实际获得值。
- **Quest**：Daily 可选择每天重置；Main、Boss 完成后锁定。已经有奖励的任务不能更改类型或所属技能。删除任务保留历史奖励，想撤回奖励需先 Undo。
- **Season**：默认十二周，到期后手动归档并开始下一季；不会自动清空 XP / Rating。调整长度影响下一季。已归档总结保持原样，即使之后纠正旧完成记录。
- **自我管理**：Gaming Unlock 是提示，不拦截任何游戏。手动奖励允许自由调整，因此第一版不宣称能验证实际成果或阻止用户人为创建重复任务。

## 阅读代码的建议顺序

```text
src/
  types/index.ts                 数据结构：AppState / Quest / Reward Snapshot 等
  config/                        段位、XP、衰减、恢复、技能、成就规则
  utils/                         日期、段位、等级、Streak、Momentum 等纯函数
  services/defaultState.ts       新账号与示例任务
  services/engine.ts             完成、撤销、离线衰减、设置变更、赛季结算
  services/selectors.ts          从奖励与事件推导技能、日统计、周统计
  storage/schema.ts             Zod 导入验证与数据约束
  storage/storage.ts            唯一访问 localStorage 的文件
  repositories/appRepository.ts 异步数据接口，未来可替换为 API / Supabase
  components/AppProvider.tsx     React state、持久化、跨标签同步、成长弹窗
  components/                   页面与可复用组件
  app/                          八个 Next.js 路由与样式
tests/engine.test.ts             核心业务回归测试
```

React 的 Context 让页面访问同一份 AppState。页面通过 `mutate` 提交纯函数变更，先成功保存，再更新 UI。`selectStats` 从有效奖励与不可回滚的衰减事件推导当前视图，避免多个地方维护一份统计而发生不一致。

仓储接口采用 Promise。未来实现 Supabase Repository 后，可以保留页面和大部分业务计算；真正 SaaS 化时还需把奖励验证、权限和事务迁移到服务器，不应信任客户端奖励。

Quest / Activity 已保留来源字段和 metadata。当前不包含支付、AI 调用、登录、云同步或第三方自动验证。

## 数据安全边界

localStorage 只属于当前浏览器与网站地址。清理浏览器、换设备、隐私浏览窗口关闭、存储配额耗尽都可能影响保存。请定期导出 JSON。

每次保存保留上一份原始数据，读取失败时不会自动覆盖。保存失败会显示错误；跨标签使用 Web Locks 和 revision 检查，避免静默覆盖。导入完整验证版本、嵌套类型、奖励、阈值、ID 和赛季关系，并要求确认；重置需两次确认。文件备份不加密。

第一版使用设备本地日期和时钟；跨时区旅行可能改变日期边界，手动修改系统时钟并不是防作弊场景。未来账号服务可提供统一时间策略。

## 开发环境说明

此项目在 Codex 的 Windows 受限环境内制作。该环境不支持 Node 的部分子进程管道，因此构建验证使用了工作区外置的临时文件输出适配器和 Next.js workerThreads 配置。普通本机环境按上面的 npm 命令即可。适配器不属于应用或发布资源。

详细验证范围见 `TESTING.md`。
