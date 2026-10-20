import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import {
  directorySize,
  isSessionId,
  isTrashId,
  isWithin,
  locateSession,
  resolveDshHome,
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
