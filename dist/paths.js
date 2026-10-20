/**
 * Filesystem layout and path safety for the archive desk.
 *
 * Everything here is pure path work: the plugin never guesses a layout it has
 * not verified. A missing directory means "not found", never "recreate it".
 *
 * @see docs/设计.md §5.1, §6.1, §10
 */
import { lstat, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
/**
 * A session id as DSH writes it. Deliberately stricter than "no separators":
 * the id becomes a directory name, and it travels through RPC.
 */
const SESSION_ID_PATTERN = /^session-[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;
/** A trash entry directory name. */
const TRASH_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,160}$/;
export class ArchiveDeskError extends Error {
    code;
    constructor(code, message, options) {
        super(message, options);
        this.name = 'ArchiveDeskError';
        this.code = code;
    }
}
/**
 * Resolve the harness home the same way DSH does: an explicit `DSH_HOME`
 * wins, otherwise `~/.dsh`.
 */
export function resolveDshHome(env = process.env) {
    const fromEnv = env.DSH_HOME?.trim();
    return fromEnv ? resolve(fromEnv) : join(homedir(), '.dsh');
}
export function sessionsRoot(home) {
    return join(home, 'sessions');
}
export function projectionCacheRoot(home) {
    return join(home, 'storages', 'session_projcache', 'sessions');
}
/** Plugin-owned data: settings and the recycle bin. */
export function archiveDeskRoot(home) {
    return join(home, 'archive-desk');
}
export function isSessionId(value) {
    return typeof value === 'string' && SESSION_ID_PATTERN.test(value);
}
export function isTrashId(value) {
    return typeof value === 'string' && TRASH_ID_PATTERN.test(value);
}
/**
 * True when `target` is strictly inside `root` (not equal to it, not outside).
 * Used before every move/delete so a crafted id can never escape the store.
 */
export function isWithin(root, target) {
    const rel = relative(resolve(root), resolve(target));
    if (rel === '' || isAbsolute(rel))
        return false;
    return !rel.startsWith('..') && !rel.startsWith(`..${sep}`);
}
/**
 * Locate one session's directory by scanning shard directories.
 *
 * The directory name is the identity; the log file name (`session.v4.jsonl.zstd`)
 * carries a format version and is deliberately not part of the lookup.
 *
 * @returns the location, or `undefined` when no shard holds it.
 * @throws ArchiveDeskError `archive/not-found` when the same id appears twice.
 */
export async function locateSession(root, sessionId) {
    if (!isSessionId(sessionId))
        return undefined;
    let shards;
    try {
        shards = await readdir(root);
    }
    catch {
        return undefined;
    }
    const matches = [];
    for (const shard of shards) {
        const shardDir = join(root, shard);
        const sessionDir = join(shardDir, sessionId);
        if (!isWithin(root, sessionDir))
            continue;
        try {
            const entry = await lstat(sessionDir);
            if (!entry.isDirectory() || entry.isSymbolicLink())
                continue;
        }
        catch {
            continue;
        }
        matches.push({ shardDir, sessionDir });
    }
    if (matches.length > 1) {
        throw new ArchiveDeskError('archive/not-found', `session ${JSON.stringify(sessionId)} exists in more than one workspace shard`);
    }
    return matches[0];
}
/**
 * Total bytes of one directory tree. Symbolic links are not followed: the log
 * store never contains them, and following one could size an unrelated tree.
 */
export async function directorySize(dir) {
    let total = 0;
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    }
    catch {
        return 0;
    }
    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            total += await directorySize(full);
        }
        else if (entry.isFile()) {
            try {
                total += (await stat(full)).size;
            }
            catch {
                // A file that vanished mid-scan contributes nothing.
            }
        }
    }
    return total;
}
/**
 * Fail early when a move would cross volumes: `rename` would throw EXDEV and
 * a copy fallback would double the disk cost of a delete.
 */
export function assertSameVolume(from, to) {
    const fromRoot = parse(resolve(from)).root.toLowerCase();
    const toRoot = parse(resolve(to)).root.toLowerCase();
    if (fromRoot !== toRoot) {
        throw new ArchiveDeskError('archive/cross-device', `cannot move ${JSON.stringify(from)} to ${JSON.stringify(to)}: different volumes`);
    }
}
