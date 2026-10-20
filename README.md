# dsh-archive-desk · 归档工作台

> **状态：v0.2.0 · 已在本机 DSH 上验收** — Host 事务、管理面板、回收站、Agent 工具、会话菜单
> 入口全部可用，33 个测试通过；在 DSH 0.2.1-rc.2（Windows，`desktop` profile）上完成了
> 列表 / 删除到回收站 / 恢复 / 彻底删除 / 清理失效引用的真机验收。
> 设计、取舍与风险见 [docs/设计.md](docs/设计.md)。

DeepSeek Harness（DSH）的归档对话管理插件。DSH 只提供「归档」——归档只是把会话 id 藏进
`~/.dsh/storages/workspace.json`，日志仍留在磁盘上，界面上也没有任何删除入口。这个插件补上
后半段：**看得见、恢复得了、删得掉**。

## 能力

| 能力         | 说明                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 归档列表     | 侧栏图标 → 中间整页，分页展示标题、摘要、项目、时间、体积            |
| 批量操作     | 多选 / 全选（当前筛选的全部） / 批量删除                             |
| 回收站       | 删除默认移入 `~/.dsh/archive-desk/trash/`，可恢复；也可直接彻底删除  |
| 失效引用清理 | 指向已不存在会话的归档记录，一键清掉                                 |
| 会话菜单     | 会话「…」菜单里对已归档会话显示「删除」，复用同一个确认弹窗          |
| Agent 工具   | `archived_conversations`：list / delete（进回收站）/ restore / trash |

### 删除的行为

一个会话被删除时，插件按顺序处理：

1. 会话目录移入回收站（或彻底删除）
2. 投影缓存 `storages/session_projcache/sessions/<id>.json` 删除
3. 从所属 workspace 的成员列表里摘掉
4. 从 `archivedSessionIds` 里移除
5. 发出 `api-session/removed`，侧栏即时消失

运行中的会话一律跳过；附件目录 `~/.dsh/attachments` 永不触碰（内容寻址、跨会话共享）。

## 安装

在 DSH 会话中通过 `plugin_manager` 的 `install_bundle` 指向本目录，或 `dsh plugin add`。
安装后出现在「设置 → 插件」，侧栏出现「归档工作台」图标。

## 开发

```bash
pnpm install
pnpm build        # host(tsc) + client(esbuild)，改完 src/ 必须构建
pnpm typecheck
pnpm lint
pnpm test         # node --test，零测试依赖；会先自动 build
pnpm format
```

提交走 Conventional Commits，Husky 在 `pre-commit` 跑 lint-staged、在 `commit-msg` 跑 commitlint。

## 结构

```
src/host/index.ts        Host 入口：HTTP 路由、能力探测、工具注册
src/host/service.ts      业务：列表 / 删除事务 / 恢复 / 清空 / 清理失效引用
src/host/paths.ts        路径解析、id 校验、体积、跨卷保护
src/host/trash.ts        回收站存储（两阶段写入 + 崩溃恢复）
src/host/tool.ts         Agent 工具定义
src/host/diagnostics.ts  启动诊断（~/.dsh/archive-desk/last-boot.json）
src/client/index.tsx     侧栏图标 + 管理面板 + 会话菜单项
scripts/build-client.mjs 把 Client 打成 __ModuleLoader__ 期望的单文件
dist/                    构建产物（提交：本地 link 安装直接读这里）
```

## 验收记录（2026-10-20）

在本机 DSH 0.2.1-rc.2 上逐项跑过，磁盘状态独立核对：

| 场景                  | 结果                                                                           |
| --------------------- | ------------------------------------------------------------------------------ |
| 面板列表              | 23 条归档：2 条真实会话带标题/摘要/项目/体积，21 条失效引用沉底并标灰          |
| 删除到回收站          | 目录移入 `trash/<时间戳-id>/payload`；归档集合少一条；侧栏行消失；投影缓存被清 |
| 回收站                | 条目携带真实标题、体积、删除时间                                               |
| 恢复                  | 目录回到原位、大小不变、重新进入归档集合、回收站清空                           |
| 彻底删除 / 清空回收站 | 面板操作，二次确认 + 知情勾选                                                  |
| 清理失效引用          | 一键移除指向已不存在会话的归档记录（只删引用，不碰文件）                       |
| Agent 工具            | `list` / `delete` / `trash` / `restore` 实测通过；子 agent 调用结果与磁盘一致  |

## 排查

面板不出现时先看 `~/.dsh/archive-desk/last-boot.json`：里面按顺序记录 `apply-start` →
`injected` → `registered` → `tool-registered`，以及每一步可见的 Host 服务；失败会记录
`bind-error` / `tool-error` 和错误文本。

## 已知限制

- 恢复后侧栏行要等下一次会话列表刷新才回来（面板里的列表立刻更新）。
- 只处理已归档会话；未归档的请先归档。
- 回收站是全局的（`~/.dsh/archive-desk`），不跟随项目。
- 彻底删除仅限人工在面板操作，Agent 工具不提供。

## License

MIT © 2026 Lumi Desk
