# dsh-archive-desk · 归档工作台

> **Archived-conversation manager for DeepSeek Harness** — browse, restore, recycle, and permanently delete archived sessions.

[![npm](https://img.shields.io/npm/v/dsh-archive-desk.svg?style=flat)](https://www.npmjs.com/package/dsh-archive-desk)
[![license](https://img.shields.io/npm/l/dsh-archive-desk.svg?style=flat)](./LICENSE)

![dsh-archive-desk · 归档工作台](https://raw.githubusercontent.com/LumiDesk/dsh-archive-desk/main/docs/assets/social-preview.png)

DeepSeek Harness（DSH）只提供「归档」：它把会话 id 藏进 `~/.dsh/storages/workspace.json`，日志继续留在磁盘上，界面上再没有任何删除入口。这个插件补上后半段——**看得见、恢复得了、删得掉**，并且把同一套能力开放给 Agent。

## 界面

侧栏点「归档工作台」进入整页管理：「已归档」与「回收站」两个页签，支持按标题 / 摘要 / 项目搜索、排序、分页、多选与批量删除；删除默认进回收站，彻底删除要显式选择 + 知情确认。列表首次加载显示骨架屏，刷新时保留旧数据。

## 为什么需要它

| 不装插件                                                                 | 装上之后                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| 归档会话只能靠 `archivedFilter` 在侧栏里翻                               | 一个完整的管理页：状态、搜索、排序、分页、批量操作    |
| 想删只能手改 `workspace.json` + 手动删目录（还容易被运行中的宿主写回去） | 删除走注册表 API 与事务化文件操作，不会与内存状态打架 |
| 删错了无法恢复                                                           | 默认移入回收站，可恢复；彻底删除要二次确认 + 知情勾选 |
| Agent 完全够不着归档                                                     | `archived_conversations` 工具：列、删到回收站、恢复   |

## 能力

| 能力         | 说明                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| 归档列表     | 侧栏图标 → 中间整页，展示标题、摘要、项目、时间、体积、状态                     |
| 状态区分     | `运行中` / `未关闭` / `失效` / 正常；运行中的会话不会误判为可删除               |
| 搜索与排序   | 按标题 / 摘要 / 项目 / cwd / id 过滤；最近活动 / 体积 / 标题 / 归档顺序         |
| 分页         | 每页 10 / 20 / 50，删除后自动校正页码                                           |
| 批量操作     | 多选、当前页全选、选择全部筛选结果、批量删除                                    |
| 删除确认     | 默认放入回收站；彻底删除需主动切换 + 勾选「不可恢复」                           |
| 回收站       | 删除默认移入 `~/.dsh/archive-desk/trash/`，可恢复；分页、批量恢复/彻底删除/清空 |
| 损坏条目     | 回收站里缺 meta 或 payload 的条目仍可见，只允许删除                             |
| 失效引用清理 | 指向已不存在会话的归档记录，一键移除（只删引用，不动文件）                      |
| 会话菜单     | 会话「…」菜单里对已归档会话多一行「删除」，复用同一个确认弹窗                   |
| Agent 工具   | `archived_conversations`：`list` / `delete`（进回收站）/ `trash` / `restore`    |

### 状态是什么意思

| 状态     | 判定                                                          | 能否删除             |
| -------- | ------------------------------------------------------------- | -------------------- |
| `运行中` | 会话已加载，且 DSH 的 `workspace/session-activity` 报告有活动 | 否                   |
| `未关闭` | 会话已加载，但没有活动——只是还开在主面板里                    | 否，先切换到其他会话 |
| `失效`   | 归档 id 存在，但 `sessions/` 下找不到目录                     | 只能移除归档引用     |
| 正常     | 目录存在、未加载、无活动                                      | 是                   |

DSH 的 `sessions.get(id)` 只代表「已加载」，不代表「正在运行」。本插件用 DSH 自己的活动瀑布（turn / job / 定时任务 / 子 Agent）判断运行状态，避免结束了的对话被误标。

### 删除到底做了什么

一个会话被删除时，插件按固定顺序处理，任何一步失败都会留下可解释的状态：

1. 会话目录移入回收站（或彻底删除）；
2. 删除投影缓存 `storages/session_projcache/sessions/<id>.json`（派生数据，可重建）；
3. 从所属 workspace 的成员列表里摘掉；
4. 从 `archivedSessionIds` 里移除；
5. 发出 `api-session/removed`，侧栏行立即消失。

运行中或仍打开的会话一律跳过；附件目录 `~/.dsh/attachments` 永不触碰（内容寻址、跨会话共享）。

### 性能

列表不再每次请求重读所有日志：

- 一次扫描 `sessions/*` 建立会话路径索引；
- 列表摘要写入 `~/.dsh/archive-desk/summaries.json`，用「目录大小 + 最新 mtime」做条件缓存；
- 未命中的会话最多 4 路并发读取；
- 删除确认只查选中项（`inspect`），不拉全量列表；
- 客户端首次加载显示骨架屏，刷新保留旧数据，快速搜索会取消旧请求。

## 安装

```bash
# 在 DSH 的 profile 里安装（dsh 会把参数转发给 pnpm）
dsh plugin add dsh-archive-desk
```

也可以从本仓库安装：`dsh plugin add github:LumiDesk/dsh-archive-desk`，或在 DSH 里用 `plugin_manager` 的 `install_bundle` 指向本地目录。安装后出现在「设置 → 插件」，侧栏出现「归档工作台」图标。

要求：DSH `0.2.1-rc.2`（本机验收版本）或更高。

## 使用

1. 点侧栏的「归档工作台」→ 打开管理页；「已归档」列出全部归档会话，「回收站」是待清理的。
2. 勾选会话 →「删除」→ 选「放入回收站」或「彻底删除」→ 确认。
3. 已归档会话的「…」菜单里也有「删除」，点了会跳到管理页并弹出同一个确认框。
4. 顶部横幅会提示有多少条引用已经失效（日志被删但归档 id 还在），点按钮一键清掉。
5. 回收站里可以单行或批量恢复、彻底删除，也可以清空整个回收站。

给 Agent 用：

```jsonc
{ "action": "list", "query": "登录", "limit": 10 }          // 看
{ "action": "delete", "ids": ["session-…"], "confirm": true } // 删到回收站
{ "action": "trash", "limit": 20 }                           // 看回收站
{ "action": "restore", "trashIds": ["2026…-session-…"] }     // 恢复
```

彻底删除**不开放给工具**：批量、不可恢复的操作留给人在面板里做。

## 无配置

这个插件没有 `settings.json`、插件配置页或环境变量开关。

- 每页条数、排序是页面上的可见控件，默认 20 / 最近活动，不持久化；
- Agent 只能删到回收站，彻底删除只由人操作；
- 摘要长度、批量上限、回收站分页等是代码常量，不是部署旋钮。

理由很简单：归档管理工具的安全边界应该由代码固定，而不是让用户或部署者去调一个可能被误改的开关。

## 技术栈

| 层          | 选择                                                          | 为什么                                                                         |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 语言        | TypeScript（`strict`，ESM）                                   | 插件要碰会话日志、注册表与文件系统，类型是最便宜的护栏                         |
| Host 构建   | `tsc` → `dist/index.js`                                       | 不需要打包器；Node 直接加载 ESM                                                |
| Client 构建 | `esbuild` → `dist/client.js`（minify）                        | 浏览器半必须是单个 `__ModuleLoader__` 工厂文件                                 |
| Client UI   | `@deepseek-ai/dsh-client-ui-primitives`（external）           | 复用宿主的 Modal/Toast/Button/Tabs，自动跟随主题；不打包第二份组件             |
| 传输        | 自注册 HTTP 前缀路由 + `connection.requestRejection`          | 宿主的 `connection.rpc.handle` 在组合 profile 里不可用（见 docs/设计.md §4.2） |
| 状态        | `ctx.workspaceRegistry` 的公开 API                            | 直接改 `workspace.json` 会被宿主内存状态覆盖                                   |
| 活动判定    | `workspace/session-activity` 瀑布                             | 与 DSH 自己的归档准入一致，不会把「已加载」当成「运行中」                      |
| 存储        | 文件系统（回收站两阶段写入 + 摘要缓存）                       | 会话本身就是目录，移动目录比复制快且原子                                       |
| 测试        | `node:test`（零依赖）+ 宿主自己的 `assertSupportedJsonSchema` | 测试直接跑 TS，工具 schema 用宿主同一个校验函数把关                            |
| 质量        | Prettier + ESLint + Commitlint + Husky/lint-staged            | 提交前自动格式化、检查、校验提交信息                                           |

## 工程结构

```
src/host/index.ts        Host 入口：HTTP 路由、能力探测、工具注册、启动诊断
src/host/service.ts      业务：列表 / 删除事务 / 恢复 / 清空 / 清理失效引用
src/host/paths.ts        路径解析、id 校验、体积/指纹、跨卷与越界保护
src/host/cache.ts        列表摘要缓存（summaries.json）
src/host/trash.ts        回收站存储（两阶段写入 + 恢复事务 + 损坏条目）
src/host/tool.ts         Agent 工具定义（lossless JSON + 结构化摘要）
src/host/diagnostics.ts  启动诊断（~/.dsh/archive-desk/last-boot.json）
src/client/index.tsx     侧栏图标、槽位注册、会话菜单项、样式注入
src/client/page.tsx      管理页：Tabs、表格、分页、选择、加载态
src/client/dialog.tsx    删除/清空确认弹窗
src/client/api.ts        HTTP 调用与错误
src/client/locales.ts    zh/en 字典
src/client/styles.ts     面板 CSS（主题 token）
scripts/build-client.mjs 把 Client 打成 __ModuleLoader__ 期望的单文件
dist/                    构建产物（随仓库提交：本地 link 安装直接读这里）
docs/设计.md             设计与决策记录
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
pnpm release patch          # 0.3.0 → 0.3.1（minor / major / 显式版本号同理）
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

如果点击删除后提示「未关闭」，说明会话仍加载在主面板：先切换到其他会话，再回来删除。
这是刻意的安全限制，避免宿主内存中的会话在删除后把日志写回来。

## 已知限制

- 恢复后侧栏行要等下一次会话列表刷新才回来（面板里的列表立刻更新）。
- 仍打开但空闲的会话会显示「未关闭」并禁止删除；请先切换走。
- 只处理已归档会话；未归档的请先归档。
- 回收站是全局的（`~/.dsh/archive-desk`），不跟随项目。
- 彻底删除仅限人工在面板操作，Agent 工具不提供。
- 失效引用只能移除引用，不保证能恢复文件。

## License

MIT © 2026 Lumi Desk
