# AGENTS.md

本文件写给在此仓库工作的 AI 代理。用户使用中文沟通。

## 1. 这是什么

`dsh-archive-desk`（归档工作台）是 DeepSeek Harness（DSH）的一个插件：补上「归档」之后缺失的
查看、恢复、回收站、彻底删除能力，并把同一套能力暴露给 Agent。

当前版本 **1.0.0**：Host 只用 `workspace/session-activity` 判定「运行中」，列表走路径索引 + 摘要缓存；
Client 基于 DSH UI primitives 重做，回收站支持分页/批量/损坏条目，并支持行内/批量的「取消归档」；
插件**没有配置项**。删除前会先停掉会话残留的活动，因此「加载在内存」不阻止删除。

设计与取舍**只有一个出处**：[docs/设计.md](docs/设计.md)。改行为之前先改它。

## 2. 技术与命令

| 项     | 说明                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 语言   | TypeScript（`strict`），运行时零依赖                                                                                     |
| Host   | `tsc` → `dist/index.js`（ESM，Node 22+）                                                                                 |
| Client | `esbuild` → `dist/client.js`（IIFE 包进 `__ModuleLoader__` 工厂，minify）                                                |
| UI     | `@deepseek-ai/dsh-client-ui-primitives` 作为 external 从页面模块表取，不打包                                             |
| 测试   | `node --test` 直接跑 `.ts`（Node 24），零测试框架依赖，目前 50 个用例                                                    |
| 规范   | Prettier（无分号、单引号、100 列）、ESLint（typescript-eslint）、Commitlint（Conventional Commits）、Husky + lint-staged |

```bash
pnpm install          # 安装依赖，并装好 git hooks
pnpm build            # host + client 都要构建
pnpm typecheck        # host / client / test 三个 tsconfig 都过一遍
pnpm lint             # eslint
pnpm test             # node --test，会先自动 build
pnpm format           # prettier --write
pnpm release patch    # 发版：校验 → 升版本 → 打 tag → npm publish → 推送 → GitHub Release
```

## 3. 目录

```
src/host/index.ts        Host 入口：HTTP 路由、能力探测、工具注册、启动诊断
src/host/service.ts      业务：列表 / 取消归档 / 删除事务 / 恢复 / 清空 / 清理失效引用
src/host/paths.ts        路径解析、id 校验、体积/指纹、跨卷与 symlink 保护
src/host/cache.ts        列表摘要缓存（~/.dsh/archive-desk/summaries.json）
src/host/trash.ts        回收站存储（两阶段写入 + 恢复事务 + 损坏条目）
src/host/tool.ts         Agent 工具定义（archived_conversations）
src/host/diagnostics.ts  启动诊断（~/.dsh/archive-desk/last-boot.json）
src/client/index.tsx     槽位注册、字典、样式注入、会话菜单项
src/client/page.tsx      管理页：Tabs、表格、分页、选择、加载态
src/client/dialog.tsx    确认弹窗
src/client/api.ts        HTTP 调用与错误
src/client/locales.ts    zh / en 字典
src/client/styles.ts     面板 CSS（主题 token）
src/client/tsconfig.json 让编辑器按 DOM/JSX 解析 client 文件
test/tsconfig.json       测试文件的 TS 项目（pnpm typecheck 会跑）
scripts/build-client.mjs Client 的 IIFE 打包（primitives 保持 external）
scripts/release.mjs      发版助手
dist/                    构建产物，**不入库**：安装/发布前必须 pnpm build
locale/                  插件目录元数据（zh / en）
docs/设计.md             设计与决策的唯一来源
```

## 4. 铁律

1. **未经用户明确同意，不得把本插件安装进任何 DSH profile。** 开发态就是开发态：可以构建、
   可以本地跑检查，但 `plugin_manager install_bundle` / `dsh plugin add` 属于对用户环境的改动，
   必须先问。用户明确说"装"之后才装，装完要报告如何卸载。
2. **不得拿真实会话做破坏性测试。** 会话日志是不可再生数据；需要样本时先复制出测试数据，
   或在用户确认后再操作。
3. **`dist/` 是构建产物，不入库。** 改了 `src/` 必须 `pnpm build`；本地 file/link 安装会直接
   读工作区的 `dist/`，安装前没构建就会加载旧代码。发布由 `prepublishOnly` 重新构建。
4. **按里程碑提交**，不把一堆改动堆到最后。提交信息用 Conventional Commits
   （`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`），Husky 会跑 lint-staged
   和 commitlint。
5. **写状态只走 DSH 注册表 API**（`unarchiveSession` / `detachSession` / `archiveSession` /
   `attachSession`），绝不直接改 `workspace.json`。原因见设计稿 §5.3。
6. **删文件前先动文件、后动状态**（设计稿 §6.2）：文件移动失败等于什么都没发生。
7. **「运行中」只认 `workspace/session-activity`。** 它聚合 turn、job、定时任务和子 Agent，是宿主
   唯一能证明「有活在跑」的信号。`ctx.sessions.get(id)` 只表示会话加载进了宿主进程内存——那是
   进程级注册表，看过的会话会一直留着，归档也不卸载，所以它既不代表用户还开着，也不代表在运行，
   **不得**用它判断运行中或阻止删除。删一个加载在内存里的会话时，先 emit
   `workspace/session-stop` 停掉残留活动（设计稿 §6.2 第 0 步）。
