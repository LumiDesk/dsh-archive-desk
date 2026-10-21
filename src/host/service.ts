/**
 * Archive desk service: the read path and the delete/restore transactions.
 *
 * The service depends on narrow interfaces instead of the Host Context, so the
 * whole thing is unit-testable without a running Harness. The Host entry point
 * adapts `ctx` onto these interfaces and exposes the methods over HTTP and to
 * the Agent tool.
 *
 * Status semantics matter here. Only the Host's `workspace/session-activity`
 * waterfall can prove a session has work in flight (turn, job, schedule,
 * subagent). "Loaded in memory" is deliberately *not* a status: the Host keeps
 * every session it has seen for the process lifetime, so it says nothing about
 * whether the user still has it open, and archiving never unloads a session.
 * Treating it as "still open" made archived conversations permanently
 * undeletable for no reason the user could act on.
 *
 * A loaded-but-idle session is deletable; the delete path stops any residual
 * activity first (§6.2 step 0) so nothing can write the log back afterwards.
 *
 * @see docs/设计.md §3.1 (states), §5.3 (state sources), §6 (transaction)
 */
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { SummaryCache, type SummaryFingerprint, type SummaryRecord } from './cache.ts'
import {
  ArchiveDeskError,
  archiveDeskRoot,
  isSessionId,
  isTrashId,
  locateSession,
  measureDirectory,
  projectionCacheRoot,
  scanSessionIndex,
  sessionsRoot,
  type SessionLocation,
} from './paths.ts'
import { TrashStore, type TrashEntry, type TrashMeta } from './trash.ts'

/** What the panel and the Agent tool can say about one archived row. */
export type ArchivedStatus = 'ok' | 'running' | 'missing'

/** One row as the panel and the Agent tool see it. */
export interface ArchivedItem {
  id: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  createdAt: number
  updatedAt: number
  sizeBytes: number
  status: ArchivedStatus
}

export type ListSort = 'recent' | 'size' | 'title' | 'archive'

export interface ListRequest {
  offset?: number
  limit?: number
  query?: string
  sort?: ListSort
}

export interface ListResult {
  total: number
  offset: number
  limit: number
  totalBytes: number
  /** How many of the filtered rows point at a session directory that is gone. */
  missing: number
  /** Missing rows across the whole archive set, regardless of the search. */
  missingTotal: number
  /** Every id matching the filter (capped), so "select all" covers all pages. */
  matchingIds: string[]
  /** Whether {@link matchingIds} was capped. */
  matchingIdsTruncated: boolean
  items: ArchivedItem[]
}

export interface InspectRequest {
  ids?: unknown
}

export interface InspectResult {
  items: ArchivedItem[]
  total: number
  totalBytes: number
  /**
   * Rows a delete can act on. Running rows count: the delete path stops their
   * work first, so they are delayed rather than refused.
   */
  deletable: number
  /** Rows with activity in flight; deleting them means stopping that work first. */
  running: number
  /** Rows whose activity did not stop in time; the delete run skips them. */
  notSettled: number
  missing: number
  /** Requested ids that are not in the archive set. */
  notArchived: string[]
}

export interface UnarchiveRequest {
  ids?: unknown
}

export interface UnarchiveResult {
  unarchived: string[]
  skipped: Array<{ id: string; reason: string }>
}

export interface DeleteRequest {
  ids?: unknown
  mode?: unknown
}

export interface DeleteResult {
  deleted: string[]
  /** File operation succeeded, but a state write failed; the bin may hold it. */
  partial: Array<{ id: string; reason: string }>
  skipped: Array<{ id: string; reason: string }>
  freedBytes: number
}

export interface RestoreRequest {
  trashIds?: unknown
}

export interface RestoreResult {
  restored: string[]
  failed: Array<{ trashId: string; reason: string }>
}

export interface PurgeRequest {
  trashIds?: unknown
}

