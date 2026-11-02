# 明天从这里开始：看懂 Reality Rank

不用先学完 TypeScript 再打开项目。先运行、看见效果，再沿着一次任务完成的流程学习。

## 准备本地环境

安装 Node.js 22 或更新版本，然后用 VS Code 打开克隆后的整个项目文件夹。TypeScript 与项目依赖一起安装，不需要全局安装。

```bash
npm ci
npm run dev -- --webpack
```

浏览器访问终端显示的本地地址，默认是 http://127.0.0.1:3000。在终端按 Ctrl+C 停止服务器。VS Code 自带 JavaScript / TypeScript 支持，无需本机专用配置即可开始学习。

## 第一课：先搞懂网站在哪里运行（约 45 分钟）

先用你熟悉的 Python/C++ 来理解：

| 本项目内容 | 作用 |
| --- | --- |
| TypeScript | 带类型检查的 JavaScript；类型帮助开发时发现错误 |
| JavaScript | 最终在浏览器中执行的程序 |
| React | 把数据与交互组织成可复用的界面组件 |
| Next.js | 组织路由、开发服务器和生产构建 |
| CSS / Tailwind | 控制颜色、间距、布局与响应式样式 |
| Node.js | 在电脑上运行开发工具；不代表你的成长数据存在后端 |
| npm | 安装依赖，并运行 package.json 定义的命令 |
| localStorage | 浏览器中持久保存字符串的空间 |

打开 `package.json` 看 scripts，找到 `dev`、`typecheck`、`test`、`build`、`start`。理解“运行开发工具”和“浏览器运行应用”是两个阶段。

本地开发时，Next.js 给浏览器提供页面和 JavaScript。点击任务后，React 在浏览器里计算新状态，仓储层将数据写入 localStorage，再更新页面。生产构建会把可发布的网站资源生成到 `out/`，当前版本没有自己的数据库服务器。

本地网站与已上线网址是不同的来源，所以两边 localStorage 数据彼此独立。需要搬数据时，先在原页面导出，再到目标页面导入。学习时使用本地示例数据即可。

## 第二课：找到一个页面（约 45 分钟）

依次打开：

1. `src/app/layout.tsx`：全站共享的布局，以及语言和数据 Provider。
2. `src/app/page.tsx`：首页路由入口。
3. `src/components/Dashboard.tsx`：首页组件。
4. `src/components/Shell.tsx`：侧边导航、顶部操作和移动导航。
5. `src/app/globals.css`：页面布局和视觉样式。

理解 `.tsx` 为什么既有 TypeScript 又有类似 HTML 的 JSX；组件就是返回界面的函数。先不要求看懂每一行。

小练习：修改一处首页文案或强调色，保存后观察页面更新。中文文案集中在 `src/i18n/zh.ts`；英文显示文本作为词典的键。暂时不要修改奖励算法。

## 第三课：看懂 TypeScript 和 React 的基本写法（约 60 分钟）

用 `src/types/index.ts` 学习 `type`、`interface`、联合类型、数组、可选值和 `null`。与 C++ 对比：TypeScript 类型主要在开发阶段检查，不能替代运行时输入校验。

用 `src/components/AddQuestModal.tsx` 学习：

- props：父组件传入的数据与回调。
- `useState`：组件当前的数据。
- `onChange` / `onSubmit`：输入和提交事件。
- 对象展开 `{ ...draft, title: value }`：创建更新后的对象。
- `map`：把数组变成选项或卡片。

小练习：创建一个中文任务，再编辑预计分钟数。解释为什么改时长不会自动增加经验。

## 第四课：跟踪一次任务完成（约 60 分钟）

按下面顺序读，不要从头到尾硬读整个仓库：

```text
点击 QuestCard 的完成按钮
  → AppProvider.mutate 接收更新函数
  → engine.completeQuest 计算并记录实际奖励
  → appRepository.saveState 校验并保存
  → storage.write 写入 localStorage
  → React state 更新
  → selectStats 推导统计，界面重新渲染
```

对照文件：`QuestCard.tsx` → `AppProvider.tsx` → `services/engine.ts` → `repositories/appRepository.ts` → `storage/storage.ts` → `services/selectors.ts`。

重点问题：为什么先保存成功再更新界面？为什么奖励需要快照？为什么统计从记录推导，而不是每个页面各存一份？

## 第五课：规则、数据保存和测试（约 60 分钟）

阅读 `config/`、`utils/`、`tests/engine.test.ts`，运行：

```bat
npm run typecheck
npm test
```

理解三种不同检查：类型检查发现类型问题；单元测试验证业务规则；真实浏览器测试验证交互和布局。构建成功并不代表全部功能一定正确。

练习：在本地创建任务、完成、刷新、撤销，观察经验与活动记录。先导出备份，再用练习数据尝试导入。不要用正式进度做重置实验。

## 学完后再进入“上线”课

学习顺序：生产构建 → 静态资源 → 托管服务 → 网址与域名 → HTTPS → 更新发布 → 数据备份。

```bat
npm run build
npm start
```

`npm start` 在本地预览 `out/`，不是自动发布到互联网。修改源码后，需要重新 build 才会更新这份生产预览。当前线上版本已托管在 Sites；本地修改不会自动同步到线上。

邮箱登录、验证码、云数据库和多设备同步属于下一阶段，不是把页面放上网的必需条件。等理解当前数据流后，再讨论这些功能会更容易。

## 明天可以直接问我

“我们开始 Reality Rank 第一课。先带我运行项目，再用 Python/C++ 类比解释 TypeScript、React、Next.js 和浏览器分别做什么。每次讲一小段，让我动手验证后再继续。”

业务规则详见 `README.md`，已验证与未验证的范围见 `TESTING.md`。
