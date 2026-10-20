/**
 * dsh-archive-desk — Host half.
 *
 * Scaffold stage: the plugin reports the Host capabilities it can use and
 * nothing else. Destructive operations land in `src/host/service.ts` once the
 * design in docs/设计.md is confirmed; every one of them is reachable from both
 * the Web UI and the Agent tool through the same service method.
 *
 * @see docs/设计.md §4.2 (Connection RPC), §6 (delete transaction), §10 (compat)
 */
import type { Context } from '@deepseek-ai/cordis'

/**
 * The RPC channel this plugin owns. The Client half must use the same string.
 * Must satisfy the Host pattern `^\/[A-Za-z0-9._~-]+$` and may not be `/api`.
 */
export const RPC_CHANNEL = '/archive-desk'

/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'archive-desk'

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
] as const

export type ProbedService = (typeof PROBED_SERVICES)[number]

export type Capabilities = Record<ProbedService, boolean>

/**
 * The subset of the Connection service this plugin uses. Declared locally
 * until the service layer needs the upstream package types: importing every
 * `@deepseek-ai/dsh-*` package only to type one method is not worth the
 * dependency weight for a scaffold.
 */
interface ConnectionLike {
  rpc: {
    handle(channel: string, handler: (endpoint: string) => unknown): () => void
  }
}

export interface StatusPayload {
  ok: true
  name: string
  capabilities: Capabilities
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
export function apply(ctx: Context): void {
  ctx.inject(['connection'], (connectionCtx) => {
    const connection = connectionCtx.get('connection') as ConnectionLike | undefined
    if (connection === undefined) return

    const dispose = connection.rpc.handle(RPC_CHANNEL, (endpoint): unknown => {
      if (endpoint === 'status') {
        const payload: StatusPayload = {
          ok: true,
          name,
          capabilities: probeCapabilities(connectionCtx),
        }
        return payload
      }

      // TODO(service): list / delete / restore / purgeTrash / emptyTrash / cleanDangling
      // Each one delegates to the same service the Agent tool calls.
      throw new Error(`archive-desk: unknown endpoint ${JSON.stringify(endpoint)}`)
    })

    // `rpc.handle` registers on the Connection service's own fiber, so without
    // this the channel would outlive this plugin until the next restart.
    connectionCtx.effect(() => dispose, 'archive-desk: rpc channel')
  })
}
