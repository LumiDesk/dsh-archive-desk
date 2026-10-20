/**
 * The recycle bin: a trash entry is a directory holding `meta.json` plus the
 * moved session directory as `payload/`.
 *
 * There is no index file. The bin is its own source of truth, so a crash can
 * only leave one entry in a recoverable `moving` phase, never a stale pointer.
 *
 * Restore is split into three steps so the service can re-archive the session
 * before the entry disappears:
 *
 * 1. `restore()` moves `payload/` back and returns its metadata, keeping the
 *    entry in place.
 * 2. The service re-archives the session.
 * 3. `discard()` removes the entry, or `rollback()` moves the payload back when
 *    step 2 failed.
 *
 * @see docs/设计.md §5.2, §6.2, §6.5, §6.6
 */
import { lstat, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'

import { ArchiveDeskError, assertSameVolume, directorySize, isTrashId, isWithin } from './paths.ts'

export interface TrashMeta {
  schema: 1
  phase: 'moving' | 'ready'
  trashId: string
  sessionId: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  /** Absolute path the session directory is restored to. */
  originalPath: string
  movedAt: string
  sizeBytes: number
  detachedFromWorkspace: boolean
  wasArchived: boolean
}

export interface CreateTrashInput {
  sessionDir: string
  sessionId: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  sizeBytes: number
  detachedFromWorkspace: boolean
  wasArchived: boolean
  now?: Date
}

export interface RecoveryReport {
  /** `moving` entries whose payload survived: finalized as `ready`. */
  recovered: string[]
  /** `moving` entries with no payload: removed. */
  dropped: string[]
  /** Entries whose metadata or payload is unreadable: left untouched. */
  corrupt: string[]
}

export type TrashStatus = 'ready' | 'corrupt'

export type TrashCorruption = 'metadata' | 'payload' | 'interrupted'

/** One bin row: a restorable entry, or a broken entry that can only be removed. */
export interface TrashEntry {
  trashId: string
  status: TrashStatus
  sessionId?: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  originalPath?: string
  movedAt?: string
  sizeBytes: number
  reason?: TrashCorruption
  /** Full metadata for ready entries; absent on corrupt ones. */
  meta?: TrashMeta
}

const META_FILE = 'meta.json'
const PAYLOAD_DIR = 'payload'
const MAX_CREATE_ATTEMPTS = 4

/** `<timestamp>-<random>-<session id>`; filesystem-safe and collision-resistant. */
export function makeTrashId(sessionId: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:.]/g, '').replace('Z', '')
  return `${stamp}-${randomUUID().slice(0, 8)}-${sessionId}`
}

async function readMeta(entryDir: string): Promise<TrashMeta | undefined> {
  try {
    const raw = await readFile(join(entryDir, META_FILE), 'utf8')
    const parsed = JSON.parse(raw) as TrashMeta
    return parsed.schema === 1 && typeof parsed.sessionId === 'string' ? parsed : undefined
  } catch {
    return undefined
  }
}

