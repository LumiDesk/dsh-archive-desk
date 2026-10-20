# AGENTS.md

本文件写给在此仓库工作的 AI 代理。用户使用中文沟通。

## 1. 这是什么

`dsh-archive-desk`（归档工作台）是 DeepSeek Harness（DSH）的一个插件：补上「归档」之后缺失的
查看、恢复、回收站、彻底删除能力，并把同一套能力暴露给 Agent。

设计与取舍**只有一个出处**：[docs/设计.md](docs/设计.md)。改行为之前先改它。

## 2. 技术与命令

| 项     | 说明                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 语言   | TypeScript（`strict`），无 TS 的运行时依赖                                                                               |
| Host   | `tsc` → `dist/index.js`（ESM，Node 22+）                                                                                 |
| Client | `esbuild` → `dist/client.js`（IIFE 包进 `__ModuleLoader__` 工厂）                                                        |
| 规范   | Prettier（无分号、单引号、100 列）、ESLint（typescript-eslint）、Commitlint（Conventional Commits）、Husky + lint-staged |

```bash
pnpm install          # 安装依赖，并装好 git hooks
pnpm build            # host + client 都要构建
pnpm typecheck        # 两个 tsconfig 都过一遍
pnpm lint             # eslint
pnpm format           # prettier --write
```

## 3. 目录

```
src/host/index.ts     Host 入口（apply / 能力探测 / RPC 通道）
src/client/index.tsx  Client 入口（面板注册点，目前为空）
scripts/              构建脚本（client 的 IIFE 包装在这里）
dist/                 构建产物，**需要提交**：本地 link 安装直接读它
locale/               插件元数据与界面文案
docs/设计.md          设计与决策的唯一来源
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

## 6. 工具 schema 的坑（踩过两次，把整个 Agent 锁死过）

`ctx.tools.register()` 收的是 **编译后的 JSON Schema**，不是 `defineTool` 那种属性表：

```ts
parameters: {
  type: 'object',
  additionalProperties: false,
  required: ['action'],          // 必须是数组，放在顶层
  properties: {
    action: { type: 'string', enum: [...] },   // 属性里不能出现 required: true
  },
}
```

两种错误写法都会让**每一次**模型请求被服务端拒绝：

| 写法                      | 报错                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| 属性级 `required: true`   | `true is not of type "array"`                                     |
| 直接给属性表（无 `type`） | `schema must be a JSON Schema of type "object", got "type: null"` |

改完 schema 必须跑 `test/tool.test.ts`：它用宿主自己的 `assertSupportedJsonSchema`
（devDependency `@deepseek-ai/dsh-tools`）校验参数与输出 schema，这一步通过才算安全。

## 7. 边界

- 不清理 `~/.dsh/attachments`（内容寻址、跨会话共享）。
- 只操作归档集合内的会话；运行中的会话一律跳过。
- 插件是"用户态"工具：不做账号、网络、遥测。
