/**
 * Read side of the archive desk: turn the registry's archive set into rows a UI
 * or an Agent can list.
 *
 * The service depends on narrow interfaces instead of the Host Context, so the
 * whole read path is unit-testable without a running Harness.
 *
 * @see docs/设计.md §4.3, §5.3
 */
import { directorySize, isSessionId, locateSession, sessionsRoot } from "./paths.js";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
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
export class ArchiveDeskService {
    deps;
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
        const registry = this.deps.registry;
        const ids = registry === undefined ? [] : [...registry.archivedSessionIds];
        const workspaces = registry?.list() ?? [];
        const items = [];
        for (const id of ids) {
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
            items: filtered.slice(offset, offset + limit),
        };
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
}
