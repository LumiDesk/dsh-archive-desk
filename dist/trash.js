/**
 * The recycle bin: a trash entry is a directory holding `meta.json` plus the
 * moved session directory as `payload/`.
 *
 * There is no index file. The bin is its own source of truth, so a crash can
 * only leave one entry in a recoverable `moving` phase, never a stale pointer.
 *
 * @see docs/设计.md §5.2, §6.2, §6.6
 */
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { ArchiveDeskError, assertSameVolume, directorySize, isTrashId } from "./paths.js";
const META_FILE = 'meta.json';
const PAYLOAD_DIR = 'payload';
/** `<UTC timestamp>-<session id>`; filesystem-safe by construction. */
export function makeTrashId(sessionId, now = new Date()) {
    const stamp = now.toISOString().replace(/[-:.]/g, '').replace('Z', '');
    return `${stamp}-${sessionId}`;
}
async function readMeta(entryDir) {
    try {
        const raw = await readFile(join(entryDir, META_FILE), 'utf8');
        const parsed = JSON.parse(raw);
        return parsed.schema === 1 && typeof parsed.sessionId === 'string' ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
async function writeMeta(entryDir, meta) {
    const target = join(entryDir, META_FILE);
    const temporary = `${target}.tmp-${randomUUID().slice(0, 8)}`;
    await writeFile(temporary, JSON.stringify(meta, null, 2), 'utf8');
    await rename(temporary, target);
}
async function isDirectory(path) {
    try {
        return (await stat(path)).isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * One bin directory. Every method takes the trash id, never a path, so a
 * caller cannot address anything outside the bin.
 */
export class TrashStore {
    root;
    constructor(root) {
        this.root = resolve(root);
    }
    async ensure() {
        await mkdir(this.root, { recursive: true });
    }
    /**
     * Move a session directory into the bin.
     *
     * Order matters: metadata is written first (`moving`), then the directory is
     * renamed, then the metadata flips to `ready`. A crash at any point leaves a
     * state `recover()` can finish or undo.
     */
    async create(input) {
        const now = input.now ?? new Date();
        const trashId = makeTrashId(input.sessionId, now);
        const entryDir = join(this.root, trashId);
        const payloadDir = join(entryDir, PAYLOAD_DIR);
        const originalPath = resolve(input.sessionDir);
        assertSameVolume(originalPath, payloadDir);
        await this.ensure();
        await mkdir(entryDir, { recursive: true });
        const meta = {
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
        };
        await writeMeta(entryDir, meta);
        try {
            await rename(originalPath, payloadDir);
        }
        catch (error) {
            // Nothing moved: remove the half-written entry so the bin stays clean.
            await rm(entryDir, { recursive: true, force: true });
            throw new ArchiveDeskError('archive/bad-request', `cannot move ${JSON.stringify(originalPath)} into the recycle bin`, { cause: error });
        }
        const ready = { ...meta, phase: 'ready' };
        await writeMeta(entryDir, ready);
        return ready;
    }
    /** Ready entries, newest first. Entries mid-move are recovered at startup. */
    async list() {
        let names;
        try {
            names = await readdir(this.root);
        }
        catch {
            return [];
        }
        const entries = [];
        for (const name of names) {
            if (!isTrashId(name))
                continue;
            const entryDir = join(this.root, name);
            const meta = await readMeta(entryDir);
            if (meta === undefined || meta.phase !== 'ready')
                continue;
            if (!(await isDirectory(join(entryDir, PAYLOAD_DIR))))
                continue;
            entries.push(meta);
        }
        entries.sort((left, right) => right.movedAt.localeCompare(left.movedAt));
        return entries;
    }
    /**
     * Put a session directory back where it came from.
     *
     * @returns the stored metadata, so the caller can re-archive the session.
     * @throws ArchiveDeskError `archive/restore-conflict` when the target exists.
     */
    async restore(trashId) {
        const entryDir = this.resolveEntry(trashId);
        const meta = await readMeta(entryDir);
        if (meta === undefined || meta.phase !== 'ready') {
            throw new ArchiveDeskError('archive/trash-corrupt', `trash entry ${trashId} is not restorable`);
        }
        const payloadDir = join(entryDir, PAYLOAD_DIR);
        if (!(await isDirectory(payloadDir))) {
            throw new ArchiveDeskError('archive/trash-corrupt', `trash entry ${trashId} has no payload`);
        }
        if (!isTrashId(meta.trashId) || meta.trashId !== trashId) {
            throw new ArchiveDeskError('archive/trash-corrupt', `trash entry ${trashId} has stale metadata`);
        }
        if (await isDirectory(meta.originalPath)) {
            throw new ArchiveDeskError('archive/restore-conflict', `cannot restore ${meta.sessionId}: ${JSON.stringify(meta.originalPath)} already exists`);
        }
        await mkdir(dirname(meta.originalPath), { recursive: true });
        await rename(payloadDir, meta.originalPath);
        await rm(entryDir, { recursive: true, force: true });
        return meta;
    }
    /**
     * Delete one entry for good.
     *
     * @returns bytes freed.
     */
    async purge(trashId) {
        const entryDir = this.resolveEntry(trashId);
        const meta = await readMeta(entryDir);
        const payloadDir = join(entryDir, PAYLOAD_DIR);
        const size = (await isDirectory(payloadDir))
            ? await directorySize(payloadDir)
            : (meta?.sizeBytes ?? 0);
        await rm(entryDir, { recursive: true, force: true });
        return size;
    }
    /** Finish or undo entries interrupted mid-move. Run once at plugin startup. */
    async recover() {
        const report = { recovered: [], dropped: [], corrupt: [] };
        let names;
        try {
            names = await readdir(this.root);
        }
        catch {
            return report;
        }
        for (const name of names) {
            if (!isTrashId(name))
                continue;
            const entryDir = join(this.root, name);
            const meta = await readMeta(entryDir);
            if (meta === undefined) {
                report.corrupt.push(name);
                continue;
            }
            const payloadExists = await isDirectory(join(entryDir, PAYLOAD_DIR));
            if (meta.phase === 'moving') {
                if (payloadExists) {
                    await writeMeta(entryDir, { ...meta, phase: 'ready' });
                    report.recovered.push(name);
                }
                else {
                    await rm(entryDir, { recursive: true, force: true });
                    report.dropped.push(name);
                }
            }
            else if (!payloadExists) {
                report.corrupt.push(name);
            }
        }
        return report;
    }
    resolveEntry(trashId) {
        if (!isTrashId(trashId)) {
            throw new ArchiveDeskError('archive/bad-request', `invalid trash id ${JSON.stringify(trashId)}`);
        }
        return join(this.root, trashId);
    }
}