export interface PurgeResult {
  purged: string[]
  failed: Array<{ trashId: string; reason: string }>
  freedBytes: number
}

export interface TrashListRequest {
  offset?: number
  limit?: number
}

export interface TrashListResult {
  total: number
  totalBytes: number
  offset: number
  limit: number
  items: TrashEntry[]
}

export interface CleanDanglingResult {
  removed: string[]
  failed: Array<{ id: string; reason: string }>
}

/** The subset of one session event the listing reads. */
export interface SessionEventLike {
  type: string
  data?: unknown
  time?: number
}

export interface SessionSnapshotLike {
  /** Corpus shape (`load()`). */
  header?: { id?: string; createdAt?: number; cwd?: string }
  /** Public service shape (`readSession()` names the header `session`). */
  session?: { id?: string; createdAt?: number; cwd?: string }
  events?: readonly SessionEventLike[]
}

/**
 * `ctx.sessionQuery` as this service uses it. The public service exposes
 * `readSession(id)`; the internal corpus exposes `load(id)`. Both are accepted
 * so the service keeps working if it is driven by either one.
 */
export interface SessionQueryLike {
  readSession?(id: string): Promise<SessionSnapshotLike>
  load?(id: string, signal?: AbortSignal): Promise<SessionSnapshotLike>
}

/** One registry workspace as this service uses it. */
export interface WorkspaceLike {
  id?: string
  title?: string
  path?: string
  sessionIds?: readonly string[]
  detachSession?(sessionId: string): Promise<void>
  attachSession?(sessionId: string): Promise<void>
}

/** `ctx.workspaceRegistry` as this service uses it. */
export interface WorkspaceRegistryLike {
  readonly archivedSessionIds: readonly string[]
  list(): readonly WorkspaceLike[]
  unarchiveSession(sessionId: string): Promise<void>
  archiveSession(sessionId: string): Promise<void>
}

export interface ArchiveDeskDeps {
  /** Harness home; the service derives `<home>/sessions` and the bin from it. */
  home: string
  registry?: WorkspaceRegistryLike
  sessionQuery?: SessionQueryLike
  /** Whether the Host reports running work (turn/job/schedule/subagent). */
  isActive?: (sessionId: string) => Promise<boolean>
  /**
   * Ask the Host to stop a session's work the way archiving does
   * (`workspace/session-stop`): cancel the turn without keeping its inbox, kill
   * its jobs, drop its schedules and cancel its subagents.
   */
  stopActivity?: (sessionId: string) => void
  /** Broadcast that a session left the live registry (sidebar row removal). */
  emitRemoved?: (sessionId: string) => void
  /** Injectable clock for deterministic trash ids in tests. */
  now?: () => Date
  /** Injectable sleep so the "activity stopped" poll is testable. */
  wait?: (ms: number) => Promise<void>
  /** How long to wait for stopped activity to disappear before giving up. */
  settleTimeoutMs?: number
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const DEFAULT_TRASH_LIMIT = 50
const MAX_MATCHING_IDS = 1000
const SNIPPET_CHARS = 160
const TITLE_FALLBACK_CHARS = 24
const SUMMARY_CONCURRENCY = 4
/** How long `delete` waits for stopped work to report idle, in total. */
const DEFAULT_SETTLE_TIMEOUT_MS = 2000
/** Gap between two activity probes while waiting for a stopped session. */
const SETTLE_POLL_MS = 50

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)))
}

function textOf(content: unknown): string | undefined {
  if (!Array.isArray(content)) return undefined
  const parts: string[] = []
  for (const block of content) {
    if (block === null || typeof block !== 'object') continue
    const record = block as { type?: unknown; text?: unknown }
    if (record.type === 'text' && typeof record.text === 'string') parts.push(record.text)
  }
  if (parts.length === 0) return undefined
  return parts.join(' ').replace(/\s+/g, ' ').trim() || undefined
}