async function writeMeta(entryDir: string, meta: TrashMeta): Promise<void> {
  const target = join(entryDir, META_FILE)
  const temporary = `${target}.tmp-${randomUUID().slice(0, 8)}`
  await writeFile(temporary, JSON.stringify(meta, null, 2), 'utf8')
  await rename(temporary, target)
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const entry = await lstat(path)
    return entry.isDirectory() && !entry.isSymbolicLink()
  } catch {
    return false
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function entryOf(trashId: string, meta: TrashMeta): TrashEntry {
  return {
    trashId,
    status: 'ready',
    sessionId: meta.sessionId,
    title: meta.title,
    snippet: meta.snippet,
    ...(meta.cwd === undefined ? {} : { cwd: meta.cwd }),
    ...(meta.workspaceId === undefined ? {} : { workspaceId: meta.workspaceId }),
    ...(meta.workspaceTitle === undefined ? {} : { workspaceTitle: meta.workspaceTitle }),
    originalPath: meta.originalPath,
    movedAt: meta.movedAt,
    sizeBytes: meta.sizeBytes,
    meta,
  }
}

/**
 * One bin directory. Every method takes the trash id, never a path, so a
 * caller cannot address anything outside the bin.
 */
export class TrashStore {
  readonly root: string
  /** Sessions root used to validate a stored `originalPath` before restoring. */
  readonly sessionsRoot: string

  constructor(root: string, sessionsRoot: string) {
    this.root = resolve(root)
    this.sessionsRoot = resolve(sessionsRoot)
  }

  async ensure(): Promise<void> {
    await mkdir(this.root, { recursive: true })
  }

  /**
   * Move a session directory into the bin.
   *
   * Order matters: metadata is written first (`moving`), then the directory is
   * renamed, then the metadata flips to `ready`. A crash at any point leaves a
   * state `recover()` can finish or undo. The entry directory is created
   * exclusively so a colliding id can never overwrite an existing payload.
   */
  async create(input: CreateTrashInput): Promise<TrashMeta> {
    const now = input.now ?? new Date()
    const originalPath = resolve(input.sessionDir)
    assertSameVolume(originalPath, this.root)
    await this.ensure()

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      const trashId = makeTrashId(input.sessionId, now)
      const entryDir = join(this.root, trashId)
      try {
        await mkdir(entryDir)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') continue
        throw error
      }

      const payloadDir = join(entryDir, PAYLOAD_DIR)
      const meta: TrashMeta = {
        schema: 1,
        phase: 'moving',
        trashId,
        sessionId: input.sessionId,
        title: input.title,
        snippet: input.snippet,
        cwd: input.cwd,
        workspaceId: input.workspaceId,
        workspaceTitle: input.workspaceTitle,
        originalPath,
        movedAt: now.toISOString(),
        sizeBytes: input.sizeBytes,
        detachedFromWorkspace: input.detachedFromWorkspace,
        wasArchived: input.wasArchived,
      }

      await writeMeta(entryDir, meta)

      try {
        await rename(originalPath, payloadDir)
      } catch (error) {
        // Nothing moved: remove the half-written entry so the bin stays clean.
        await rm(entryDir, { recursive: true, force: true })
        throw new ArchiveDeskError(
          'archive/bad-request',
          `cannot move ${JSON.stringify(originalPath)} into the recycle bin`,
          { cause: error },
        )
      }

      const ready: TrashMeta = { ...meta, phase: 'ready' }
      await writeMeta(entryDir, ready)
      return ready
    }

    throw new ArchiveDeskError(
      'archive/busy',
      `cannot allocate a unique recycle-bin entry for ${JSON.stringify(input.sessionId)}`,
    )
  }

  /**
   * Every entry, including corrupt ones, ready first and newest first.
   *
   * A corrupt entry stays visible: hiding it would leave bytes on disk with no
   * way for the user to remove them from the panel.
   */
  async listEntries(): Promise<TrashEntry[]> {
    let names: string[]
    try {
      names = await readdir(this.root)
    } catch {
      return []
    }

    const entries: TrashEntry[] = []
    for (const name of names) {
      if (!isTrashId(name)) continue
      const entryDir = join(this.root, name)
      if (!(await isDirectory(entryDir))) continue
      const meta = await readMeta(entryDir)
      if (meta === undefined) {
        entries.push({
          trashId: name,
          status: 'corrupt',
          title: name,
          snippet: '',
          sizeBytes: 0,
          reason: 'metadata',
        })
        continue
      }
      if (meta.phase !== 'ready') {
        entries.push({
          trashId: name,
          status: 'corrupt',
          sessionId: meta.sessionId,
          title: meta.title,
          snippet: meta.snippet,
          originalPath: meta.originalPath,
          movedAt: meta.movedAt,
          sizeBytes: meta.sizeBytes,
          reason: 'interrupted',
        })
        continue
      }
      if (!(await isDirectory(join(entryDir, PAYLOAD_DIR)))) {
        entries.push({
          trashId: name,
          status: 'corrupt',
          sessionId: meta.sessionId,
          title: meta.title,
          snippet: meta.snippet,
          originalPath: meta.originalPath,
          movedAt: meta.movedAt,
          sizeBytes: meta.sizeBytes,
          reason: 'payload',
        })
        continue
      }
      entries.push(entryOf(name, meta))
    }

    entries.sort((left, right) => {
      if (left.status !== right.status) return left.status === 'ready' ? -1 : 1
      return (right.movedAt ?? '').localeCompare(left.movedAt ?? '')
    })
    return entries
  }

  /** Ready entries, newest first. Entries mid-move are recovered at startup. */
  async list(): Promise<TrashMeta[]> {
    return (await this.listEntries())
      .filter((entry): entry is TrashEntry & { meta: TrashMeta } => entry.meta !== undefined)
      .map((entry) => entry.meta)
  }

  /**
   * Put a session directory back where it came from, keeping the bin entry.
   *
   * The caller re-archives the session and then calls {@link discard}, or calls
   * {@link rollback} when the state write failed.
   *
   * @returns the stored metadata, so the caller can re-archive the session.
   * @throws ArchiveDeskError `archive/restore-conflict` when the target exists.
   * @throws ArchiveDeskError `archive/trash-corrupt` when the entry is broken
   *   or its stored path is outside the sessions root.
   */
  async restore(trashId: string): Promise<TrashMeta> {
    const entryDir = this.resolveEntry(trashId)
    const meta = await readMeta(entryDir)
    if (meta === undefined || meta.phase !== 'ready') {
      throw new ArchiveDeskError(
        'archive/trash-corrupt',
        `trash entry ${trashId} is not restorable`,
      )
    }

    const payloadDir = join(entryDir, PAYLOAD_DIR)
    if (!(await isDirectory(payloadDir))) {
      throw new ArchiveDeskError('archive/trash-corrupt', `trash entry ${trashId} has no payload`)
    }
    if (!isTrashId(meta.trashId) || meta.trashId !== trashId) {
      throw new ArchiveDeskError(
        'archive/trash-corrupt',
        `trash entry ${trashId} has stale metadata`,
      )
    }
    this.assertRestoreTarget(trashId, meta)
    if (await pathExists(meta.originalPath)) {
      throw new ArchiveDeskError(
        'archive/restore-conflict',
        `cannot restore ${meta.sessionId}: ${JSON.stringify(meta.originalPath)} already exists`,
      )
    }

    await mkdir(dirname(meta.originalPath), { recursive: true })
    await rename(payloadDir, meta.originalPath)
    return meta
  }

  /** Remove a restored entry after its archive state was written. */
  async discard(trashId: string): Promise<void> {
    await rm(this.resolveEntry(trashId), { recursive: true, force: true })
  }

  /**
   * Put a payload back after a failed re-archive. Keeps the entry restorable.
   *
   * @returns whether the payload was moved back.
   */
  async rollback(trashId: string, meta: TrashMeta): Promise<boolean> {
    const entryDir = this.resolveEntry(trashId)
    const payloadDir = join(entryDir, PAYLOAD_DIR)
    if (await isDirectory(payloadDir)) return true
    if (!(await pathExists(meta.originalPath))) return false
    await mkdir(entryDir, { recursive: true })
    await rename(meta.originalPath, payloadDir)
    await writeMeta(entryDir, { ...meta, phase: 'ready' })
    return true
  }

  /**
   * Delete one entry for good.
   *
   * @returns bytes freed.
   */
  async purge(trashId: string): Promise<number> {
    const entryDir = this.resolveEntry(trashId)
    const meta = await readMeta(entryDir)
    const payloadDir = join(entryDir, PAYLOAD_DIR)
    const size = (await isDirectory(payloadDir))
      ? await directorySize(payloadDir)
      : (meta?.sizeBytes ?? 0)

    await rm(entryDir, { recursive: true, force: true })
    return size
  }

  /** Finish or undo entries interrupted mid-move. Run once at plugin startup. */
  async recover(): Promise<RecoveryReport> {
    const report: RecoveryReport = { recovered: [], dropped: [], corrupt: [] }
    let names: string[]
    try {
      names = await readdir(this.root)
    } catch {
      return report
    }

    for (const name of names) {
      if (!isTrashId(name)) continue
      const entryDir = join(this.root, name)
      if (!(await isDirectory(entryDir))) continue
      const meta = await readMeta(entryDir)
      if (meta === undefined) {
        report.corrupt.push(name)
        continue
      }

      const payloadExists = await isDirectory(join(entryDir, PAYLOAD_DIR))
      if (meta.phase === 'moving') {
        if (payloadExists) {
          await writeMeta(entryDir, { ...meta, phase: 'ready' })
          report.recovered.push(name)
        } else {
          await rm(entryDir, { recursive: true, force: true })
          report.dropped.push(name)
        }
      } else if (!payloadExists) {
        report.corrupt.push(name)
      }
    }

    return report
  }

  private assertRestoreTarget(trashId: string, meta: TrashMeta): void {
    if (!isAbsolute(meta.originalPath)) {
      throw new ArchiveDeskError(
        'archive/trash-corrupt',
        `trash entry ${trashId} has a relative restore target`,
      )
    }
    const target = resolve(meta.originalPath)
    if (!isWithin(this.sessionsRoot, target)) {
      throw new ArchiveDeskError(
        'archive/trash-corrupt',
        `trash entry ${trashId} points outside the sessions root`,
      )
    }
    if (basename(target) !== meta.sessionId) {
      throw new ArchiveDeskError(
        'archive/trash-corrupt',
        `trash entry ${trashId} has a target that does not match its session id`,
      )
    }
  }

  private resolveEntry(trashId: string): string {
    if (!isTrashId(trashId)) {
      throw new ArchiveDeskError(
        'archive/bad-request',
        `invalid trash id ${JSON.stringify(trashId)}`,
      )
    }
    return join(this.root, trashId)
  }
}
