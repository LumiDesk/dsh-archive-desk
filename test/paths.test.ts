import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import {
  directorySize,
  isSessionId,
  isTrashId,
  isWithin,
  locateSession,
  measureDirectory,
  resolveDshHome,
  scanSessionIndex,
} from '../src/host/paths.ts'

const SESSION_ID = 'session-0dfd3ec8-f8ca-42e2-98aa-35723f06391b'

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

test('session ids reject anything that could address another path', () => {
  assert.equal(isSessionId(SESSION_ID), true)
  assert.equal(isSessionId('session-..'), false)
  assert.equal(isSessionId('../session-abc'), false)
  assert.equal(isSessionId('session-abc/../../etc'), false)
  assert.equal(isSessionId('C:\\Windows'), false)
  assert.equal(isSessionId(''), false)
  assert.equal(isSessionId(undefined), false)
})

test('trash ids stay inside the bin', () => {
  assert.equal(isTrashId('20261020T130501000-session-abc'), true)
  assert.equal(isTrashId('../meta'), false)
  assert.equal(isTrashId('a/b'), false)
})

test('isWithin accepts children only', () => {
  const root = join(tmpdir(), 'root')
  assert.equal(isWithin(root, join(root, 'child')), true)
  assert.equal(isWithin(root, root), false)
  assert.equal(isWithin(root, join(root, '..', 'sibling')), false)
})

test('locateSession finds the session directory in its shard', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-paths-'))
  t.after(() => rm(home, { recursive: true, force: true }))

  const sessionDir = join(home, 'sessions', '--proj--', SESSION_ID)
  await mkdir(sessionDir, { recursive: true })
  await writeFile(join(sessionDir, 'session.v4.jsonl.zstd'), 'log')

  const found = await locateSession(join(home, 'sessions'), SESSION_ID)
  assert.equal(found?.sessionDir, sessionDir)
  assert.equal(found?.shardDir, join(home, 'sessions', '--proj--'))

  assert.equal(await locateSession(join(home, 'sessions'), 'session-missing'), undefined)
  assert.equal(await locateSession(join(home, 'nope'), SESSION_ID), undefined)
})

test('scanSessionIndex finds every session in one pass', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-index-'))
  t.after(() => rm(home, { recursive: true, force: true }))

  const first = join(home, 'sessions', '--a--', SESSION_ID)
  const second = join(home, 'sessions', '--b--', 'session-aaaaaaaa-0000-4000-8000-000000000000')
  await mkdir(first, { recursive: true })
  await mkdir(second, { recursive: true })
  await writeFile(join(first, 'session.v4.jsonl.zstd'), 'log')

  const index = await scanSessionIndex(join(home, 'sessions'))
  assert.equal(index.get(SESSION_ID)?.sessionDir, first)
  assert.equal(index.size, 2)
  assert.equal((await scanSessionIndex(join(home, 'missing'))).size, 0)
})

test('scanSessionIndex ignores a symlinked shard', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-index-link-'))
  t.after(() => rm(home, { recursive: true, force: true }))

  const outside = join(home, 'outside')
  const outsideSession = join(outside, SESSION_ID)
  await mkdir(outsideSession, { recursive: true })
  await mkdir(join(home, 'sessions'), { recursive: true })
  try {
    await symlink(outside, join(home, 'sessions', '--link--'), 'junction')
  } catch {
    t.skip('directory symlinks are not available on this host')
    return
  }

  assert.equal((await scanSessionIndex(join(home, 'sessions'))).size, 0)
  assert.equal(await locateSession(join(home, 'sessions'), SESSION_ID), undefined)
})

test('measureDirectory reports size, mtime and existence', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-measure-'))
  t.after(() => rm(home, { recursive: true, force: true }))
  await writeFile(join(home, 'a.bin'), Buffer.alloc(10))

  const measurement = await measureDirectory(home)
  assert.equal(measurement.sizeBytes, 10)
  assert.equal(measurement.exists, true)
  assert.equal(measurement.mtimeMs > 0, true)
  assert.deepEqual(await measureDirectory(join(home, 'missing')), {
    sizeBytes: 0,
    mtimeMs: 0,
    exists: false,
  })
})

test('directorySize sums nested files', async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'archive-desk-size-'))
  t.after(() => rm(home, { recursive: true, force: true }))

  await mkdir(join(home, 'nested'), { recursive: true })
  await writeFile(join(home, 'a.bin'), Buffer.alloc(10))
  await writeFile(join(home, 'nested', 'b.bin'), Buffer.alloc(15))

  assert.equal(await directorySize(home), 25)
  assert.equal(await directorySize(join(home, 'missing')), 0)
  assert.equal(await exists(join(home, 'nested', 'b.bin')), true)
})

test('resolveDshHome prefers DSH_HOME', () => {
  assert.equal(resolveDshHome({ DSH_HOME: 'D:\\custom\\dsh' }), resolve('D:\\custom\\dsh'))
  assert.match(resolveDshHome({}), /\.dsh$/)
})