8. **不做插件配置。** 不引 `settings.json`、`getSettings/setSettings`、`cordis.patch.yml`
   的 `config`。安全边界用常量固定；每页条数/排序只是页面可见控件，不持久化。
9. **UI primitives 保持 external。** `@deepseek-ai/dsh-client-ui-primitives` 从页面模块表取，
   在 `dsh.client.external` 声明、esbuild external；不要把第二份 React/组件打进 `dist/client.js`。

### 4.1 本机开发/验收循环（desktop profile）

这个仓库的日常节奏是「npm 版」与「link 开发版」交替。每一步安装/卸载仍然要先得到用户
的明确要求，不要自行改 profile。

1. **开发前卸载 npm 版**：
   ```powershell
   dsh plugin --profile desktop remove dsh-archive-desk
   ```
   如果 `node_modules\dsh-archive-desk` 还残留 symlink，只删除这个链接，不要碰仓库目录。
2. **开发并构建**：
   ```powershell
   pnpm build
   ```
3. **安装 link 开发版**：
   ```powershell
   dsh plugin --profile desktop add <仓库绝对路径>
   ```
4. **重启 DSH** 加载 Host 侧改动；纯 Client 改动通常刷新页面即可。
5. **用户验收**。通过后由用户自己执行 `pnpm release ...` 发布；Agent 不代为发布。
6. **发布后切回 npm 版**：先移除 link 开发版，再安装
   `dsh plugin --profile desktop add dsh-archive-desk@<新版本>`。

## 5. 版本对齐

运行时基准是 **DSH 0.2.1-rc.2**。`@deepseek-ai/*` 的 npm `latest` 标签指向旧的
`0.0.1-rc.1`，安装类型包时必须显式写版本号，否则拿到的是过期类型。

## 6. 必须遵守的接口形状

下面几条都是真机上试出来的，写错会静默失效或直接把所有模型请求打挂。

### 6.1 工具 schema 是编译后的 JSON Schema

`ctx.tools.register()` 收的是**编译后的对象**，不是 `defineTool` 的属性表：

```ts
parameters: {
  type: 'object',
  additionalProperties: false,
  required: ['action'],          // 必须放在顶层，且是数组
  properties: {
    action: { type: 'string', enum: [...] },   // 属性里不能出现 required: true
  },
}
```

属性级 `required: true` 会让服务端报 `true is not of type "array"`；只给属性表会报
`schema must be a JSON Schema of type "object", got "type: null"`。两种都会让**每一次**模型
请求被拒。改完 schema 必须跑 `test/tool.test.ts`：它用宿主自己的 `assertSupportedJsonSchema`
（devDependency `@deepseek-ai/dsh-tools`）校验参数与输出 schema。

工具返回值必须是**无损 JSON**：`undefined` 字段、`NaN` 会让工具层报
`value is not lossless JSON`。可选字段用条件展开，最后再统一做一次 JSON 往返兜底。

### 6.2 用 `ctx.inject`，不要写静态 `inject`

Cordis 会把静态 `export const inject = { optional: [...] }` 的键当成服务名，插件会静默不激活。
需要延迟获取服务时用 `ctx.inject(['webServer', 'connection'], (ctx) => ...)`，并且把用到的服务
一次列全——`webServer` 注册的路由在请求时还需要 `connection` 做鉴权。

### 6.3 `sessionQuery` 的公开方法是 `readSession`

`load()` 是内部 corpus 的方法，公开服务上没有。正确调用与返回形状：

```ts
const { session, events } = await ctx.sessionQuery.readSession(id) // header 在 `session` 下
```

### 6.4 Client 改动要重新构建

改 `src/client/**` 后必须 `pnpm build`；页面会通过 `dsh-client-hmr` 收到重建通知，
没有生效就刷新页面。Host 侧改动（`src/host/*`）需要重启 DSH 才会加载新模块。

### 6.5 UI primitives 只有本地类型声明

`@deepseek-ai/dsh-client-ui-primitives` 是页面自带的平台 seed 模块，没有给第三方插件用的
npm 类型包。`src/client/primitives.d.ts` 只声明实际用到的组件；新增组件时同步补声明，
不要退化成 `any`。它必须同时出现在 `scripts/build-client.mjs` 的 `external` 和
`package.json` 的 `dsh.client.external` 里。

### 6.6 状态语义

- `running`：`workspace/session-activity` 非空（turn / job / 定时任务 / 子 Agent）；
- `missing`：归档 id 存在但目录不在；
- `ok`：目录存在、宿主没有活动。

状态里没有「已加载/未关闭」：「加载在内存」是进程级注册表，不是用户可见状态。删除预检和列表状态
必须用同一个判定（都只看活动瀑布），不要在 Client 里另写一套。

## 7. 边界

- 不清理 `~/.dsh/attachments`（内容寻址、跨会话共享）。
- 只操作归档集合内的会话；有活动在跑的会话先停活动再删，停不下来则跳过。
- Agent 工具不提供彻底删除；不可恢复的操作只由人在面板里做。
- 插件是"用户态"工具：不做账号、网络、遥测。
- 不做插件配置；不新增 `settings.json` 或配置页。
- 测试不碰真实会话：需要样本时复制到临时 `DSH_HOME`，或先征得用户同意。
