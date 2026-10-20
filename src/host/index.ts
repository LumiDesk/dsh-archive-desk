/**
 * dsh-archive-desk — Host half.
 *
 * Scaffold stage: the plugin answers one `status` request and nothing else.
 * Destructive operations land in `src/host/service.ts` once the design in
 * docs/设计.md is confirmed; every one of them is reachable from both the Web UI
 * and the Agent tool through the same service method.
 *
 * Transport note: this plugin registers its own prefix route instead of using
 * `connection.rpc.handle()`. That helper registers through the Connection
 * service's own context, which cannot read `webServer` in a composed profile
 * (observed: `cannot get property "webServer" without inject`), so it fails on
 * the first call. A plain route plus `connection.requestRejection()` is the
 * same authorization path the shipped host plugins use.
 *
 * @see docs/设计.md §4.2 (transport), §6 (delete transaction), §10 (compat)
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

import type { Context } from '@deepseek-ai/cordis'

import { PROBED_AT_BOOT, recordBoot, type BootStage } from './diagnostics.ts'
import { ArchiveDeskError, resolveDshHome } from './paths.ts'

/** HTTP prefix this plugin owns. The Client half must use the same string. */
export const ROUTE_PATH = '/archive-desk'

/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'archive-desk'

/** Service keys the delete transaction depends on (docs/设计.md §10). */
export const PROBED_SERVICES = PROBED_AT_BOOT

export type ProbedService = (typeof PROBED_SERVICES)[number]

export type Capabilities = Record<ProbedService, boolean>

/** Requests above this size are refused before parsing. */
const MAX_BODY_BYTES = 64 * 1024

/**
 * The subset of the two Host services this plugin uses. Declared locally until
 * the service layer needs the upstream package types; importing every
 * `@deepseek-ai/dsh-*` package only to type two methods is not worth the
 * dependency weight for a scaffold.
 */
interface WebServerLike {
  register(route: {
    kind: 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

interface ConnectionLike {
  requestRejection(request: IncomingMessage): number | undefined
}

export interface StatusPayload {
  ok: true
  name: string
  capabilities: Capabilities
}

export interface SuccessEnvelope {
  ok: true
  value: unknown
}

export interface ErrorEnvelope {
  ok: false
  error: { code: string; message: string }
}

/**
 * Probe the Host services the delete transaction depends on.
 *
 * @param ctx - any Host context that can read services; the plugin context works.
 */
export function probeCapabilities(ctx: Context): Capabilities {
  const capabilities = {} as Capabilities
  for (const key of PROBED_SERVICES) capabilities[key] = ctx.get(key) !== undefined
  return capabilities
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  const envelope: ErrorEnvelope = { ok: false, error: { code, message } }
  sendJson(res, status, envelope)
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += buffer.length
    if (size > MAX_BODY_BYTES) {
      throw new ArchiveDeskError('archive/bad-request', 'request body exceeds the size limit')
    }
    chunks.push(buffer)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new ArchiveDeskError('archive/bad-request', 'request body is not JSON')
  }
}

/** `/archive-desk/list` → `list`; anything else → `undefined`. */
export function endpointOf(url: string | undefined): string | undefined {
  const pathname = new URL(url ?? '/', 'http://localhost').pathname
  const prefix = `${ROUTE_PATH}/`
  if (!pathname.startsWith(prefix)) return undefined
  const endpoint = pathname.slice(prefix.length)
  if (endpoint.length === 0 || endpoint.includes('/')) return undefined
  return endpoint
}

/**
 * Dispatch one endpoint call. Shared by the HTTP route today and by any future
 * in-process caller (the Agent tool uses the same service behind it).
 */
export async function dispatch(
  ctx: Context,
  endpoint: string,
  _payload: unknown,
): Promise<unknown> {
  if (endpoint === 'status') {
    const value: StatusPayload = { ok: true, name, capabilities: probeCapabilities(ctx) }
    return value
  }

  // TODO(service): list / delete / restore / purgeTrash / emptyTrash / cleanDangling
  throw new ArchiveDeskError('archive/bad-request', `unknown endpoint ${JSON.stringify(endpoint)}`)
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
export function apply(ctx: Context): void {
  const home = resolveDshHome()
  const boot = (stage: BootStage, error?: string): void => {
    void recordBoot(home, {
      at: new Date().toISOString(),
      stage,
      plugin: name,
      pid: process.pid,
      services: probeCapabilities(ctx),
      ...(error === undefined ? {} : { error }),
    })
  }

  boot('apply-start')

  ctx.inject(['webServer'], (webCtx) => {
    boot('injected')

    const webServer = webCtx.get('webServer') as WebServerLike | undefined
    const connection = webCtx.get('connection') as ConnectionLike | undefined
    if (webServer === undefined) {
      boot('bind-error', 'webServer service is not readable')
      return
    }
    if (connection === undefined) {
      boot('bind-error', 'connection service is not readable')
      return
    }

    try {
      const dispose = webServer.register({
        kind: 'prefix',
        path: ROUTE_PATH,
        handler: async (req, res) => {
          const rejection = connection.requestRejection(req)
          if (rejection !== undefined) {
            res.statusCode = rejection
            res.end()
            return
          }
          if (req.method !== 'POST') {
            res.setHeader('allow', 'POST')
            res.statusCode = 405
            res.end()
            return
          }
          const endpoint = endpointOf(req.url)
          if (endpoint === undefined) {
            sendError(res, 404, 'archive/bad-request', 'unknown endpoint')
            return
          }
          try {
            const payload = await readJsonBody(req)
            const value = await dispatch(ctx, endpoint, payload)
            const envelope: SuccessEnvelope = { ok: true, value }
            sendJson(res, 200, envelope)
          } catch (error) {
            if (error instanceof ArchiveDeskError) {
              sendError(res, 400, error.code, error.message)
              return
            }
            sendError(res, 500, 'archive/internal', 'internal error')
          }
        },
      })

      webCtx.effect(() => dispose, 'archive-desk: http route')
      boot('registered')
    } catch (error) {
      boot('bind-error', error instanceof Error ? error.message : String(error))
    }
  })
}
