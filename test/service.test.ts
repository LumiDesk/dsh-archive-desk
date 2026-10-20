import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  ArchiveDeskService,
  snippetFromEvents,
  titleFromEvents,
  type SessionEventLike,
} from '../src/host/service.ts'

const PRESENT = 'session-11111111-1111-4111-8111-111111111111'
const MISSING = 'session-22222222-2222-4222-8222-222222222222'

const events: SessionEventLike[] = [
  {
    type: 'user/message',
    time: 1_000,
    data: { source: { kind: 'user' }, content: [{ type: 'text', text: '帮我把归档对话删掉' }] },
  },
  { type: 'assistant/message', time: 1_100, data: { role: 'assistant', content: [] } },
  { type: 'session/title', time: 1_200, data: { title: '归档清理' } },
]

test('title comes from the latest session/title event', () => {
  assert.equal(titleFromEvents(events), '归档清理')
  assert.equal(titleFromEvents([]), undefined)
  assert.equal(
    titleFromEvents([{ type: 'session/title', data: { title: '  ' } }, ...events]),
    '归档清理',
  )
})

test('snippet takes the first user-authored text only', () => {
  assert.equal(snippetFromEvents(events), '帮我把归档对话删掉')
  assert.equal(
    snippetFromEvents([
      {
        type: 'user/message',
        data: { source: { kind: 'command' }, content: [{ type: 'text', text: 'ignored' }] },
      },
    ]),
    '',
  )
})

async function fixture() {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-service-'))
  const sessionDir = join(home, 'sessions', '--proj--', PRESENT)
  await mkdir(sessionDir, { recursive: true })
  await writeFile(join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.alloc(42))

  const service = new ArchiveDeskService({
    home,
    registry: {
      archivedSessionIds: [PRESENT, MISSING],
      list: () => [
        { id: 'ws-1', title: 'TestSpace', path: 'D:\\Projects\\TestSpace', sessionIds: [PRESENT] },
      ],
    },
    sessionQuery: {
      load: async (id: string) => {
        if (id !== PRESENT) throw new Error('not found')
        return { header: { id, createdAt: 900, cwd: 'D:\\Projects\\TestSpace' }, events }
      },
    },
  })

  return { home, sessionDir, service }
}

test('list describes present and dangling sessions', async (t) => {
  const { home, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const result = await service.list()

  assert.equal(result.total, 2)
  assert.equal(result.totalBytes, 42)
  assert.equal(result.items[0]?.id, PRESENT)
  assert.equal(result.items[0]?.title, '归档清理')
  assert.equal(result.items[0]?.snippet, '帮我把归档对话删掉')
  assert.equal(result.items[0]?.workspaceTitle, 'TestSpace')
  assert.equal(result.items[0]?.sizeBytes, 42)
  assert.equal(result.items[0]?.status, 'ok')
  assert.equal(result.items[0]?.updatedAt, 1_200)

  const dangling = result.items.find((item) => item.id === MISSING)
  assert.equal(dangling?.status, 'missing')
  assert.equal(dangling?.sizeBytes, 0)
  assert.equal(dangling?.snippet, '')
})

test('list filters, sorts newest first and paginates', async (t) => {
  const { home, service } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  assert.equal((await service.list({ query: '归档' })).total, 1)
  assert.equal((await service.list({ query: 'nothing-matches' })).total, 0)

  const page = await service.list({ offset: 1, limit: 1 })
  assert.equal(page.total, 2)
  assert.equal(page.items.length, 1)
  assert.equal(page.items[0]?.id, MISSING)
})

test('list marks a live session and refuses an oversized page', async (t) => {
  const { home } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const service = new ArchiveDeskService({
    home,
    registry: { archivedSessionIds: [PRESENT], list: () => [] },
    isLive: () => true,
  })

  const result = await service.list({ limit: 10_000 })
  assert.equal(result.items[0]?.status, 'live')
  assert.equal(result.limit, 100)
})
