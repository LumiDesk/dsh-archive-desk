import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { ArchiveDeskError } from '../src/host/paths.ts'
import { TrashStore, makeTrashId } from '../src/host/trash.ts'

const SESSION_ID = 'session-5f0f9965-5f29-40a4-bc1c-2348cfcf7889'
const NOW = new Date('2026-10-20T05:30:00.000Z')

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function fixture() {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-trash-'))
  const sessionDir = join(home, 'sessions', '--proj--', SESSION_ID)
  await mkdir(sessionDir, { recursive: true })
  await writeFile(join(sessionDir, 'session.v4.jsonl.zstd'), Buffer.alloc(42))
  const store = new TrashStore(join(home, 'archive-desk', 'trash'), join(home, 'sessions'))
  return { home, sessionDir, store }
}

function input(sessionDir: string) {
  return {
    sessionDir,
    sessionId: SESSION_ID,
    title: '论文提纲',
    snippet: '把 arxiv 那篇的提纲整理成…',
    cwd: 'D:\\Projects\\TestSpace',
    workspaceTitle: 'TestSpace',
    sizeBytes: 42,
    detachedFromWorkspace: true,
    wasArchived: true,
    now: NOW,
  }
}

test('trash ids keep the timestamp, a random suffix and the session id', () => {
  const first = makeTrashId(SESSION_ID, NOW)
  const second = makeTrashId(SESSION_ID, NOW)
  assert.match(first, /^20261020T053000000-[0-9a-f]{8}-session-5f0f9965/)
  assert.notEqual(first, second)
})

