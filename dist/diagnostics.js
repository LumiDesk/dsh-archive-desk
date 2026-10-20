/**
 * Activation diagnostics.
 *
 * A Host plugin that silently fails to bind is indistinguishable from one that
 * was never installed, and the desktop build exposes no host log. Every
 * activation therefore records its stages under the plugin's own data
 * directory, so "why is the panel missing" has an answer on disk.
 *
 * The file keeps the last few events instead of one snapshot: a plugin can
 * activate more than once per process, and the interesting question is usually
 * "which stage did each attempt reach".
 *
 * Writing never throws and never blocks activation.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { archiveDeskRoot } from "./paths.js";
/** Service names worth recording; the plugin degrades when any is absent. */
export const PROBED_AT_BOOT = [
    'connection',
    'webServer',
    'tools',
    'workspaceRegistry',
    'sessionQuery',
    'sessions',
    'agents',
];
/** Keep the file small; a runaway activation loop must not grow it forever. */
const MAX_EVENTS = 20;
async function readEvents(target) {
    try {
        const parsed = JSON.parse(await readFile(target, 'utf8'));
        return Array.isArray(parsed.events) ? parsed.events.slice(-MAX_EVENTS) : [];
    }
    catch {
        return [];
    }
}
/**
 * Serialize writes inside this process: every event is a read-modify-write of
 * one file, and activation records arrive back to back, so an unserialized
 * pair would drop the earlier stage.
 */
let writeQueue = Promise.resolve();
async function appendEvent(home, event) {
    try {
        const directory = archiveDeskRoot(home);
        await mkdir(directory, { recursive: true });
        const target = join(directory, 'last-boot.json');
        const events = [...(await readEvents(target)), event].slice(-MAX_EVENTS);
        const record = {
            plugin: 'archive-desk',
            updatedAt: event.at,
            events,
        };
        // A shared temporary name let two concurrent activations interleave their
        // writes; every write owns its own temporary file.
        const temporary = `${target}.${randomUUID().slice(0, 8)}.tmp`;
        await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
        await rename(temporary, target);
    }
    catch {
        // Diagnostics must never take the plugin down.
    }
}
/**
 * Append one activation event. Calls are serialized in arrival order; the
 * returned promise never rejects.
 */
export function recordBoot(home, event) {
    writeQueue = writeQueue.then(() => appendEvent(home, event), () => appendEvent(home, event));
    return writeQueue;
}