/** First user-authored message text, used as the row preview. */
export function snippetFromEvents(events: readonly SessionEventLike[]): string {
  for (const event of events) {
    if (event.type !== 'user/message') continue
    const data = event.data as { source?: { kind?: unknown }; content?: unknown } | undefined
    if (data?.source?.kind !== 'user') continue
    const text = textOf(data.content)
    if (text !== undefined) return text.slice(0, SNIPPET_CHARS)
  }
  return ''
}

/** Latest `session/title` event; the title service folds the same way. */
export function titleFromEvents(events: readonly SessionEventLike[]): string | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.type !== 'session/title') continue
    const title = (event.data as { title?: unknown } | undefined)?.title
    if (typeof title === 'string' && title.trim().length > 0) return title.trim()
  }
  return undefined
}

/** Latest event time; falls back to the header's creation instant. */
function updatedAtOf(events: readonly SessionEventLike[], createdAt: number): number {
  let latest = createdAt
  for (const event of events) {
    if (typeof event.time === 'number' && event.time > latest) latest = event.time
  }
  return latest
}

function matchesQuery(item: ArchivedItem, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return true
  const haystack = [item.id, item.title, item.snippet, item.cwd, item.workspaceTitle]
  return haystack.some((value) => typeof value === 'string' && value.toLowerCase().includes(needle))
}

/** Windows paths compare case-insensitively; trailing separators are noise. */
function samePath(left: string | undefined, right: string | undefined): boolean {
  if (left === undefined || right === undefined) return false
  const normalize = (value: string): string => value.replace(/[\\/]+$/, '').toLowerCase()
  return normalize(left) === normalize(right)
}

function reasonOf(error: unknown): string {
  if (error instanceof ArchiveDeskError) return error.code
  return 'archive/internal'
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))]
}

function statusRank(status: ArchivedStatus): number {
  return status === 'missing' ? 1 : 0
}

interface Row {
  item: ArchivedItem
  archiveIndex: number
}

export class ArchiveDeskService {
  private readonly deps: ArchiveDeskDeps
  private readonly busy = new Set<string>()
  private readonly summaryCache: SummaryCache
  private readonly summaryLoads = new Map<string, Promise<SummaryRecord | undefined>>()
  private trashStore: TrashStore | undefined
  private cacheReady: Promise<void> | undefined

  constructor(deps: ArchiveDeskDeps) {
    this.deps = deps
    this.summaryCache = new SummaryCache(join(archiveDeskRoot(deps.home), 'summaries.json'))
  }

  /**
   * List the archive set.
   *
   * Paths are indexed once, summaries come from the cache when the session
   * directory is unchanged, and only misses touch the session log.
   */
  async list(request: ListRequest = {}, signal?: AbortSignal): Promise<ListResult> {
    const archivedIds = this.archivedIds().filter(isSessionId)
    const workspaces = this.workspaces()
    const locations = await this.sessionLocations(archivedIds)
    const rows = await this.describeMany(archivedIds, locations, workspaces, signal)

    const missingTotal = rows.filter((row) => row.item.status === 'missing').length
    const filtered =
      request.query === undefined
        ? rows
        : rows.filter((row) => matchesQuery(row.item, request.query ?? ''))

    const sort: ListSort =
      request.sort === 'size' || request.sort === 'title' || request.sort === 'archive'
        ? request.sort
        : 'recent'
    filtered.sort((left, right) => compareRows(left, right, sort))

    const limit = clamp(request.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT)
    const offset = Math.max(0, Math.trunc(request.offset ?? 0))
    const totalBytes = filtered.reduce((sum, row) => sum + row.item.sizeBytes, 0)
    const missing = filtered.filter((row) => row.item.status === 'missing').length
    const matchingIds = filtered.slice(0, MAX_MATCHING_IDS).map((row) => row.item.id)

    this.summaryCache.prune(new Set(archivedIds))
    await this.summaryCache.flush()

    return {
      total: filtered.length,
      offset,
      limit,
      totalBytes,
      missing,
      missingTotal,
      matchingIds,
      matchingIdsTruncated: filtered.length > MAX_MATCHING_IDS,
      items: filtered.slice(offset, offset + limit).map((row) => row.item),
    }
  }

