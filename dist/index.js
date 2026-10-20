import { PROBED_AT_BOOT, recordBoot } from "./diagnostics.js";
import { resolveDshHome } from "./paths.js";
/**
 * The RPC channel this plugin owns. The Client half must use the same string.
 * Must satisfy the Host pattern `^\/[A-Za-z0-9._~-]+$` and may not be `/api`.
 */
export const RPC_CHANNEL = '/archive-desk';
/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'archive-desk';
/** Service keys the delete transaction depends on (docs/设计.md §10). */
export const PROBED_SERVICES = PROBED_AT_BOOT;
/**
 * Probe the Host services the delete transaction depends on.
 *
 * @param ctx - any Host context that can read services; the plugin context works.
 */
export function probeCapabilities(ctx) {
    const capabilities = {};
    for (const key of PROBED_SERVICES)
        capabilities[key] = ctx.get(key) !== undefined;
    return capabilities;
}
/**
 * Register the plugin's Host surface.
 *
 * Two ways in: bind immediately when the Connection service is already
 * readable, and keep a deferred injection as the path for a boot-time mount.
 * A bundle installed into a running process can meet a service that exists but
 * is not yet observable through `ctx.inject`, and the reverse order also
 * happens at boot. The first successful bind wins.
 *
 * @param ctx - plugin context; every registration made through it is disposed
 *   when the plugin unloads.
 */
export function apply(ctx) {
    const home = resolveDshHome();
    const services = probeCapabilities(ctx);
    const boot = (stage, error) => {
        void recordBoot(home, {
            at: new Date().toISOString(),
            stage,
            plugin: name,
            pid: process.pid,
            services,
            ...(error === undefined ? {} : { error }),
        });
    };
    boot('apply-start');
    let bound = false;
    const bind = (owner, connection) => {
        if (bound)
            return;
        try {
            const dispose = connection.rpc.handle(RPC_CHANNEL, (endpoint) => {
                if (endpoint === 'status') {
                    const payload = {
                        ok: true,
                        name,
                        capabilities: probeCapabilities(ctx),
                    };
                    return payload;
                }
                // TODO(service): list / delete / restore / purgeTrash / emptyTrash / cleanDangling
                // Each one delegates to the same service the Agent tool calls.
                throw new Error(`archive-desk: unknown endpoint ${JSON.stringify(endpoint)}`);
            });
            // `rpc.handle` registers on the Connection service's own fiber, so without
            // this the channel would outlive this plugin until the next restart.
            owner.effect(() => dispose, 'archive-desk: rpc channel');
            bound = true;
            boot('registered');
        }
        catch (error) {
            boot('bind-error', error instanceof Error ? error.message : String(error));
        }
    };
    const immediate = ctx.get('connection');
    if (immediate !== undefined)
        bind(ctx, immediate);
    ctx.inject(['connection'], (connectionCtx) => {
        boot('injected');
        const connection = connectionCtx.get('connection');
        if (connection !== undefined)
            bind(connectionCtx, connection);
    });
}
