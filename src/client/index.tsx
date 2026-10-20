/**
 * dsh-archive-desk — Client half.
 *
 * Registers one sidebar icon and one full-page panel that share the panel id
 * `archive-desk` (docs/设计.md §4.4). The page itself lives in `page.tsx`; this
 * file owns the registration surface, dictionaries and the sidebar menu row.
 */
import { dictionaries } from './locales'
import { ArchiveDeskPage } from './page'
import { requestDeletion } from './pending'
import { STYLES } from './styles'

const PANEL_ID = 'archive-desk'
const NS = 'archive-desk'

type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * Sidebar glyph. Monochrome on purpose: the sidebar renders icons in the
 * theme's own label color, so the stroke follows light/dark without a
 * hardcoded brand color.
 */
function ArchiveDeskIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect x="3" y="4" width="18" height="4.5" rx="1.5" fill="currentColor" fillOpacity="0.12" />
      <path d="M4.75 8.5v9.75A1.75 1.75 0 0 0 6.5 20h11a1.75 1.75 0 0 0 1.75-1.75V8.5" />
      <path d="M12 11.6v4.6" />
      <path d="m9.9 14.3 2.1 2.1 2.1-2.1" />
    </svg>
  )
}

interface MenuRowProps {
  sessionId: string
  displayTitle?: string
  useWorkspaces: (
    selector: (state: { archivedSessionIds: readonly string[] }) => boolean,
  ) => boolean
  useMenuOpenState: () => [boolean, (open: boolean) => void]
  t: Translate
  openPanel: () => void
}

/**
 * One row in a session's "…" menu, only for sessions that are archived. It
 * hands the request to the panel instead of carrying a second delete path.
 */
function SessionMenuDelete(props: MenuRowProps) {
  const { sessionId, displayTitle, useWorkspaces, useMenuOpenState, t, openPanel } = props
  const [, setMenuOpen] = useMenuOpenState()
  const archived = useWorkspaces((state) => state.archivedSessionIds.includes(sessionId))

  if (!archived) return null

  return (
    <button
      type="button"
      role="menuitem"
      className="adk-menu-row"
      onClick={() => {
        setMenuOpen(false)
        requestDeletion([sessionId], displayTitle)
        openPanel()
      }}
    >
      {t('menu.delete')}
    </button>
  )
}

export interface ClientContext {
  slots: {
    inject(name: string, register: () => unknown): unknown
    register(options: Record<string, unknown>, component: unknown): unknown
  }
  locale: {
    register(ns: string, dicts: Record<string, Record<string, string>>): () => void
    bind(ns: string): Translate
  }
  layout: {
    selectPanel(panelId: string): void
  }
  effect(execute: () => () => void, label?: string): unknown
}

export interface ClientPlugin {
  inject: string[]
  apply(ctx: ClientContext): void
}

export function create(_require: (id: string) => unknown): ClientPlugin {
  return {
    inject: ['slots', 'locale', 'layout'],
    apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, dictionaries), 'archive-desk: dictionaries')
      ctx.effect(() => {
        if (typeof document === 'undefined') return () => undefined
        const tag = document.createElement('style')
        tag.dataset.plugin = NS
        tag.dataset.pluginCss = `${NS}/panel.css`
        tag.textContent = STYLES
        document.head.appendChild(tag)
        return () => tag.remove()
      }, 'archive-desk: panel styles')

      const t = ctx.locale.bind(NS)

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 20,
            locale: NS,
            label: () => t('panel'),
          },
          ArchiveDeskIcon,
        ),
      )

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => ({ t }),
          },
          ArchiveDeskPage,
        ),
      )

      ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
        ctx.slots.register(
          {
            name: 'sidebar.workspaces.session.menu.item',
            id: 'archive-desk-delete',
            order: 460,
            locale: NS,
            inject: () => ({
              t,
              openPanel: () => ctx.layout.selectPanel(PANEL_ID),
            }),
          },
          SessionMenuDelete,
        ),
      )
    },
  }
}