  /**
   * Describe a specific selection without listing the whole archive. The
   * delete dialog uses this so its labels, sizes and skip warnings are exact
   * even when the selection spans pages.
   */
  async inspect(request: InspectRequest = {}): Promise<InspectResult> {
    const requested = uniqueStrings(request.ids).filter(isSessionId)
    const archived = new Set(this.archivedIds())
    const selected = requested.filter((id) => archived.has(id))
    const notArchived = requested.filter((id) => !archived.has(id))
    const locations = await this.sessionLocations(selected)
    const rows = await this.describeMany(selected, locations, this.workspaces())
    const items = rows.map((row) => row.item)
    const running = items.filter((item) => item.status === 'running').length
    const missing = items.filter((item) => item.status === 'missing').length
    await this.summaryCache.flush()

    return {
      items,
      total: items.length,
      totalBytes: items.reduce((sum, item) => sum + item.sizeBytes, 0),
      // Every listed row is actionable: idle and dangling ones directly, running
      // ones after their activity is stopped. Only a failed stop skips a row.
      deletable: items.length,
      running,
      notSettled: 0,
      missing,
      notArchived,
    }
  }

  /**
   * Take sessions out of the archive set without touching their files.
   *
   * The registry update is the whole operation: the workspace controller
   * watches the domain and pushes the new archive set to every connected
   * client, so the sidebar row returns to its workspace. Missing directories
   * are skipped — a dangling reference should be cleaned up, not unarchived
   * into an invisible half-session.
   */
  async unarchive(request: UnarchiveRequest): Promise<UnarchiveResult> {
    const registry = this.requireRegistry()
    const ids = uniqueStrings(request.ids).filter(isSessionId)
    const archived = new Set(this.archivedIds())
    const root = sessionsRoot(this.deps.home)
    const result: UnarchiveResult = { unarchived: [], skipped: [] }

    for (const id of ids) {
      if (!archived.has(id)) {
        result.skipped.push({ id, reason: 'archive/not-archived' })
        continue
      }
      let location: SessionLocation | undefined
      try {
        location = await locateSession(root, id)
      } catch (error) {
        result.skipped.push({ id, reason: reasonOf(error) })
        continue
      }
      if (location === undefined) {
        result.skipped.push({ id, reason: 'archive/not-found' })
        continue
      }
      try {
        await registry.unarchiveSession(id)
        this.summaryCache.delete(id)
        result.unarchived.push(id)
      } catch (error) {
        result.skipped.push({ id, reason: reasonOf(error) })
      }
    }

    await this.summaryCache.flush()
    return result
  }

  /**
   * Delete archived sessions.
   *
   * Order per item: validate → move or remove the directory → drop the
   * projection cache → detach from its workspace → leave the archive set →
   * announce the removal. Files move first so a failed state write leaves a
   * dangling reference or a restorable bin entry, never a visible half-deleted
   * session.
   */
  async delete(request: DeleteRequest): Promise<DeleteResult> {
    this.requireRegistry()
    const ids = uniqueStrings(request.ids).filter(isSessionId)
    const mode = request.mode === 'purge' ? 'purge' : 'trash'
    const archived = new Set(this.archivedIds())
    const result: DeleteResult = { deleted: [], partial: [], skipped: [], freedBytes: 0 }

    for (const id of ids) {
      if (this.busy.has(id)) {
        result.skipped.push({ id, reason: 'archive/busy' })
        continue
      }
      if (!archived.has(id)) {
        result.skipped.push({ id, reason: 'archive/not-archived' })
        continue
      }

      // Claim the id before the first await: the activity check is async, and
      // two requests arriving together must not both pass the guard.
      this.busy.add(id)
      try {
        await this.assertIdle(id)
        const outcome = await this.deleteOne(id, mode)
        result.freedBytes += outcome.freedBytes
        if (outcome.partial !== undefined) {
          result.partial.push({ id, reason: outcome.partial })
        } else {
          result.deleted.push(id)
        }
      } catch (error) {
        result.skipped.push({ id, reason: reasonOf(error) })
      } finally {
        this.busy.delete(id)
      }
    }

    await this.summaryCache.flush()
    return result
  }

