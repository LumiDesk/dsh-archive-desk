# dsh-archive-desk · 归档工作台

> **Archived-conversation manager for DeepSeek Harness** — browse, restore, recycle, and permanently delete archived sessions.

[![npm](https://img.shields.io/npm/v/dsh-archive-desk.svg?style=flat)](https://www.npmjs.com/package/dsh-archive-desk)
[![license](https://img.shields.io/npm/l/dsh-archive-desk.svg?style=flat)](./LICENSE)

![dsh-archive-desk · 归档工作台](https://raw.githubusercontent.com/LumiDesk/dsh-archive-desk/main/docs/assets/social-preview.png)

DeepSeek Harness（DSH）只提供「归档」：它把会话 id 藏进 `~/.dsh/storages/workspace.json`，
日志继续留在磁盘上，界面上再没有任何删除入口。这个插件补上后半段——**看得见、恢复得了、
删得掉**，并且把同一套能力开放给 Agent。

## 预览

![归档工作台：已归档列表、搜索与批量删除](https://raw.githubusercontent.com/LumiDesk/dsh-archive-desk/main/docs/assets/panel.png)

侧栏点「归档工作台」进入整页管理：「已归档」与「回收站」两个页签，支持按标题 / 摘要 / 项目搜索、
多选与批量删除；删除默认进回收站，彻底删除要二次确认。

## 为什么需要它

| 不装插件                                                                 | 装上之后                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| 归档会话只能靠 `archivedFilter` 在侧栏里翻                               | 一个完整的管理页：分页、搜索、多选、批量删除          |
| 想删只能手改 `workspace.json` + 手动删目录（还容易被运行中的宿主写回去） | 删除走注册表 API 与事务化文件操作，不会与内存状态打架 |
| 删错了无法恢复                                                           | 默认移入回收站，可恢复；彻底删除要二次确认 + 知情勾选 |
| Agent 完全够不着归档                                                     | `archived_conversations` 工具：列、删到回收站、恢复   |

## 能力

| 能力         | 说明                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| 归档列表     | 侧栏图标 → 中间整页，展示标题、摘要、项目、时间、体积                        |
| 搜索与分页   | 按标题 / 摘要 / 项目 / cwd / id 过滤，每页 20 条                             |
| 批量操作     | 多选、全选（当前筛选的全部）、批量删除                                       |
| 回收站       | 删除默认移入 `~/.dsh/archive-desk/trash/`，可恢复；也可直接彻底删除          |
| 失效引用清理 | 指向已不存在会话的归档记录，一键移除（只删引用，不动文件）                   |
| 会话菜单     | 会话「…」菜单里对已归档会话多一行「删除」，复用同一个确认弹窗                |
| Agent 工具   | `archived_conversations`：`list` / `delete`（进回收站）/ `trash` / `restore` |

### 删除到底做了什么

一个会话被删除时，插件按固定顺序处理，任何一步失败都会留下可解释的状态：

1. 会话目录移入回收站（或彻底删除）；
2. 删除投影缓存 `storages/session_projcache/sessions/<id>.json`（派生数据，可重建）；
3. 从所属 workspace 的成员列表里摘掉；
4. 从 `archivedSessionIds` 里移除；
5. 发出 `api-session/removed`，侧栏行立即消失。

运行中的会话一律跳过；附件目录 `~/.dsh/attachments` 永不触碰（内容寻址、跨会话共享）。

## 安装

```bash
# 在 DSH 的 profile 里安装（dsh 会把参数转发给 pnpm）
dsh plugin add dsh-archive-desk
```

也可以从本仓库安装：`dsh plugin add github:LumiDesk/dsh-archive-desk`，或在 DSH 里用
`plugin_manager` 的 `install_bundle` 指向本地目录。安装后出现在「设置 → 插件」，
侧栏出现「归档工作台」图标。

要求：DSH `0.2.1-rc.2`（本机验收版本）或更高。

## 使用

1. 点侧栏的「归档工作台」→ 打开管理页；「已归档」列出全部归档会话，「回收站」是待清理的。
2. 勾选会话 →「删除所选」→ 选「放入回收站」或「彻底删除」→ 确认。
3. 已归档会话的「…」菜单里也有「删除」，点了会跳到管理页并弹出同一个确认框。
4. 顶部横幅会提示有多少条引用已经失效（日志被删但归档 id 还在），点按钮一键清掉。

给 Agent 用：

```jsonc
{ "action": "list", "query": "登录", "limit": 10 }          // 看
{ "action": "delete", "ids": ["session-…"], "confirm": true } // 删到回收站
{ "action": "trash" }                                        // 看回收站
{ "action": "restore", "trashIds": ["2026…-session-…"] }     // 恢复
```

彻底删除**不开放给工具**：批量、不可恢复的操作留给人在面板里做。

## 技术栈

| 层          | 选择                                                          | 为什么                                                                         |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 语言        | TypeScript（`strict`，ESM）                                   | 插件要碰会话日志、注册表与文件系统，类型是最便宜的护栏                         |
| Host 构建   | `tsc` → `dist/index.js`                                       | 不需要打包器；Node 直接加载 ESM                                                |
| Client 构建 | `esbuild` → `dist/client.js`                                  | 浏览器半必须是单个 `__ModuleLoader__` 工厂文件，esbuild 一条命令搞定           |
| 传输        | 自注册 HTTP 前缀路由 + `connection.requestRejection`          | 宿主的 `connection.rpc.handle` 在组合 profile 里不可用（见 docs/设计.md §4.2） |
| 状态        | `ctx.workspaceRegistry` 的公开 API                            | 直接改 `workspace.json` 会被宿主内存状态覆盖                                   |
| 存储        | 文件系统（回收站两阶段写入）                                  | 会话本身就是目录，移动目录比复制快且原子                                       |
| 测试        | `node:test`（零依赖）+ 宿主自己的 `assertSupportedJsonSchema` | 测试直接跑 TS，工具 schema 用宿主同一个校验函数把关                            |
| 质量        | Prettier + ESLint + Commitlint + Husky/lint-staged            | 提交前自动格式化、检查、校验提交信息                                           |

## 工程结构

```
src/host/index.ts        Host 入口：HTTP 路由、能力探测、工具注册、启动诊断
src/host/service.ts      业务：列表 / 删除事务 / 恢复 / 清空 / 清理失效引用
src/host/paths.ts        路径解析、id 校验、体积、跨卷保护
src/host/trash.ts        回收站存储（两阶段写入 + 崩溃恢复）
src/host/tool.ts         Agent 工具定义（lossless JSON + 结构化摘要）
src/host/diagnostics.ts  启动诊断（~/.dsh/archive-desk/last-boot.json）
src/client/index.tsx     侧栏图标 + 管理面板 + 会话菜单项
scripts/build-client.mjs 把 Client 打成 __ModuleLoader__ 期望的单文件
dist/                    构建产物（随仓库提交：本地 link 安装直接读这里）
docs/设计.md              设计与决策记录
```

## 开发

```bash
pnpm install
pnpm build        # host(tsc) + client(esbuild)；改完 src/ 必须构建
pnpm typecheck
pnpm lint
pnpm test         # node --test，零测试依赖；会先自动 build
pnpm format
```

提交走 Conventional Commits，Husky 在 `pre-commit` 跑 lint-staged、在 `commit-msg` 跑 commitlint。

### 发版

```bash
pnpm release patch          # 0.2.0 → 0.2.1（minor / major / 显式版本号同理）
pnpm release minor --dry-run
```

脚本 `scripts/release.mjs` 会依次做：工作区干净检查 → 目标版本未被占用检查 →
`typecheck` / `lint` / `test` → `npm version`（提交并打 `vX.Y.Z` tag）→ `npm publish` →
推送提交与 tag → `gh release create --generate-notes`。任何一步失败都会停下并打印下一步该做什么。

> npm 11 的分阶段发布 + Security key（passkey）意味着 `npm publish` 必须在**能打开浏览器的交互式终端**
> 里完成授权；在 CI 或非交互 shell 里会得到 `EOTP`。脚本遇到这种情况会保留版本提交与 tag，并提示你
> 手动完成 `npm publish` 后再推送。

可选参数：`--dry-run`、`--no-checks`、`--no-publish`、`--no-push`、`--no-release`、`--allow-dirty`。

## 排查

面板不出现时先看 `~/.dsh/archive-desk/last-boot.json`：它按顺序记录 `apply-start` →
`injected` → `registered` → `tool-registered`，以及每一步可见的 Host 服务；失败会留下
`bind-error` / `tool-error` 和错误文本。

## 已知限制

- 恢复后侧栏行要等下一次会话列表刷新才回来（面板里的列表立刻更新）。
- 只处理已归档会话；未归档的请先归档。
- 回收站是全局的（`~/.dsh/archive-desk`），不跟随项目。
- 彻底删除仅限人工在面板操作，Agent 工具不提供。

## License

MIT © 2026 Lumi Desk
