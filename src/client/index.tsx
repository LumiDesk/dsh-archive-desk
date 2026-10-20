/**
 * dsh-archive-desk — Client half.
 *
 * Scaffold stage: no slot is registered yet, so installing the bundle changes
 * nothing visible. The first implementation step registers two occupants that
 * share one panel id (docs/设计.md §4.4):
 *
 *   sidebar.panellist  id: 'archive-desk'   — the sidebar icon
 *   main               key: 'archive-desk'  — the management page
 *
 * The bundle runner calls `create(require)` inside the module-loader factory,
 * so `require` is the page's module table (React and the jsx runtime come from
 * there) and must not be replaced by a bundled copy.
 */

/** The subset of the Client context this plugin uses; grows with the panel. */
export interface ClientContext {
  slots: unknown
}

export interface ClientPlugin {
  inject: string[]
  apply(ctx: ClientContext): void
}

/**
 * Build the plugin object the bundle runner registers.
 *
 * @param require - the page module table; kept for React and the jsx runtime.
 */
export function create(_require: (id: string) => unknown): ClientPlugin {
  return {
    inject: ['slots'],
    apply(_ctx) {
      // TODO(panel): ctx.slots.inject('sidebar.panellist', ...)
      // TODO(panel): ctx.slots.inject('main', ...)
    },
  }
}