  /** Put trashed sessions back where they came from and re-archive them. */
  async restore(request: RestoreRequest): Promise<RestoreResult> {
    this.requireRegistry()
    const trashIds = uniqueStrings(request.trashIds).filter(isTrashId)
    const result: RestoreResult = { restored: [], failed: [] }

    for (const trashId of trashIds) {
      let meta: TrashMeta | undefined
      let attached: WorkspaceLike | undefined
      try {
        meta = await this.trash().restore(trashId)
        const workspace = this.workspaces().find((candidate) => samePath(candidate.path, meta?.cwd))
        if (workspace !== undefined) {
          try {
            await workspace.attachSession?.(meta.sessionId)
            attached = workspace
          } catch {
            // A missing cwd or a removed workspace leaves the session ungrouped.
          }
        }
        await this.deps.registry?.archiveSession(meta.sessionId)
        // The archive state is committed; a failed discard only leaves a
        // corrupt bin entry behind, which the panel can still remove.
        try {
          await this.trash().discard(trashId)
        } catch {
          // Keep the restored result: the session itself is back on disk.
        }
        this.summaryCache.delete(meta.sessionId)
        result.restored.push(trashId)
      } catch (error) {
        if (meta !== undefined) {
          if (attached !== undefined) {
            try {
              await attached.detachSession?.(meta.sessionId)
            } catch {
              // The stale workspace slot is pruned on its next write.
            }
          }
          try {
            await this.trash().rollback(trashId, meta)
          } catch {
            // The entry stays visible as corrupt if even the rollback failed.
          }
        }
        result.failed.push({ trashId, reason: reasonOf(error) })
      }
    }

    await this.summaryCache.flush()
    return result
  }

  /** Delete recycle-bin entries for good. */
  async purgeTrash(request: PurgeRequest): Promise<PurgeResult> {
    const trashIds = uniqueStrings(request.trashIds).filter(isTrashId)
    const result: PurgeResult = { purged: [], failed: [], freedBytes: 0 }

    for (const trashId of trashIds) {
      try {
        result.freedBytes += await this.trash().purge(trashId)
        result.purged.push(trashId)
      } catch (error) {
        result.failed.push({ trashId, reason: reasonOf(error) })
      }
    }

    return result
  }

  /** Empty the recycle bin, including broken entries. */
  async emptyTrash(): Promise<PurgeResult> {
    const entries = await this.trash().listEntries()
    return this.purgeTrash({ trashIds: entries.map((entry) => entry.trashId) })
  }

  /** Recycle-bin contents, newest ready entries first and corrupt entries last. */
  async listTrash(request: TrashListRequest = {}): Promise<TrashListResult> {
    const entries = await this.trash().listEntries()
    const limit = clamp(request.limit ?? DEFAULT_TRASH_LIMIT, 1, MAX_LIMIT)
    const offset = Math.max(0, Math.trunc(request.offset ?? 0))
    const totalBytes = entries
      .filter((entry) => entry.status === 'ready')
      .reduce((sum, entry) => sum + entry.sizeBytes, 0)
    const items = entries.slice(offset, offset + limit).map((entry) => {
      const { meta: _meta, ...publicEntry } = entry
      return publicEntry
    })

    return { total: entries.length, totalBytes, offset, limit, items }
  }

