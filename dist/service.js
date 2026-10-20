/**
 * Archive desk service: the read path and the delete/restore transactions.
 *
 * The service depends on narrow interfaces instead of the Host Context, so the
 * whole thing is unit-testable without a running Harness. The Host entry point
 * adapts `ctx` onto these interfaces and exposes the methods over HTTP and to
 * the Agent tool.
 *
 * Status semantics matter here: "loaded in memory" is not "running". A
 * conversation open in the main panel but sitting idle is `open`; only the
 * Host's `workspace/session-activity` waterfall makes a session `running`.
 *
 * @see docs/设计.md §4.3 (methods), §5.3 (state sources), §6 (transaction)
 */
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { SummaryCache } from "./cache.js";
import { ArchiveDeskError, archiveDeskRoot, isSessionId, isTrashId, locateSession, measureDirectory, projectionCacheRoot, scanSessionIndex, sessionsRoot, } from "./paths.js";
import { TrashStore } from "./trash.js";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_TRASH_LIMIT = 50;
const MAX_MATCHING_IDS = 1000;
const SNIPPET_CHARS = 160;
const TITLE_FALLBACK_CHARS = 24;
const SUMMARY_CONCURRENCY = 4;
function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}
function textOf(content) {
    if (!Array.isArray(content))
        return undefined;
    const parts = [];
    for (const block of content) {
        if (block === null || typeof block !== 'object')
            continue;
        const record = block;
        if (record.type === 'text' && typeof record.text === 'string')
            parts.push(record.text);
    }
    if (parts.length === 0)
        return undefined;
    return parts.join(' ').replace(/\s+/g, ' ').trim() || undefined;
}
/** First user-authored message text, used as the row preview. */
export function snippetFromEvents(events) {
    for (const event of events) {
        if (event.type !== 'user/message')
            continue;
        const data = event.data;
        if (data?.source?.kind !== 'user')
            continue;
        const text = textOf(data.content);
        if (text !== undefined)
            return text.slice(0, SNIPPET_CHARS);
    }
    return '';
}
/** Latest `session/title` event; the title service folds the same way. */
export function titleFromEvents(events) {
    for (let index = events.length - 1; index >= 0; index -= 1) {
        const event = events[index];
        if (event?.type !== 'session/title')
            continue;
        const title = event.data?.title;
        if (typeof title === 'string' && title.trim().length > 0)
            return title.trim();
    }
    return undefined;
}
/** Latest event time; falls back to the header's creation instant. */
function updatedAtOf(events, createdAt) {
    let latest = createdAt;
    for (const event of events) {
        if (typeof event.time === 'number' && event.time > latest)
            latest = event.time;
    }
    return latest;
}
function matchesQuery(item, query) {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0)
        return true;
    const haystack = [item.id, item.title, item.snippet, item.cwd, item.workspaceTitle];
    return haystack.some((value) => typeof value === 'string' && value.toLowerCase().includes(needle));
}
/** Windows paths compare case-insensitively; trailing separators are noise. */
function samePath(left, right) {
    if (left === undefined || right === undefined)
        return false;
    const normalize = (value) => value.replace(/[\\/]+$/, '').toLowerCase();
    return normalize(left) === normalize(right);
}
function reasonOf(error) {
    if (error instanceof ArchiveDeskError)
        return error.code;
    return 'archive/internal';
}
function uniqueStrings(value) {
    if (!Array.isArray(value))
        return [];
    return [...new Set(value.filter((entry) => typeof entry === 'string'))];
}
function statusRank(status) {
    return status === 'missing' ? 1 : 0;
}
export class ArchiveDeskService {
    deps;
    busy = new Set();
    summaryCache;
    summaryLoads = new Map();
    trashStore;
    cacheReady;
    constructor(deps) {
        this.deps = deps;
        this.summaryCache = new SummaryCache(join(archiveDeskRoot(deps.home), 'summaries.json'));
    }
    /**
     * List the archive set.
     *
     * Paths are indexed once, summaries come from the cache when the session
     * directory is unchanged, and only misses touch the session log.
     */
    async list(request = {}, signal) {
        const archivedIds = this.archivedIds().filter(isSessionId);
        const workspaces = this.workspaces();
        const locations = await this.sessionLocations(archivedIds);
        const rows = await this.describeMany(archivedIds, locations, workspaces, signal);
        const missingTotal = rows.filter((row) => row.item.status === 'missing').length;
        const filtered = request.query === undefined
            ? rows
            : rows.filter((row) => matchesQuery(row.item, request.query ?? ''));
        const sort = request.sort === 'size' || request.sort === 'title' || request.sort === 'archive'
            ? request.sort
            : 'recent';
        filtered.sort((left, right) => compareRows(left, right, sort));
        const limit = clamp(request.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
        const offset = Math.max(0, Math.trunc(request.offset ?? 0));
        const totalBytes = filtered.reduce((sum, row) => sum + row.item.sizeBytes, 0);
        const missing = filtered.filter((row) => row.item.status === 'missing').length;
        const matchingIds = filtered.slice(0, MAX_MATCHING_IDS).map((row) => row.item.id);
        this.summaryCache.prune(new Set(archivedIds));
        await this.summaryCache.flush();
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
        };
    }
    /**
     * Describe a specific selection without listing the whole archive. The
     * delete dialog uses this so its labels, sizes and skip warnings are exact
     * even when the selection spans pages.
     */
    async inspect(request = {}) {
        const requested = uniqueStrings(request.ids).filter(isSessionId);
        const archived = new Set(this.archivedIds());
        const selected = requested.filter((id) => archived.has(id));
        const notArchived = requested.filter((id) => !archived.has(id));
        const locations = await this.sessionLocations(selected);
        const rows = await this.describeMany(selected, locations, this.workspaces());
        const items = rows.map((row) => row.item);
        const running = items.filter((item) => item.status === 'running').length;
        const open = items.filter((item) => item.status === 'open').length;
        const missing = items.filter((item) => item.status === 'missing').length;
        await this.summaryCache.flush();
        return {
            items,
            total: items.length,
            totalBytes: items.reduce((sum, item) => sum + item.sizeBytes, 0),
            deletable: items.filter((item) => item.status === 'ok' || item.status === 'missing').length,
            running,
            open,
            missing,
            notArchived,
        };
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
    async delete(request) {
        this.requireRegistry();
        const ids = uniqueStrings(request.ids).filter(isSessionId);
        const mode = request.mode === 'purge' ? 'purge' : 'trash';
        const archived = new Set(this.archivedIds());
        const result = { deleted: [], partial: [], skipped: [], freedBytes: 0 };
        for (const id of ids) {
            if (this.busy.has(id)) {
                result.skipped.push({ id, reason: 'archive/busy' });
                continue;
            }
            if (!archived.has(id)) {
                result.skipped.push({ id, reason: 'archive/not-archived' });
                continue;
            }
            // Claim the id before the first await: the activity check is async, and
            // two requests arriving together must not both pass the guard.
            this.busy.add(id);
            try {
                await this.assertDeletable(id);
                const outcome = await this.deleteOne(id, mode);
                result.freedBytes += outcome.freedBytes;
                if (outcome.partial !== undefined) {
                    result.partial.push({ id, reason: outcome.partial });
                }
                else {
                    result.deleted.push(id);
                }
            }
            catch (error) {
                result.skipped.push({ id, reason: reasonOf(error) });
            }
            finally {
                this.busy.delete(id);
            }
        }
        await this.summaryCache.flush();
        return result;
    }
    /** Put trashed sessions back where they came from and re-archive them. */
    async restore(request) {
        this.requireRegistry();
        const trashIds = uniqueStrings(request.trashIds).filter(isTrashId);
        const result = { restored: [], failed: [] };
        for (const trashId of trashIds) {
            let meta;
            let attached;
            try {
                meta = await this.trash().restore(trashId);
                const workspace = this.workspaces().find((candidate) => samePath(candidate.path, meta?.cwd));
                if (workspace !== undefined) {
                    try {
                        await workspace.attachSession?.(meta.sessionId);
                        attached = workspace;
                    }
                    catch {
                        // A missing cwd or a removed workspace leaves the session ungrouped.
                    }
                }
                await this.deps.registry?.archiveSession(meta.sessionId);
                // The archive state is committed; a failed discard only leaves a
                // corrupt bin entry behind, which the panel can still remove.
                try {
                    await this.trash().discard(trashId);
                }
                catch {
                    // Keep the restored result: the session itself is back on disk.
                }
                this.summaryCache.delete(meta.sessionId);
                result.restored.push(trashId);
            }
            catch (error) {
                if (meta !== undefined) {
                    if (attached !== undefined) {
                        try {
                            await attached.detachSession?.(meta.sessionId);
                        }
                        catch {
                            // The stale workspace slot is pruned on its next write.
                        }
                    }
                    try {
                        await this.trash().rollback(trashId, meta);
                    }
                    catch {
                        // The entry stays visible as corrupt if even the rollback failed.
                    }
                }
                result.failed.push({ trashId, reason: reasonOf(error) });
            }
        }
        await this.summaryCache.flush();
        return result;
    }
    /** Delete recycle-bin entries for good. */
    async purgeTrash(request) {
        const trashIds = uniqueStrings(request.trashIds).filter(isTrashId);
        const result = { purged: [], failed: [], freedBytes: 0 };
        for (const trashId of trashIds) {
            try {
                result.freedBytes += await this.trash().purge(trashId);
                result.purged.push(trashId);
            }
            catch (error) {
                result.failed.push({ trashId, reason: reasonOf(error) });
            }
        }
        return result;
    }
    /** Empty the recycle bin, including broken entries. */
    async emptyTrash() {
        const entries = await this.trash().listEntries();
        return this.purgeTrash({ trashIds: entries.map((entry) => entry.trashId) });
    }
    /** Recycle-bin contents, newest ready entries first and corrupt entries last. */
    async listTrash(request = {}) {
        const entries = await this.trash().listEntries();
        const limit = clamp(request.limit ?? DEFAULT_TRASH_LIMIT, 1, MAX_LIMIT);
        const offset = Math.max(0, Math.trunc(request.offset ?? 0));
        const totalBytes = entries
            .filter((entry) => entry.status === 'ready')
            .reduce((sum, entry) => sum + entry.sizeBytes, 0);
        const items = entries.slice(offset, offset + limit).map((entry) => {
            const { meta: _meta, ...publicEntry } = entry;
            return publicEntry;
        });
        return { total: entries.length, totalBytes, offset, limit, items };
    }
    /** Drop archive references whose session directory no longer exists. */
    async cleanDangling() {
        this.requireRegistry();
        const archivedIds = this.archivedIds().filter(isSessionId);
        const root = sessionsRoot(this.deps.home);
        const removed = [];
        const failed = [];
        for (const id of archivedIds) {
            let location;
            try {
                location = await locateSession(root, id);
            }
            catch (error) {
                // A duplicate id is not a dangling reference; leave it for a human.
                failed.push({ id, reason: reasonOf(error) });
                continue;
            }
            if (location !== undefined)
                continue;
            try {
                await this.forget(id);
                removed.push(id);
            }
            catch (error) {
                failed.push({ id, reason: reasonOf(error) });
            }
        }
        await this.summaryCache.flush();
        return { removed, failed };
    }
    /** Finish or undo trash entries interrupted by a crash. Run once at startup. */
    async recoverTrash() {
        await this.trash().recover();
    }
    /** Write pending summary-cache changes immediately (tests and shutdown). */
    async flushCache() {
        await this.summaryCache.flush();
    }
    archivedIds() {
        return this.deps.registry?.archivedSessionIds ?? [];
    }
    workspaces() {
        return this.deps.registry?.list() ?? [];
    }
    requireRegistry() {
        const registry = this.deps.registry;
        if (registry === undefined) {
            throw new ArchiveDeskError('archive/unsupported', 'workspaceRegistry is unavailable; destructive operations are disabled');
        }
        return registry;
    }
    trash() {
        this.trashStore ??= new TrashStore(join(archiveDeskRoot(this.deps.home), 'trash'), sessionsRoot(this.deps.home));
        return this.trashStore;
    }
    /** One directory scan for the whole list, with a slow per-id fallback. */
    async sessionLocations(ids) {
        const root = sessionsRoot(this.deps.home);
        try {
            return await scanSessionIndex(root);
        }
        catch {
            // A duplicate id makes the one-pass index ambiguous. Fall back to the
            // per-id lookup so the rest of the archive still lists.
        }
        const locations = new Map();
        for (const id of ids) {
            try {
                const location = await locateSession(root, id);
                if (location !== undefined)
                    locations.set(id, location);
            }
            catch {
                // Leave the ambiguous entry out; it shows as missing.
            }
        }
        return locations;
    }
    async describeMany(ids, locations, workspaces, signal) {
        await this.ensureCache();
        const rows = new Array(ids.length);
        let cursor = 0;
        const worker = async () => {
            while (true) {
                const index = cursor;
                cursor += 1;
                if (index >= ids.length)
                    return;
                signal?.throwIfAborted();
                const id = ids[index];
                if (id === undefined)
                    return;
                rows[index] = {
                    item: await this.describe(id, locations.get(id), workspaces),
                    archiveIndex: index,
                };
            }
        };
        const count = Math.min(SUMMARY_CONCURRENCY, Math.max(1, ids.length));
        await Promise.all(Array.from({ length: count }, () => worker()));
        return rows.filter((row) => row !== undefined);
    }
    async describe(id, location, workspaces) {
        await this.ensureCache();
        const workspace = workspaces.find((candidate) => candidate.sessionIds?.includes(id) === true);
        const workspaceId = workspace?.id;
        const workspaceTitle = workspace?.title;
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
            };
        }
        const measurement = await measureDirectory(location.sessionDir);
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
            };
        }
        const fingerprint = {
            sizeBytes: measurement.sizeBytes,
            mtimeMs: measurement.mtimeMs,
        };
        let summary = this.summaryCache.get(id, fingerprint);
        if (summary === undefined) {
            summary = await this.loadSummary(id, fingerprint);
            if (summary !== undefined)
                this.summaryCache.set(summary);
        }
        const fallback = {
            sessionId: id,
            fingerprint,
            title: id,
            snippet: '',
            createdAt: 0,
            updatedAt: 0,
        };
        const record = summary ?? fallback;
        const status = await this.statusFor(id);
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
        };
    }
    async loadSummary(id, fingerprint) {
        const current = this.summaryLoads.get(id);
        if (current !== undefined)
            return current;
        const promise = (async () => {
            const snapshot = await this.readSession(id);
            if (snapshot === undefined)
                return undefined;
            const events = snapshot.events ?? [];
            const header = snapshot.header ?? snapshot.session;
            const createdAt = header?.createdAt ?? 0;
            const snippet = snippetFromEvents(events);
            const title = titleFromEvents(events) ?? (snippet === '' ? id : snippet.slice(0, TITLE_FALLBACK_CHARS));
            return {
                sessionId: id,
                fingerprint,
                title,
                snippet,
                ...(header?.cwd === undefined ? {} : { cwd: header.cwd }),
                createdAt,
                updatedAt: updatedAtOf(events, createdAt),
            };
        })().finally(() => {
            this.summaryLoads.delete(id);
        });
        this.summaryLoads.set(id, promise);
        return promise;
    }
    async readSession(id) {
        const query = this.deps.sessionQuery;
        if (query === undefined)
            return undefined;
        try {
            if (typeof query.readSession === 'function')
                return await query.readSession(id);
            if (typeof query.load === 'function')
                return await query.load(id);
        }
        catch {
            // A log that cannot be read costs the preview, not the row.
        }
        return undefined;
    }
    async ensureCache() {
        this.cacheReady ??= this.summaryCache.load();
        await this.cacheReady;
    }
    async statusFor(id) {
        if (this.deps.isLoaded?.(id) !== true)
            return 'ok';
        return (await this.activityOf(id)) ? 'running' : 'open';
    }
    async activityOf(id) {
        if (this.deps.isActive === undefined)
            return false;
        try {
            return await this.deps.isActive(id);
        }
        catch {
            // If the Host cannot answer, do not let a delete through.
            return true;
        }
    }
    async assertDeletable(id) {
        if (this.deps.isLoaded?.(id) !== true)
            return;
        if (await this.activityOf(id)) {
            throw new ArchiveDeskError('archive/live-session', `session ${JSON.stringify(id)} is running`);
        }
        throw new ArchiveDeskError('archive/open-session', `session ${JSON.stringify(id)} is still open; close it before deleting`);
    }
    async deleteOne(id, mode) {
        const location = await locateSession(sessionsRoot(this.deps.home), id);
        // Nothing on disk: the reference is the only thing left to drop.
        if (location === undefined) {
            this.summaryCache.delete(id);
            await this.forget(id);
            return { freedBytes: 0 };
        }
        // Re-check immediately before touching the directory: a turn may have
        // started between the batch precheck and this item.
        await this.assertDeletable(id);
        const item = await this.describe(id, location, this.workspaces());
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
            });
        }
        else {
            await rm(location.sessionDir, { recursive: true, force: true });
        }
        await this.dropProjectionCache(id);
        this.summaryCache.delete(id);
        try {
            await this.forget(id);
        }
        catch (error) {
            return { freedBytes: item.sizeBytes, partial: reasonOf(error) };
        }
        return { freedBytes: item.sizeBytes };
    }
    /** Remove every reference the Harness keeps for a deleted session. */
    async forget(id) {
        for (const workspace of this.workspaces()) {
            try {
                // `sessionIds` is filtered by the registry's candidate check, so a
                // membership test here would miss stale ids. detach is idempotent.
                await workspace.detachSession?.(id);
            }
            catch {
                // The registry prunes candidates that no longer resolve on its next write.
            }
        }
        await this.deps.registry?.unarchiveSession(id);
        this.summaryCache.delete(id);
        this.deps.emitRemoved?.(id);
    }
    async dropProjectionCache(id) {
        const root = projectionCacheRoot(this.deps.home);
        // Current DSH writes `session-<id>.json`; older caches used the bare id.
        // Removing both is cheap and keeps the projection store from carrying a
        // file for a session that no longer exists.
        for (const name of [`${id}.json`, `${id.replace(/^session-/, '')}.json`]) {
            try {
                await rm(join(root, name), { force: true });
            }
            catch {
                // A derived cache that cannot be removed is invalidated by the log itself.
            }
        }
    }
}
function compareRows(left, right, sort) {
    const leftMissing = statusRank(left.item.status);
    const rightMissing = statusRank(right.item.status);
    if (leftMissing !== rightMissing)
        return leftMissing - rightMissing;
    switch (sort) {
        case 'size':
            return (right.item.sizeBytes - left.item.sizeBytes || right.item.updatedAt - left.item.updatedAt);
        case 'title':
            return left.item.title.localeCompare(right.item.title);
        case 'archive':
            return right.archiveIndex - left.archiveIndex;
        case 'recent':
        default:
            return right.item.updatedAt - left.item.updatedAt || right.archiveIndex - left.archiveIndex;
    }
}
