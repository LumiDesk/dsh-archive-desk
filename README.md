# dsh-archive-desk · 归档工作台

> **状态：骨架（scaffold）** — 项目结构、构建与工程规范已就绪，功能尚未实现。
> 设计、取舍与风险见 [docs/设计.md](docs/设计.md)。

DeepSeek Harness（DSH）的归档对话管理插件。DSH 只提供「归档」——归档只是把会话 id 藏进
`~/.dsh/storages/workspace.json`，日志仍留在磁盘上，界面上也没有任何删除入口。这个插件补上
后半段：**看得见、恢复得了、删得掉**。

## 计划能力

| 能力         | 说明                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| 归档列表     | 侧栏图标 → 中间管理页，分页展示标题、摘要、项目、时间、体积                   |
| 批量操作     | 多选 / 全选（当前筛选） / 批量删除                                            |
| 回收站       | 删除默认移入 `~/.dsh/archive-desk/trash/`，可恢复；也可直接彻底删除           |
| 失效引用清理 | 指向已不存在会话的归档记录，一键清掉                                          |
| Agent 工具   | `archived_conversations`：列、删（进回收站）、恢复；彻底删除默认对 Agent 关闭 |

## 工程结构

```
src/host/index.ts       Host 入口：apply / 能力探测 / Connection RPC 通道
src/client/index.tsx    Client 入口：面板注册点（目前为空）
scripts/build-client.mjs 把 Client 打成 __ModuleLoader__ 期望的单文件
dist/                   构建产物（已提交：本地 link 安装直接读这里）
locale/{zh,en}.json     插件元数据与界面文案
cordis.patch.yml        bundle patch：插入 Host 行
icon.svg                插件图标（线性图标，跟随主题色）
docs/设计.md             设计稿与决策记录
```

TypeScript 编写：Host 用 `tsc` 输出 ESM，Client 用 `esbuild` 打成 IIFE 并包进
`window.__ModuleLoader__.load({ id, factory(require) {...} })`——React 由页面模块表提供，
不打包进产物。

## 开发

```bash
pnpm install
pnpm build        # 改完 src/ 必须构建，dist/ 要一起提交
pnpm typecheck
pnpm lint
pnpm format
```

提交走 Conventional Commits，Husky 会在 `pre-commit` 跑 lint-staged、在 `commit-msg` 跑
commitlint。

## 安装

在 DSH 会话中通过 `plugin_manager` 的 `install_bundle` 指向本目录（或 `dsh plugin add`）。
**当前是骨架版本**：安装后不会改变任何界面，只注册一个 Host RPC 通道用于自检。

## 设计原则（摘要）

1. **状态只走注册表 API**：`unarchiveSession` / `detachSession` / `archiveSession` /
   `attachSession`，绝不直接改 `workspace.json`（Host 内存里有一份状态，会被覆盖回去）。
2. **先动文件，后动状态**：文件移动失败 = 什么都没发生；状态写失败 = 只剩一个隐形悬空引用。
3. **只操作归档集合内的会话**，运行中的会话一律跳过，附件目录永不触碰。
4. **UI 与 Agent 共用同一个 Host 服务方法**，不写两套逻辑。

## License

MIT © 2026 Lumi Desk