  /** Drop archive references whose session directory no longer exists. */
  async cleanDangling(): Promise<CleanDanglingResult> {
    this.requireRegistry()
    const archivedIds = this.archivedIds().filter(isSessionId)
    const root = sessionsRoot(this.deps.home)
    const removed: string[] = []
    const failed: Array<{ id: string; reason: string }> = []

    for (const id of archivedIds) {
      let location: SessionLocation | undefined
      try {
        location = await locateSession(root, id)
      } catch (error) {
        // A duplicate id is not a dangling reference; leave it for a human.
        failed.push({ id, reason: reasonOf(error) })
        continue
      }
      if (location !== undefined) continue
      try {
        await this.forget(id)
        removed.push(id)
      } catch (error) {
        failed.push({ id, reason: reasonOf(error) })
      }
    }

    await this.summaryCache.flush()
    return { removed, failed }
  }

  /** Finish or undo trash entries interrupted by a crash. Run once at startup. */
  async recoverTrash(): Promise<void> {
    await this.trash().recover()
  }

  /** Write pending summary-cache changes immediately (tests and shutdown). */
  async flushCache(): Promise<void> {
    await this.summaryCache.flush()
  }

  private archivedIds(): readonly string[] {
    return this.deps.registry?.archivedSessionIds ?? []
  }

  private workspaces(): readonly WorkspaceLike[] {
    return this.deps.registry?.list() ?? []
  }

  private requireRegistry(): WorkspaceRegistryLike {
    const registry = this.deps.registry
    if (registry === undefined) {
      throw new ArchiveDeskError(
        'archive/unsupported',
        'workspaceRegistry is unavailable; destructive operations are disabled',
      )
    }
    return registry
  }

  private trash(): TrashStore {
    this.trashStore ??= new TrashStore(
      join(archiveDeskRoot(this.deps.home), 'trash'),
      sessionsRoot(this.deps.home),
    )
    return this.trashStore
  }

  /** One directory scan for the whole list, with a slow per-id fallback. */
  private async sessionLocations(ids: readonly string[]): Promise<Map<string, SessionLocation>> {
    const root = sessionsRoot(this.deps.home)
    try {
      return await scanSessionIndex(root)
    } catch {
      // A duplicate id makes the one-pass index ambiguous. Fall back to the
      // per-id lookup so the rest of the archive still lists.
    }

    const locations = new Map<string, SessionLocation>()
    for (const id of ids) {
      try {
        const location = await locateSession(root, id)
        if (location !== undefined) locations.set(id, location)
      } catch {
        // Leave the ambiguous entry out; it shows as missing.
      }
    }
    return locations
  }

  private async describeMany(
    ids: readonly string[],
    locations: Map<string, SessionLocation>,
    workspaces: readonly WorkspaceLike[],
    signal?: AbortSignal,
  ): Promise<Row[]> {
    await this.ensureCache()
    const rows: Row[] = new Array(ids.length)
    let cursor = 0
    const worker = async (): Promise<void> => {
      while (true) {
        const index = cursor
        cursor += 1
        if (index >= ids.length) return
        signal?.throwIfAborted()
        const id = ids[index]
        if (id === undefined) return
        rows[index] = {
          item: await this.describe(id, locations.get(id), workspaces),
          archiveIndex: index,
        }
      }
    }
    const count = Math.min(SUMMARY_CONCURRENCY, Math.max(1, ids.length))
    await Promise.all(Array.from({ length: count }, () => worker()))
    return rows.filter((row) => row !== undefined)
  }