test('create moves the session into the bin and lists it', async (t) => {
  const { home, sessionDir, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const meta = await store.create(input(sessionDir))

  assert.equal(meta.phase, 'ready')
  assert.equal(await exists(sessionDir), false)
  assert.equal(await exists(join(store.root, meta.trashId, 'payload')), true)

  const onDisk = JSON.parse(
    await readFile(join(store.root, meta.trashId, 'meta.json'), 'utf8'),
  ) as { phase: string }
  assert.equal(onDisk.phase, 'ready')

  const entries = await store.list()
  assert.deepEqual(
    entries.map((entry) => entry.sessionId),
    [SESSION_ID],
  )
  assert.equal(entries[0]?.title, '论文提纲')
})

test('restore moves the payload back and keeps the entry until discard', async (t) => {
  const { home, sessionDir, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const meta = await store.create(input(sessionDir))
  const restored = await store.restore(meta.trashId)

  assert.equal(restored.sessionId, SESSION_ID)
  assert.equal(await exists(sessionDir), true)
  assert.equal(await exists(join(store.root, meta.trashId)), true)
  assert.equal((await store.listEntries())[0]?.reason, 'payload')

  await store.discard(meta.trashId)
  assert.equal(await exists(join(store.root, meta.trashId)), false)
  assert.deepEqual(await store.list(), [])
})

test('rollback returns a failed restore to the bin', async (t) => {
  const { home, sessionDir, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const meta = await store.create(input(sessionDir))
  await store.restore(meta.trashId)
  assert.equal(await exists(sessionDir), true)

  assert.equal(await store.rollback(meta.trashId, meta), true)
  assert.equal(await exists(sessionDir), false)
  assert.deepEqual(
    (await store.list()).map((entry) => entry.trashId),
    [meta.trashId],
  )
})

test('restore refuses to overwrite an existing session directory', async (t) => {
  const { home, sessionDir, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const meta = await store.create(input(sessionDir))
  await mkdir(sessionDir, { recursive: true })

  await assert.rejects(store.restore(meta.trashId), (error: unknown) => {
    assert.equal(error instanceof ArchiveDeskError, true)
    assert.equal((error as ArchiveDeskError).code, 'archive/restore-conflict')
    return true
  })
})

test('restore refuses a stored target outside the sessions root', async (t) => {
  const { home, sessionDir, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const meta = await store.create(input(sessionDir))
  await writeFile(
    join(store.root, meta.trashId, 'meta.json'),
    JSON.stringify({ ...meta, originalPath: join(home, 'elsewhere', SESSION_ID) }),
    'utf8',
  )

  await assert.rejects(store.restore(meta.trashId), (error: unknown) => {
    assert.equal(error instanceof ArchiveDeskError, true)
    assert.equal((error as ArchiveDeskError).code, 'archive/trash-corrupt')
    return true
  })
})

test('purge removes the entry and reports the freed bytes', async (t) => {
  const { home, sessionDir, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))

  const meta = await store.create(input(sessionDir))
  const freed = await store.purge(meta.trashId)

  assert.equal(freed, 42)
  assert.equal(await exists(join(store.root, meta.trashId)), false)
  assert.deepEqual(await store.list(), [])
})

test('listEntries keeps corrupt entries visible', async (t) => {
  const { home, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))
  await store.ensure()

  const noMeta = '20261020T053000000-aaaaaaaa-session-aaaaaaaa-0000-4000-8000-000000000000'
  await mkdir(join(store.root, noMeta), { recursive: true })
  const noPayload = '20261020T053100000-bbbbbbbb-session-bbbbbbbb-0000-4000-8000-000000000000'
  await mkdir(join(store.root, noPayload, 'payload'), { recursive: true })
  await writeFile(
    join(store.root, noPayload, 'meta.json'),
    JSON.stringify({
      schema: 1,
      phase: 'ready',
      trashId: noPayload,
      sessionId: 'session-bbbbbbbb-0000-4000-8000-000000000000',
      title: 'broken',
      snippet: '',
      originalPath: join(home, 'sessions', '--x--', 'session-bbbbbbbb-0000-4000-8000-000000000000'),
      movedAt: NOW.toISOString(),
      sizeBytes: 0,
      detachedFromWorkspace: false,
      wasArchived: true,
    }),
    'utf8',
  )
  await rm(join(store.root, noPayload, 'payload'), { recursive: true, force: true })

  const entries = await store.listEntries()
  assert.deepEqual(
    entries.map((entry) => [entry.trashId, entry.status, entry.reason]),
    [
      [noPayload, 'corrupt', 'payload'],
      [noMeta, 'corrupt', 'metadata'],
    ],
  )
})

test('recover finalizes an interrupted move and drops an empty one', async (t) => {
  const { home, store } = await fixture()
  t.after(() => rm(home, { recursive: true, force: true }))
  await store.ensure()

  const finished = '20261020T053000000-aaaaaaaa-session-aaaaaaaa-0000-4000-8000-000000000000'
  await mkdir(join(store.root, finished, 'payload'), { recursive: true })
  await writeFile(
    join(store.root, finished, 'meta.json'),
    JSON.stringify({
      schema: 1,
      phase: 'moving',
      trashId: finished,
      sessionId: 'session-aaaaaaaa-0000-4000-8000-000000000000',
      title: 'interrupted',
      snippet: '',
      originalPath: join(home, 'sessions', '--x--', 'session-aaaaaaaa-0000-4000-8000-000000000000'),
      movedAt: NOW.toISOString(),
      sizeBytes: 0,
      detachedFromWorkspace: false,
      wasArchived: true,
    }),
    'utf8',
  )

  const empty = '20261020T053100000-bbbbbbbb-session-bbbbbbbb-0000-4000-8000-000000000000'
  await mkdir(join(store.root, empty), { recursive: true })
  await writeFile(
    join(store.root, empty, 'meta.json'),
    JSON.stringify({
      schema: 1,
      phase: 'moving',
      trashId: empty,
      sessionId: 'session-bbbbbbbb-0000-4000-8000-000000000000',
      title: 'empty',
      snippet: '',
      originalPath: join(home, 'sessions', '--x--', 'session-bbbbbbbb-0000-4000-8000-000000000000'),
      movedAt: NOW.toISOString(),
      sizeBytes: 0,
      detachedFromWorkspace: false,
      wasArchived: true,
    }),
    'utf8',
  )

  const report = await store.recover()
  assert.deepEqual(report.recovered, [finished])
  assert.deepEqual(report.dropped, [empty])
  assert.equal(await exists(join(store.root, empty)), false)

  const entries = await store.list()
  assert.deepEqual(
    entries.map((entry) => entry.trashId),
    [finished],
  )
})
