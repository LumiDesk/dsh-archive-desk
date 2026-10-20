# AGENTS.md

本文件写给在此仓库工作的 AI 代理。用户使用中文沟通。

## 1. 这是什么

`dsh-archive-desk`（归档工作台）是 DeepSeek Harness（DSH）的一个插件：补上「归档」之后缺失的
查看、恢复、回收站、彻底删除能力，并把同一套能力暴露给 Agent。

设计与取舍**只有一个出处**：[docs/设计.md](docs/设计.md)。改行为之前先改它。

## 2. 技术与命令

| 项     | 说明                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 语言   | TypeScript（`strict`），运行时零依赖                                                                                     |
| Host   | `tsc` → `dist/index.js`（ESM，Node 22+）                                                                                 |
| Client | `esbuild` → `dist/client.js`（IIFE 包进 `__ModuleLoader__` 工厂）                                                        |
| 测试   | `node --test` 直接跑 `.ts`（Node 24），零测试框架依赖                                                                    |
| 规范   | Prettier（无分号、单引号、100 列）、ESLint（typescript-eslint）、Commitlint（Conventional Commits）、Husky + lint-staged |

```bash
pnpm install          # 安装依赖，并装好 git hooks
pnpm build            # host + client 都要构建
pnpm typecheck        # 两个 tsconfig 都过一遍
pnpm lint             # eslint
pnpm test             # node --test，会先自动 build
pnpm format           # prettier --write
pnpm release patch    # 发版：校验 → 升版本 → 打 tag → npm publish → 推送 → GitHub Release
```

## 3. 目录

```
src/host/index.ts        Host 入口：HTTP 路由、能力探测、工具注册、启动诊断
src/host/service.ts      业务：列表 / 删除事务 / 恢复 / 清空 / 清理失效引用
src/host/paths.ts        路径解析、id 校验、体积、跨卷保护
src/host/trash.ts        回收站存储（两阶段写入 + 崩溃恢复）
src/host/tool.ts         Agent 工具定义（archived_conversations）
src/host/diagnostics.ts  启动诊断（~/.dsh/archive-desk/last-boot.json）
src/client/index.tsx     侧栏图标 + 管理面板 + 会话菜单项
scripts/build-client.mjs Client 的 IIFE 打包
scripts/release.mjs      发版助手
dist/                    构建产物，**需要提交**：本地 link 安装直接读它
locale/                  界面文案（zh / en）
docs/设计.md             设计与决策的唯一来源
```

## 4. 铁律

1. **未经用户明确同意，不得把本插件安装进任何 DSH profile。** 开发态就是开发态：可以构建、
   可以本地跑检查，但 `plugin_manager install_bundle` / `dsh plugin add` 属于对用户环境的改动，
   必须先问。用户明确说"装"之后才装，装完要报告如何卸载。
2. **不得拿真实会话做破坏性测试。** 会话日志是不可再生数据；需要样本时先复制出测试数据，
   或在用户确认后再操作。
3. **`dist/` 是提交物。** 改了 `src/` 必须 `pnpm build` 并把 `dist/` 一起提交，否则本地
   link 安装会加载旧代码。
4. **按里程碑提交**，不把一堆改动堆到最后。提交信息用 Conventional Commits
   （`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `test:`），Husky 会跑 lint-staged
   和 commitlint。
5. **写状态只走 DSH 注册表 API**（`unarchiveSession` / `detachSession` / `archiveSession` /
   `attachSession`），绝不直接改 `workspace.json`。原因见设计稿 §5.3。
6. **删文件前先动文件、后动状态**（设计稿 §6.2）：文件移动失败等于什么都没发生。

## 5. 版本对齐

运行时基准是 **DSH 0.2.1-rc.2**。`@deepseek-ai/*` 的 npm `latest` 标签指向旧的
`0.0.1-rc.1`，安装类型包时必须显式写版本号，否则拿到的是过期类型。

## 6. 必须遵守的接口形状

这四条都是真机上试出来的，写错会静默失效或直接把所有模型请求打挂。

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

改 `src/client/index.tsx` 后必须 `pnpm build`；页面会通过 `dsh-client-hmr` 收到重建通知，
没有生效就刷新页面。Host 侧改动（`src/host/*`）需要重启 DSH 才会加载新模块。

## 7. 边界

- 不清理 `~/.dsh/attachments`（内容寻址、跨会话共享）。
- 只操作归档集合内的会话；运行中的会话一律跳过。
- Agent 工具不提供彻底删除；不可恢复的操作只由人在面板里做。
- 插件是"用户态"工具：不做账号、网络、遥测。