  private async describe(
    id: string,
    location: SessionLocation | undefined,
    workspaces: readonly WorkspaceLike[],
  ): Promise<ArchivedItem> {
    await this.ensureCache()
    const workspace = workspaces.find((candidate) => candidate.sessionIds?.includes(id) === true)
    const workspaceId = workspace?.id
    const workspaceTitle = workspace?.title

    if (location === undefined) {
      return {
        id,
        title: id,
        snippet: '',
        ...(workspaceId === undefined ? {} : { workspaceId }),
        ...(workspaceTitle === undefined ? {} : { workspaceTitle }),
        createdAt: 0,
        updatedAt: 0,
        sizeBytes: 0,
        status: 'missing',
      }
    }

    const measurement = await measureDirectory(location.sessionDir)
    if (!measurement.exists) {
      return {
        id,
        title: id,
        snippet: '',
        ...(workspaceId === undefined ? {} : { workspaceId }),
        ...(workspaceTitle === undefined ? {} : { workspaceTitle }),
        createdAt: 0,
        updatedAt: 0,
        sizeBytes: 0,
        status: 'missing',
      }
    }

    const fingerprint: SummaryFingerprint = {
      sizeBytes: measurement.sizeBytes,
      mtimeMs: measurement.mtimeMs,
    }
    let summary = this.summaryCache.get(id, fingerprint)
    if (summary === undefined) {
      summary = await this.loadSummary(id, fingerprint)
      if (summary !== undefined) this.summaryCache.set(summary)
    }

    const fallback: SummaryRecord = {
      sessionId: id,
      fingerprint,
      title: id,
      snippet: '',
      createdAt: 0,
      updatedAt: 0,
    }
    const record = summary ?? fallback
    const status = await this.statusFor(id)

    return {
      id,
      title: record.title,
      snippet: record.snippet,
      ...(record.cwd === undefined ? {} : { cwd: record.cwd }),
      ...(workspaceId === undefined ? {} : { workspaceId }),
      ...(workspaceTitle === undefined ? {} : { workspaceTitle }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      sizeBytes: measurement.sizeBytes,
      status,
    }
  }

  private async loadSummary(
    id: string,
    fingerprint: SummaryFingerprint,
  ): Promise<SummaryRecord | undefined> {
    const current = this.summaryLoads.get(id)
    if (current !== undefined) return current

    const promise = (async (): Promise<SummaryRecord | undefined> => {
      const snapshot = await this.readSession(id)
      if (snapshot === undefined) return undefined
      const events = snapshot.events ?? []
      const header = snapshot.header ?? snapshot.session
      const createdAt = header?.createdAt ?? 0
      const snippet = snippetFromEvents(events)
      const title =
        titleFromEvents(events) ?? (snippet === '' ? id : snippet.slice(0, TITLE_FALLBACK_CHARS))
      return {
        sessionId: id,
        fingerprint,
        title,
        snippet,
        ...(header?.cwd === undefined ? {} : { cwd: header.cwd }),
        createdAt,
        updatedAt: updatedAtOf(events, createdAt),
      }
    })().finally(() => {
      this.summaryLoads.delete(id)
    })

    this.summaryLoads.set(id, promise)
    return promise
  }

  private async readSession(id: string): Promise<SessionSnapshotLike | undefined> {
    const query = this.deps.sessionQuery
    if (query === undefined) return undefined
    try {
      if (typeof query.readSession === 'function') return await query.readSession(id)
      if (typeof query.load === 'function') return await query.load(id)
    } catch {
      // A log that cannot be read costs the preview, not the row.
    }
    return undefined
  }

  private async ensureCache(): Promise<void> {
    this.cacheReady ??= this.summaryCache.load()
    await this.cacheReady
  }

  private async statusFor(id: string): Promise<ArchivedStatus> {
    return (await this.activityOf(id)) ? 'running' : 'ok'
  }

  private async activityOf(id: string): Promise<boolean> {
    if (this.deps.isActive === undefined) return false
    try {
      return await this.deps.isActive(id)
    } catch {
      // If the Host cannot answer, do not let a delete through.
      return true
    }
  }

  /**
   * Make sure a session has no work in flight before its directory is touched.
   *
   * Activity is stopped first (the same `workspace/session-stop` archiving
   * uses), then polled until it disappears. A session that is merely loaded in
   * memory has no activity and passes immediately; one that is really running
   * either settles here or is skipped with `archive/busy`.
   */
  private async assertIdle(id: string): Promise<void> {
    if (!(await this.activityOf(id))) return
    this.deps.stopActivity?.(id)
    const wait =
      this.deps.wait ?? ((ms: number) => new Promise<void>((done) => setTimeout(done, ms)))
    const deadline = Date.now() + (this.deps.settleTimeoutMs ?? DEFAULT_SETTLE_TIMEOUT_MS)
    for (;;) {
      await wait(SETTLE_POLL_MS)
      if (!(await this.activityOf(id))) return
      if (Date.now() >= deadline) {
        throw new ArchiveDeskError(
          'archive/busy',
          `session ${JSON.stringify(id)} did not stop its activity in time; try again once it ends`,
        )
      }
    }
  }

  private async deleteOne(
    id: string,
    mode: 'trash' | 'purge',
  ): Promise<{ freedBytes: number; partial?: string }> {
    const location = await locateSession(sessionsRoot(this.deps.home), id)

    // Nothing on disk: the reference is the only thing left to drop.
    if (location === undefined) {
      this.summaryCache.delete(id)
      await this.forget(id)
      return { freedBytes: 0 }
    }

    // Re-check immediately before touching the directory: a turn may have
    // started between the batch precheck and this item.
    await this.assertIdle(id)

    const item = await this.describe(id, location, this.workspaces())
    if (mode === 'trash') {
      await this.trash().create({
        sessionDir: location.sessionDir,
        sessionId: id,
        title: item.title,
        snippet: item.snippet,
        cwd: item.cwd,
        workspaceId: item.workspaceId,
        workspaceTitle: item.workspaceTitle,
        sizeBytes: item.sizeBytes,
        detachedFromWorkspace: true,
        wasArchived: true,
        now: this.deps.now?.(),
      })
    } else {
      await rm(location.sessionDir, { recursive: true, force: true })
    }

    await this.dropProjectionCache(id)
    this.summaryCache.delete(id)

    try {
      await this.forget(id)
    } catch (error) {
      return { freedBytes: item.sizeBytes, partial: reasonOf(error) }
    }
    return { freedBytes: item.sizeBytes }
  }

  /** Remove every reference the Harness keeps for a deleted session. */
  private async forget(id: string): Promise<void> {
    for (const workspace of this.workspaces()) {
      try {
        // `sessionIds` is filtered by the registry's candidate check, so a
        // membership test here would miss stale ids. detach is idempotent.
        await workspace.detachSession?.(id)
      } catch {
        // The registry prunes candidates that no longer resolve on its next write.
      }
    }

    await this.deps.registry?.unarchiveSession(id)
    this.summaryCache.delete(id)
    this.deps.emitRemoved?.(id)
  }

  private async dropProjectionCache(id: string): Promise<void> {
    const root = projectionCacheRoot(this.deps.home)
    // Current DSH writes `session-<id>.json`; older caches used the bare id.
    // Removing both is cheap and keeps the projection store from carrying a
    // file for a session that no longer exists.
    for (const name of [`${id}.json`, `${id.replace(/^session-/, '')}.json`]) {
      try {
        await rm(join(root, name), { force: true })
      } catch {
        // A derived cache that cannot be removed is invalidated by the log itself.
      }
    }
  }
}

function compareRows(left: Row, right: Row, sort: ListSort): number {
  const leftMissing = statusRank(left.item.status)
  const rightMissing = statusRank(right.item.status)
  if (leftMissing !== rightMissing) return leftMissing - rightMissing

  switch (sort) {
    case 'size':
      return (
        right.item.sizeBytes - left.item.sizeBytes || right.item.updatedAt - left.item.updatedAt
      )
    case 'title':
      return left.item.title.localeCompare(right.item.title)
    case 'archive':
      return right.archiveIndex - left.archiveIndex
    case 'recent':
    default:
      return right.item.updatedAt - left.item.updatedAt || right.archiveIndex - left.archiveIndex
  }
}
