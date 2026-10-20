/**
 * The RPC channel this plugin owns. The Client half must use the same string.
 * Must satisfy the Host pattern `^\/[A-Za-z0-9._~-]+$` and may not be `/api`.
 */
export const RPC_CHANNEL = '/archive-desk';
/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'archive-desk';
/**
 * Service keys the delete transaction depends on (docs/设计.md §10). Probed at
 * request time rather than plugin activation so a profile without one of them
 * still loads and reports what is missing.
 */
export const PROBED_SERVICES = [
    'sessionQuery',
    'sessions',
    'agents',
    'workspaceRegistry',
    'tools',
];
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
 * `ctx.inject` (rather than a static `inject` export) keeps the plugin loading
 * in a profile without a Web GUI: this Cordis version normalizes an exported
 * `inject` object key-by-key into required services, so an `{ optional: [...] }`
 * shape waits forever for a service literally named "optional".
 *
 * @param ctx - plugin context; every registration made through it is disposed
 *   when the plugin unloads.
 */
export function apply(ctx) {
    ctx.inject(['connection'], (connectionCtx) => {
        const connection = connectionCtx.get('connection');
        if (connection === undefined)
            return;
        const dispose = connection.rpc.handle(RPC_CHANNEL, (endpoint) => {
            if (endpoint === 'status') {
                const payload = {
                    ok: true,
                    name,
                    capabilities: probeCapabilities(connectionCtx),
                };
                return payload;
            }
            // TODO(service): list / delete / restore / purgeTrash / emptyTrash / cleanDangling
            // Each one delegates to the same service the Agent tool calls.
            throw new Error(`archive-desk: unknown endpoint ${JSON.stringify(endpoint)}`);
        });
        // `rpc.handle` registers on the Connection service's own fiber, so without
        // this the channel would outlive this plugin until the next restart.
        connectionCtx.effect(() => dispose, 'archive-desk: rpc channel');
    });
}
