/**
 * Activation diagnostics.
 *
 * A Host plugin that silently fails to bind is indistinguishable from one that
 * was never installed, and the desktop build exposes no host log. Every
 * activation therefore rewrites one small record under the plugin's own data
 * directory, so "why is the panel missing" has an answer on disk.
 *
 * Writing never throws and never blocks activation.
 */
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { archiveDeskRoot } from "./paths.js";
/** Service names worth recording; the plugin degrades when any is absent. */
export const PROBED_AT_BOOT = [
    'connection',
    'webServer',
    'tools',
    'workspaceRegistry',
    'sessionQuery',
];
export async function recordBoot(home, record) {
    try {
        const directory = archiveDeskRoot(home);
        await mkdir(directory, { recursive: true });
        const target = join(directory, 'last-boot.json');
        const temporary = `${target}.tmp`;
        await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
        await rename(temporary, target);
    }
    catch {
        // Diagnostics must never take the plugin down.
    }
}
