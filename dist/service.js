/**
 * Archive desk service: the read path and the delete transaction.
 *
 * The service depends on narrow interfaces instead of the Host Context, so the
 * whole thing is unit-testable without a running Harness. The Host entry point
 * adapts `ctx` onto these interfaces and exposes the methods over HTTP and to
 * the Agent tool.
 *
 * @see docs/设计.md §4.3 (methods), §5.3 (state sources), §6 (transaction)
 */
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ArchiveDeskError, archiveDeskRoot, directorySize, isSessionId, isTrashId, locateSession, projectionCacheRoot, sessionsRoot, } from "./paths.js";
import { TrashStore } from "./trash.js";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_MATCHING_IDS = 1000;
const SNIPPET_CHARS = 160;
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
/** Latest user-sourced message text, used as the row preview. */
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
export class ArchiveDeskService {
    deps;
    busy = new Set();
    trashStore;
    constructor(deps) {
        this.deps = deps;
    }
    /**
     * List the archive set, newest activity first.
     *
     * A session whose directory is gone still appears, with `status: 'missing'`,
     * so the panel can offer to drop the dangling reference.
     */
    async list(request = {}, signal) {
        const workspaces = this.workspaces();
        const items = [];
        for (const id of this.archivedIds()) {
            signal?.throwIfAborted();
            if (!isSessionId(id))
                continue;
            items.push(await this.describe(id, workspaces));
        }
        const filtered = request.query === undefined
            ? items
            : items.filter((item) => matchesQuery(item, request.query ?? ''));
        filtered.sort((left, right) => right.updatedAt - left.updatedAt);
        const limit = clamp(request.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
        const offset = Math.max(0, Math.trunc(request.offset ?? 0));
        const totalBytes = filtered.reduce((sum, item) => sum + item.sizeBytes, 0);
        return {
            total: filtered.length,
            offset,
            limit,
            totalBytes,
            matchingIds: filtered.slice(0, MAX_MATCHING_IDS).map((item) => item.id),
            items: filtered.slice(offset, offset + limit),
        };
    }
    /**
     * Delete archived sessions.
     *
     * Order per item: validate → move or remove the directory → drop the
     * projection cache → detach from its workspace → leave the archive set →
     * announce the removal. Files move first so a failed state write leaves a
     * dangling reference rather than a visible half-deleted session.
     */
    async delete(request) {
        const ids = uniqueStrings(request.ids).filter(isSessionId);
        const mode = request.mode === 'purge' ? 'purge' : 'trash';
        const archived = new Set(this.archivedIds());
        const result = { deleted: [], skipped: [], freedBytes: 0 };
        for (const id of ids) {
            if (this.busy.has(id)) {
                result.skipped.push({ id, reason: 'archive/busy' });
                continue;
            }
            if (!archived.has(id)) {
                result.skipped.push({ id, reason: 'archive/not-archived' });
                continue;
            }
            if (this.deps.isLive?.(id) === true) {
                result.skipped.push({ id, reason: 'archive/live-session' });
                continue;
            }
            this.busy.add(id);
            try {
                result.freedBytes += await this.deleteOne(id, mode);
                result.deleted.push(id);
            }
            catch (error) {
                result.skipped.push({ id, reason: reasonOf(error) });
            }
            finally {
                this.busy.delete(id);
            }
        }
        return result;
    }
    /** Put trashed sessions back where they came from and re-archive them. */
    async restore(request) {
        const trashIds = uniqueStrings(request.trashIds).filter(isTrashId);
        const result = { restored: [], failed: [] };
        for (const trashId of trashIds) {
            try {
                const meta = await this.trash().restore(trashId);
                const workspace = this.workspaces().find((candidate) => samePath(candidate.path, meta.cwd));
                if (workspace !== undefined) {
                    try {
                        await workspace.attachSession?.(meta.sessionId);
                    }
                    catch {
                        // A missing cwd or a removed workspace leaves the session ungrouped.
                    }
                }
                await this.deps.registry?.archiveSession(meta.sessionId);
                result.restored.push(trashId);
            }
            catch (error) {
                result.failed.push({ trashId, reason: reasonOf(error) });
            }
        }
        return result;
    }
    /** Delete recycle-bin entries for good. */
    async purgeTrash(request) {
        const trashIds = uniqueStrings(request.trashIds).filter(isTrashId);
        const result = { purged: [], freedBytes: 0 };
        for (const trashId of trashIds) {
            try {
                result.freedBytes += await this.trash().purge(trashId);
                result.purged.push(trashId);
            }
            catch {
                // A missing entry is already gone; nothing to report but the id.
            }
        }
        return result;
    }
    /** Empty the recycle bin. */
    async emptyTrash() {
        const entries = await this.trash().list();
        return this.purgeTrash({ trashIds: entries.map((entry) => entry.trashId) });
    }
    /** Recycle-bin contents, newest first. */
    async listTrash() {
        return this.trash().list();
    }
    /** Drop archive references whose session directory no longer exists. */
    async cleanDangling() {
        const root = sessionsRoot(this.deps.home);
        const removed = [];
        for (const id of this.archivedIds()) {
            if (!isSessionId(id))
                continue;
            const location = await locateSession(root, id);
            if (location !== undefined)
                continue;
            try {
                await this.deps.registry?.unarchiveSession(id);
                removed.push(id);
            }
            catch {
                // Leave the reference for a later attempt.
            }
        }
        return { removed };
    }
    /** Finish or undo trash entries interrupted by a crash. Run once at startup. */
    async recoverTrash() {
        await this.trash().recover();
    }
    archivedIds() {
        return this.deps.registry?.archivedSessionIds ?? [];
    }
    workspaces() {
        return this.deps.registry?.list() ?? [];
    }
    trash() {
        this.trashStore ??= new TrashStore(join(archiveDeskRoot(this.deps.home), 'trash'));
        return this.trashStore;
    }
    async describe(id, workspaces) {
        const location = await locateSession(sessionsRoot(this.deps.home), id);
        const sizeBytes = location === undefined ? 0 : await directorySize(location.sessionDir);
        let snapshot;
        if (this.deps.sessionQuery !== undefined) {
            try {
                snapshot = await this.deps.sessionQuery.load(id);
            }
            catch {
                // A log that cannot be read costs the preview, not the row.
                snapshot = undefined;
            }
        }
        const events = snapshot?.events ?? [];
        const createdAt = snapshot?.header?.createdAt ?? 0;
        const workspace = workspaces.find((candidate) => candidate.sessionIds?.includes(id) === true);
        const snippet = snippetFromEvents(events);
        const title = titleFromEvents(events) ?? (snippet === '' ? id : snippet.slice(0, 40));
        return {
            id,
            title,
            snippet,
            cwd: snapshot?.header?.cwd,
            workspaceId: workspace?.id,
            workspaceTitle: workspace?.title,
            createdAt,
            updatedAt: updatedAtOf(events, createdAt),
            sizeBytes,
            status: location === undefined ? 'missing' : this.deps.isLive?.(id) === true ? 'live' : 'ok',
        };
    }
    async deleteOne(id, mode) {
        const location = await locateSession(sessionsRoot(this.deps.home), id);
        // Nothing on disk: the reference is the only thing left to drop.
        if (location === undefined) {
            await this.forget(id);
            return 0;
        }
        const item = await this.describe(id, this.workspaces());
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
        await this.forget(id);
        return item.sizeBytes;
    }
    /** Remove every reference the Harness keeps for a deleted session. */
    async forget(id) {
        for (const workspace of this.workspaces()) {
            if (workspace.sessionIds?.includes(id) !== true)
                continue;
            try {
                await workspace.detachSession?.(id);
            }
            catch {
                // The registry prunes candidates that no longer resolve on its next write.
            }
        }
        await this.deps.registry?.unarchiveSession(id);
        this.deps.emitRemoved?.(id);
    }
    async dropProjectionCache(id) {
        try {
            await rm(join(projectionCacheRoot(this.deps.home), `${id}.json`), { force: true });
        }
        catch {
            // A derived cache that cannot be removed is invalidated by the log itself.
        }
    }
}
