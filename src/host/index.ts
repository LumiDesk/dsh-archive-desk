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

import { PROBED_AT_BOOT, recordBoot, type BootStage } from './diagnostics.ts'
import { resolveDshHome } from './paths.ts'

/**
 * The RPC channel this plugin owns. The Client half must use the same string.
 * Must satisfy the Host pattern `^\/[A-Za-z0-9._~-]+$` and may not be `/api`.
 */
export const RPC_CHANNEL = '/archive-desk'

/** Loader entry name; also the display key under the Plugin Manager. */
export const name = 'archive-desk'

/** Service keys the delete transaction depends on (docs/设计.md §10). */
export const PROBED_SERVICES = PROBED_AT_BOOT

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
 * Two ways in: bind immediately when the Connection service is already
 * readable, and keep a deferred injection as the path for a boot-time mount.
 * A bundle installed into a running process can meet a service that exists but
 * is not yet observable through `ctx.inject`, and the reverse order also
 * happens at boot. The first successful bind wins.
 *
 * @param ctx - plugin context; every registration made through it is disposed
 *   when the plugin unloads.
 */
export function apply(ctx: Context): void {
  const home = resolveDshHome()
  const services = probeCapabilities(ctx)
  const boot = (stage: BootStage, error?: string): void => {
    void recordBoot(home, {
      at: new Date().toISOString(),
      stage,
      plugin: name,
      pid: process.pid,
      services,
      ...(error === undefined ? {} : { error }),
    })
  }

  boot('apply-start')

  let bound = false
  const bind = (owner: Context, connection: ConnectionLike): void => {
    if (bound) return
    try {
      const dispose = connection.rpc.handle(RPC_CHANNEL, (endpoint): unknown => {
        if (endpoint === 'status') {
          const payload: StatusPayload = {
            ok: true,
            name,
            capabilities: probeCapabilities(ctx),
          }
          return payload
        }

        // TODO(service): list / delete / restore / purgeTrash / emptyTrash / cleanDangling
        // Each one delegates to the same service the Agent tool calls.
        throw new Error(`archive-desk: unknown endpoint ${JSON.stringify(endpoint)}`)
      })

      // `rpc.handle` registers on the Connection service's own fiber, so without
      // this the channel would outlive this plugin until the next restart.
      owner.effect(() => dispose, 'archive-desk: rpc channel')
      bound = true
      boot('registered')
    } catch (error) {
      boot('bind-error', error instanceof Error ? error.message : String(error))
    }
  }

  const immediate = ctx.get('connection') as ConnectionLike | undefined
  if (immediate !== undefined) bind(ctx, immediate)

  ctx.inject(['connection'], (connectionCtx) => {
    boot('injected')
    const connection = connectionCtx.get('connection') as ConnectionLike | undefined
    if (connection !== undefined) bind(connectionCtx, connection)
  })
}
