import { PROBED_AT_BOOT, recordBoot } from "./diagnostics.js";
import { ArchiveDeskError, resolveDshHome } from "./paths.js";
import { ArchiveDeskService, } from "./service.js";
/** HTTP prefix this plugin owns. The Client half must use the same string. */
export const ROUTE_PATH = '/archive-desk';
/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'archive-desk';
/** Service keys the delete transaction depends on (docs/设计.md §10). */
export const PROBED_SERVICES = PROBED_AT_BOOT;
/** Requests above this size are refused before parsing. */
const MAX_BODY_BYTES = 64 * 1024;
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
function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify(body));
}
function sendError(res, status, code, message) {
    const envelope = { ok: false, error: { code, message } };
    sendJson(res, status, envelope);
}
async function readJsonBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_BODY_BYTES) {
            throw new ArchiveDeskError('archive/bad-request', 'request body exceeds the size limit');
        }
        chunks.push(buffer);
    }
    if (size === 0)
        return {};
    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    catch {
        throw new ArchiveDeskError('archive/bad-request', 'request body is not JSON');
    }
}
/** `/archive-desk/list` → `list`; anything else → `undefined`. */
export function endpointOf(url) {
    const pathname = new URL(url ?? '/', 'http://localhost').pathname;
    const prefix = `${ROUTE_PATH}/`;
    if (!pathname.startsWith(prefix))
        return undefined;
    const endpoint = pathname.slice(prefix.length);
    if (endpoint.length === 0 || endpoint.includes('/'))
        return undefined;
    return endpoint;
}
/**
 * Build the service from whatever the Host currently exposes. Every dependency
 * is optional: a profile without `workspaceRegistry` still answers `status` and
 * reports what is missing instead of failing the request.
 */
export function createService(ctx) {
    const registry = ctx.get('workspaceRegistry');
    const sessionQuery = ctx.get('sessionQuery');
    const agents = ctx.get('agents');
    const sessions = ctx.get('sessions');
    return new ArchiveDeskService({
        home: resolveDshHome(),
        registry,
        sessionQuery,
        isLive: (id) => agents?.get(id) !== undefined || sessions?.get(id) !== undefined,
        emitRemoved: (id) => {
            // Declared Host event: `api-session/removed(sessionId)` drops the row
            // from every connected sidebar without waiting for a restart.
            try {
                ;
                ctx.emit('api-session/removed', id);
            }
            catch {
                // The next list refresh still converges.
            }
        },
    });
}
/**
 * Dispatch one endpoint call. Shared by the HTTP route today and by any future
 * in-process caller (the Agent tool uses the same service behind it).
 */
export async function dispatch(ctx, endpoint, payload) {
    if (endpoint === 'status') {
        const value = { ok: true, name, capabilities: probeCapabilities(ctx) };
        return value;
    }
    const service = createService(ctx);
    switch (endpoint) {
        case 'list':
            return service.list((payload ?? {}));
        case 'listTrash':
            return service.listTrash();
        case 'delete':
            return service.delete((payload ?? {}));
        case 'restore':
            return service.restore((payload ?? {}));
        case 'purgeTrash':
            return service.purgeTrash((payload ?? {}));
        case 'emptyTrash':
            return service.emptyTrash();
        case 'cleanDangling':
            return service.cleanDangling();
        default:
            throw new ArchiveDeskError('archive/bad-request', `unknown endpoint ${JSON.stringify(endpoint)}`);
    }
}
/**
 * Register the plugin's Host surface.
 *
 * A profile bundle can be mounted into a running process, so the Web server is
 * reached through a deferred injection rather than a property read at apply
 * time. Every activation records its stage under the plugin's data directory,
 * because the desktop build exposes no host log.
 *
 * @param ctx - plugin context; every registration made through it is disposed
 *   when the plugin unloads.
 */
export function apply(ctx) {
    const home = resolveDshHome();
    const boot = (stage, error) => {
        void recordBoot(home, {
            at: new Date().toISOString(),
            stage,
            pid: process.pid,
            services: probeCapabilities(ctx),
            ...(error === undefined ? {} : { error }),
        });
    };
    boot('apply-start');
    // Finish or undo trash entries interrupted by an earlier crash. Pure
    // filesystem work, so it does not wait for any Host service.
    void createService(ctx).recoverTrash();
    // Both services are injected: the route needs the server, the handler needs
    // the trust check, and `webServer` alone can activate while `connection` is
    // still booting. Waiting for both removes that ordering window.
    ctx.inject(['webServer', 'connection'], (webCtx) => {
        boot('injected');
        let webServer;
        let connection;
        try {
            // The injected context resolves services as properties; the local
            // interface keeps that contract without the upstream service types.
            const deps = webCtx;
            webServer = deps.webServer;
            connection = deps.connection;
        }
        catch (error) {
            boot('bind-error', error instanceof Error ? error.message : String(error));
            return;
        }
        try {
            const dispose = webServer.register({
                kind: 'prefix',
                path: ROUTE_PATH,
                handler: async (req, res) => {
                    const rejection = connection.requestRejection(req);
                    if (rejection !== undefined) {
                        res.statusCode = rejection;
                        res.end();
                        return;
                    }
                    if (req.method !== 'POST') {
                        res.setHeader('allow', 'POST');
                        res.statusCode = 405;
                        res.end();
                        return;
                    }
                    const endpoint = endpointOf(req.url);
                    if (endpoint === undefined) {
                        sendError(res, 404, 'archive/bad-request', 'unknown endpoint');
                        return;
                    }
                    try {
                        const payload = await readJsonBody(req);
                        const value = await dispatch(ctx, endpoint, payload);
                        const envelope = { ok: true, value };
                        sendJson(res, 200, envelope);
                    }
                    catch (error) {
                        if (error instanceof ArchiveDeskError) {
                            sendError(res, 400, error.code, error.message);
                            return;
                        }
                        sendError(res, 500, 'archive/internal', 'internal error');
                    }
                },
            });
            webCtx.effect(() => dispose, 'archive-desk: http route');
            boot('registered');
        }
        catch (error) {
            boot('bind-error', error instanceof Error ? error.message : String(error));
        }
    });
}
