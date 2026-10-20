import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { ArchiveDeskService, type WorkspaceRegistryLike } from '../src/host/service.ts'

const PRESENT = 'session-33333333-3333-4333-8333-333333333333'
const ABSENT = 'session-44444444-4444-4444-8444-444444444444'
const TITLED = '归档清理'
const NOW = new Date('2026-10-20T05:30:00.000Z')

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

interface FakeWorkspace {
  id: string
  title: string
  path: string
  sessionIds: string[]
  detachSession(sessionId: string): Promise<void>
  attachSession(sessionId: string): Promise<void>
}

function makeRegistry(archived: string[], workspace: FakeWorkspace): WorkspaceRegistryLike {
  const set = new Set(archived)
  return {
    get archivedSessionIds() {
      return [...set]
    },
    list: () => [workspace],
    async unarchiveSession(sessionId) {
      set.delete(sessionId)
    },
    async archiveSession(sessionId) {
      set.add(sessionId)
    },
  }
}

async function fixture(options: { live?: boolean } = {}) {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-tx-'))
  const sessionDir = join(home, 'sessions', '--proj--', PRESENT)
  await mkdir(sessionDir, { recursive: true })
  await writeFile(join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.alloc(42))

  const cacheDir = join(home, 'storages', 'session_projcache', 'sessions')
  await mkdir(cacheDir, { recursive: true })
  await writeFile(join(cacheDir, `${PRESENT}.json`), '{}')

  const workspace: FakeWorkspace = {
    id: 'ws-1',
    title: 'TestSpace',
    path: 'D:\\Projects\\TestSpace',
    sessionIds: [PRESENT],
    async detachSession(sessionId) {
      this.sessionIds = this.sessionIds.filter((id) => id !== sessionId)
    },
    async attachSession(sessionId) {
      if (!this.sessionIds.includes(sessionId)) this.sessionIds.unshift(sessionId)
    },
  }

  const registry = makeRegistry([PRESENT, ABSENT], workspace)
  const removed: string[] = []
  const service = new ArchiveDeskService({
    home,
    registry,
    sessionQuery: {
      load: async (id: string) => ({
        header: { id, createdAt: 900, cwd: 'D:\\Projects\\TestSpace' },
        events: [
          {
            type: 'user/message',
            time: 1_000,
            data: {
              source: { kind: 'user' },
              content: [{ type: 'text', text: '帮我把归档对话删掉' }],
            },
          },
          { type: 'session/title', time: 1_200, data: { title: TITLED } },
        ],
      }),
    },
    isLive: () => options.live === true,
    emitRemoved: (id) => removed.push(id),
    now: () => NOW,
  })

  return { home, sessionDir, workspace, registry, removed, service }
}

test('trash delete moves the session, drops every reference and announces it', async (t) => {
  const { home, sessionDir, workspace, registry, removed, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const result = await service.delete({ ids: [PRESENT], mode: 'trash' })

  assert.deepEqual(result.deleted, [PRESENT])
  assert.equal(result.freedBytes, 42)
  assert.equal(await exists(sessionDir), false)
  assert.equal(registry.archivedSessionIds.includes(PRESENT), false)
  assert.deepEqual(workspace.sessionIds, [])
  assert.deepEqual(removed, [PRESENT])
  assert.equal(
    await exists(join(home, 'storages', 'session_projcache', 'sessions', `${PRESENT}.json`)),
    false,
  )

  const entries = await service.listTrash()
  assert.equal(entries.length, 1)
  assert.equal(entries[0]?.title, TITLED)
  assert.equal(entries[0]?.sizeBytes, 42)
  assert.equal(entries[0]?.originalPath, sessionDir)
})

test('purge delete removes the directory without a bin entry', async (t) => {
  const { home, sessionDir, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const result = await service.delete({ ids: [PRESENT], mode: 'purge' })

  assert.deepEqual(result.deleted, [PRESENT])
  assert.equal(await exists(sessionDir), false)
  assert.deepEqual(await service.listTrash(), [])
})

test('delete skips live sessions and unarchived ids', async (t) => {
  const live = await fixture({ live: true })
  t.after(() => rm(live.home, { recursive: true, force: true }))

  const liveResult = await live.service.delete({ ids: [PRESENT] })
  assert.deepEqual(liveResult.deleted, [])
  assert.deepEqual(liveResult.skipped, [{ id: PRESENT, reason: 'archive/live-session' }])
  assert.equal(await exists(live.sessionDir), true)

  const idle = await fixture()
  t.after(() => rm(idle.home, { recursive: true, force: true }))
  const unknownResult = await idle.service.delete({
    ids: ['session-55555555-5555-4555-8555-555555555555'],
  })
  assert.deepEqual(unknownResult.skipped, [
    { id: 'session-55555555-5555-4555-8555-555555555555', reason: 'archive/not-archived' },
  ])
})

test('restore puts the session back and re-archives it', async (t) => {
  const { home, sessionDir, workspace, registry, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  await service.delete({ ids: [PRESENT], mode: 'trash' })
  const [entry] = await service.listTrash()
  assert.ok(entry)

  const result = await service.restore({ trashIds: [entry.trashId] })

  assert.deepEqual(result.restored, [entry.trashId])
  assert.equal(await exists(sessionDir), true)
  assert.equal(registry.archivedSessionIds.includes(PRESENT), true)
  assert.deepEqual(workspace.sessionIds, [PRESENT])
  assert.deepEqual(await service.listTrash(), [])
})

test('emptyTrash purges every entry and reports the freed bytes', async (t) => {
  const { home, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  await service.delete({ ids: [PRESENT], mode: 'trash' })
  const result = await service.emptyTrash()

  assert.equal(result.purged.length, 1)
  assert.equal(result.freedBytes, 42)
  assert.deepEqual(await service.listTrash(), [])
})

test('cleanDangling drops references whose directory is gone', async (t) => {
  const { home, registry, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const result = await service.cleanDangling()

  assert.deepEqual(result.removed, [ABSENT])
  assert.equal(registry.archivedSessionIds.includes(ABSENT), false)
  assert.equal(registry.archivedSessionIds.includes(PRESENT), true)
})
