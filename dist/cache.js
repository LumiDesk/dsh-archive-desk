/**
 * Persisted list-summary cache.
 *
 * The archive panel needs a title, preview, cwd and timestamps for every
 * archived session. Reading that from the session log means decompressing and
 * replaying the whole log, which is the expensive part of the old list path.
 * Archived logs are effectively immutable, so a summary is reusable until the
 * session directory itself changes.
 *
 * The cache stores only list metadata (never the log), and is keyed by the
 * directory's newest modification time plus its size. A changed log therefore
 * misses the cache even if the session id is the same. The file is derived
 * data: deleting it only costs one rebuild.
 *
 * @see docs/设计.md §5.2, §6
 */
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
const SCHEMA = 1;
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function readRecord(value) {
    if (!isRecord(value))
        return undefined;
    const fingerprint = value.fingerprint;
    if (!isRecord(fingerprint))
        return undefined;
    if (typeof fingerprint.sizeBytes !== 'number' || !Number.isFinite(fingerprint.sizeBytes)) {
        return undefined;
    }
    if (typeof fingerprint.mtimeMs !== 'number' || !Number.isFinite(fingerprint.mtimeMs)) {
        return undefined;
    }
    if (typeof value.sessionId !== 'string')
        return undefined;
    if (typeof value.title !== 'string' || typeof value.snippet !== 'string')
        return undefined;
    if (typeof value.createdAt !== 'number' || typeof value.updatedAt !== 'number')
        return undefined;
    if (value.cwd !== undefined && typeof value.cwd !== 'string')
        return undefined;
    return {
        sessionId: value.sessionId,
        fingerprint: {
            sizeBytes: fingerprint.sizeBytes,
            mtimeMs: fingerprint.mtimeMs,
        },
        title: value.title,
        snippet: value.snippet,
        ...(value.cwd === undefined ? {} : { cwd: value.cwd }),
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
    };
}
export class SummaryCache {
    file;
    entries = new Map();
    loadPromise;
    dirty = false;
    writeChain = Promise.resolve();
    constructor(file) {
        this.file = file;
    }
    /** Read the cache once. A missing or corrupt file is simply an empty cache. */
    load() {
        this.loadPromise ??= this.read();
        return this.loadPromise;
    }
    get(sessionId, fingerprint) {
        const entry = this.entries.get(sessionId);
        if (entry === undefined)
            return undefined;
        if (entry.fingerprint.sizeBytes !== fingerprint.sizeBytes)
            return undefined;
        if (entry.fingerprint.mtimeMs !== fingerprint.mtimeMs)
            return undefined;
        return entry;
    }
    set(record) {
        const current = this.entries.get(record.sessionId);
        if (current !== undefined &&
            current.fingerprint.sizeBytes === record.fingerprint.sizeBytes &&
            current.fingerprint.mtimeMs === record.fingerprint.mtimeMs &&
            current.title === record.title &&
            current.snippet === record.snippet &&
            current.cwd === record.cwd &&
            current.createdAt === record.createdAt &&
            current.updatedAt === record.updatedAt) {
            return;
        }
        this.entries.set(record.sessionId, record);
        this.dirty = true;
    }
    delete(sessionId) {
        if (!this.entries.delete(sessionId))
            return;
        this.dirty = true;
    }
    /** Drop entries that are no longer in the archive set. */
    prune(keep) {
        let changed = false;
        for (const id of this.entries.keys()) {
            if (keep.has(id))
                continue;
            this.entries.delete(id);
            changed = true;
        }
        if (changed)
            this.dirty = true;
    }
    /** Write pending changes now. Resolves after the file is replaced. */
    async flush() {
        if (!this.dirty) {
            // A previous flush may still be writing; callers that await flush()
            // (tests, shutdown) need the file, not just the scheduling decision.
            await this.writeChain;
            return;
        }
        this.dirty = false;
        const payload = { schema: SCHEMA, entries: Object.fromEntries(this.entries) };
        const body = `${JSON.stringify(payload, null, 2)}\n`;
        this.writeChain = this.writeChain.then(async () => {
            const directory = dirname(this.file);
            const temporary = `${this.file}.${randomUUID().slice(0, 8)}.tmp`;
            try {
                // If the harness home itself is gone (test cleanup, uninstall), do
                // not recreate a plugin data directory just to write derived data.
                await stat(dirname(directory));
                await mkdir(directory, { recursive: true });
                await writeFile(temporary, body, { encoding: 'utf8', mode: 0o600 });
                await rename(temporary, this.file);
            }
            catch {
                // The cache is disposable; a failed write must never fail a request.
                this.dirty = true;
            }
        }, async () => {
            this.dirty = true;
        });
        await this.writeChain;
    }
    async read() {
        let parsed;
        try {
            parsed = JSON.parse(await readFile(this.file, 'utf8'));
        }
        catch {
            return;
        }
        if (!isRecord(parsed) || parsed.schema !== SCHEMA || !isRecord(parsed.entries))
            return;
        for (const value of Object.values(parsed.entries)) {
            const record = readRecord(value);
            if (record !== undefined)
                this.entries.set(record.sessionId, record);
        }
    }
}
