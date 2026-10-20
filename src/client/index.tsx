/**
 * dsh-archive-desk — Client half.
 *
 * Registers one sidebar icon and one full-page panel that share the panel id
 * `archive-desk` (docs/设计.md §4.4). Data comes from the plugin's own HTTP
 * route, authorized by the page's session; React and the JSX runtime come from
 * the page module table, never from a bundled copy.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

const PANEL_ID = 'archive-desk'
const NS = 'archive-desk'
const ROUTE = '/archive-desk'
const PAGE_SIZE = 20

/**
 * Cross-component hand-off: the sidebar session menu asks the panel to delete
 * one session. The panel may not be mounted yet when the click lands, so the
 * request is parked until a subscriber appears (mount) or fires immediately.
 */
let pendingDeletion: string | null = null
const deletionListeners = new Set<() => void>()

function requestDeletion(sessionId: string): void {
  pendingDeletion = sessionId
  for (const listener of deletionListeners) listener()
}

function takeDeletion(): string | null {
  const value = pendingDeletion
  pendingDeletion = null
  return value
}

function subscribeDeletion(listener: () => void): () => void {
  deletionListeners.add(listener)
  return () => {
    deletionListeners.delete(listener)
  }
}

type Translate = (key: string, params?: Record<string, string | number>) => string

interface ArchivedItem {
  id: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  createdAt: number
  updatedAt: number
  sizeBytes: number
  status: 'ok' | 'missing' | 'live'
}

interface TrashItem {
  trashId: string
  sessionId: string
  title: string
  snippet: string
  cwd?: string
  workspaceTitle?: string
  movedAt: string
  sizeBytes: number
}

interface ListResult {
  total: number
  offset: number
  limit: number
  totalBytes: number
  missing: number
  matchingIds: string[]
  items: ArchivedItem[]
}

interface DeleteResult {
  deleted: string[]
  skipped: Array<{ id: string; reason: string }>
  freedBytes: number
}

interface RestoreResult {
  restored: string[]
  failed: Array<{ trashId: string; reason: string }>
}

interface PurgeResult {
  purged: string[]
  freedBytes: number
}

type Tab = 'archived' | 'trash'
type DeleteMode = 'trash' | 'purge'

type Pending =
  | { kind: 'delete'; ids: string[]; labels: string[]; bytes: number }
  | { kind: 'empty'; count: number; bytes: number }
  | { kind: 'purgeOne'; trashId: string; label: string; bytes: number }

const colors = {
  text: 'var(--dsw-alias-label-primary)',
  secondary: 'var(--dsw-alias-label-secondary)',
  border: 'var(--dsw-alias-border-l1)',
  base: 'var(--dsw-alias-bg-base)',
  layer: 'var(--dsw-alias-bg-layer-1)',
  overlay: 'var(--dsw-alias-bg-overlay)',
  brand: 'var(--dsw-alias-brand-primary)',
  danger: 'var(--dsw-alias-state-error-primary)',
  warn: 'var(--dsw-alias-state-warn-primary)',
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    background: colors.base,
    color: colors.text,
    fontSize: 14,
  } as CSSProperties,
  header: { padding: '24px 32px 8px' } as CSSProperties,
  headerRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
  } as CSSProperties,
  title: { margin: 0, fontSize: 20, fontWeight: 600 } as CSSProperties,
  summary: { color: colors.secondary, fontSize: 13 } as CSSProperties,
  tabs: {
    display: 'flex',
    gap: 4,
    padding: '12px 32px 0',
    borderBottom: `1px solid ${colors.border}`,
  } as CSSProperties,
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 32px',
    borderBottom: `1px solid ${colors.border}`,
  } as CSSProperties,
  search: {
    flex: 1,
    minWidth: 120,
    padding: '6px 10px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.layer,
    color: colors.text,
    fontSize: 13,
    outline: 'none',
  } as CSSProperties,
  list: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 32px' } as CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr) 150px 96px',
    gap: 12,
    alignItems: 'center',
    padding: '10px 4px',
    borderBottom: `1px solid ${colors.border}`,
  } as CSSProperties,
  rowTitle: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  rowSnippet: {
    display: 'block',
    color: colors.secondary,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  meta: { color: colors.secondary, fontSize: 12 } as CSSProperties,
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 32px',
    borderTop: `1px solid ${colors.border}`,
    color: colors.secondary,
    fontSize: 13,
  } as CSSProperties,
  empty: {
    padding: '48px 0',
    textAlign: 'center',
    color: colors.secondary,
  } as CSSProperties,
  button: {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.layer,
    color: colors.text,
    cursor: 'pointer',
    fontSize: 13,
  } as CSSProperties,
  primaryButton: {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.brand}`,
    background: colors.brand,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  } as CSSProperties,
  dangerButton: {
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.danger}`,
    background: 'transparent',
    color: colors.danger,
    cursor: 'pointer',
    fontSize: 13,
  } as CSSProperties,
  tab: (active: boolean): CSSProperties => ({
    padding: '6px 12px',
    border: 'none',
    borderBottom: `2px solid ${active ? colors.brand : 'transparent'}`,
    background: 'transparent',
    color: active ? colors.text : colors.secondary,
    cursor: 'pointer',
    fontSize: 13,
  }),
  banner: (tone: 'error' | 'info'): CSSProperties => ({
    margin: '0 32px 12px',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    border: `1px solid ${tone === 'error' ? colors.danger : colors.border}`,
    color: tone === 'error' ? colors.danger : colors.text,
    background: colors.layer,
  }),
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  } as CSSProperties,
  dialog: {
    width: 460,
    maxWidth: 'calc(100vw - 48px)',
    padding: 20,
    borderRadius: 14,
    background: colors.overlay,
    border: `1px solid ${colors.border}`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  } as CSSProperties,
  dialogTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 600 } as CSSProperties,
  dialogList: {
    maxHeight: 180,
    overflowY: 'auto',
    margin: '0 0 12px',
    padding: 0,
    listStyle: 'none',
    fontSize: 13,
    color: colors.secondary,
  } as CSSProperties,
  dialogRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '4px 0',
  } as CSSProperties,
  choice: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 13,
  } as CSSProperties,
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  } as CSSProperties,
}

const zh: Record<string, string> = {
  panel: '归档工作台',
  'page.title': '归档工作台',
  'page.summary': '{count} 个已归档对话 · {size}',
  'tab.archived': '已归档',
  'tab.trash': '回收站',
  'search.placeholder': '搜索标题、摘要或项目',
  'action.selectAll': '全选',
  'action.delete': '删除所选',
  'action.restore': '恢复',
  'action.purge': '彻底删除',
  'action.emptyTrash': '清空回收站',
  'action.cancel': '取消',
  'action.confirm': '确认',
  'toggle.trash': '删除时放入回收站',
  'empty.archived': '还没有归档的对话。',
  'empty.trash': '回收站是空的。',
  'status.live': '运行中',
  'status.missing': '失效',
  'notice.deleted': '已删除 {count} 个会话，释放 {size}',
  'notice.restored': '已恢复 {count} 个会话',
  'notice.purged': '已彻底删除 {count} 个条目，释放 {size}',
  'notice.dangling': '已清理 {count} 条失效引用',
  'action.cleanDangling': '清理失效引用（{count}）',
  'hint.missing':
    '其中 {count} 条引用指向的会话日志已不在磁盘上（可能是早前的手工清理留下的悬空引用），可以一键清理。',
  'row.missingTitle': '已失效会话 · {id}',
  'row.missingSnippet': '会话日志已不在磁盘上，只剩归档引用',
  'notice.keep': '已跳过 {count} 个无法删除的会话',
  'confirm.deleteTitle': '删除 {count} 个归档对话？',
  'confirm.emptyTitle': '清空回收站？',
  'confirm.purgeOneTitle': '彻底删除这个会话？',
  'confirm.deleteBody': '所选会话将被移出归档列表。',
  'confirm.emptyBody': '回收站中的 {count} 个条目将被永久删除，无法恢复。',
  'confirm.purgeOneBody': '该条目将被永久删除，无法恢复。',
  'confirm.ack': '我已知晓：彻底删除后无法找回',
  'confirm.release': '释放空间：{size}',
  'page.prev': '上一页',
  'page.next': '下一页',
  'page.indicator': '第 {page} / {total} 页',
  'trash.deletedAt': '删除于 {time}',
  'selection.count': '已选 {count} 项',
}

const en: Record<string, string> = {
  panel: 'Archive Desk',
  'page.title': 'Archive Desk',
  'page.summary': '{count} archived conversations · {size}',
  'tab.archived': 'Archived',
  'tab.trash': 'Recycle bin',
  'search.placeholder': 'Search title, preview, or project',
  'action.selectAll': 'Select all',
  'action.delete': 'Delete selected',
  'action.restore': 'Restore',
  'action.purge': 'Delete permanently',
  'action.emptyTrash': 'Empty recycle bin',
  'action.cancel': 'Cancel',
  'action.confirm': 'Confirm',
  'toggle.trash': 'Move to recycle bin',
  'empty.archived': 'No archived conversations yet.',
  'empty.trash': 'The recycle bin is empty.',
  'status.live': 'Running',
  'status.missing': 'Missing',
  'notice.deleted': 'Deleted {count} conversations, freed {size}',
  'notice.restored': 'Restored {count} conversations',
  'notice.purged': 'Permanently deleted {count} entries, freed {size}',
  'notice.dangling': 'Dropped {count} dangling references',
  'action.cleanDangling': 'Clean up {count} dangling',
  'hint.missing':
    '{count} references point at sessions whose logs are gone (left behind by an earlier manual cleanup). They can be removed in one go.',
  'row.missingTitle': 'Missing session · {id}',
  'row.missingSnippet': 'The session log is gone; only the archive reference remains',
  'notice.keep': 'Skipped {count} conversations that could not be deleted',
  'confirm.deleteTitle': 'Delete {count} archived conversations?',
  'confirm.emptyTitle': 'Empty the recycle bin?',
  'confirm.purgeOneTitle': 'Delete this conversation permanently?',
  'confirm.deleteBody': 'The selected conversations leave the archive list.',
  'confirm.emptyBody': 'The {count} entries in the recycle bin are deleted forever.',
  'confirm.purgeOneBody': 'This entry is deleted forever.',
  'confirm.ack': 'I understand this cannot be undone',
  'confirm.release': 'Frees {size}',
  'page.prev': 'Previous',
  'page.next': 'Next',
  'page.indicator': 'Page {page} of {total}',
  'trash.deletedAt': 'Deleted {time}',
  'selection.count': '{count} selected',
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/** Tail of a session id, for rows whose log is gone and has no title. */
function shortSessionId(id: string): string {
  return id.startsWith('session-')
    ? id.slice('session-'.length, 'session-'.length + 8)
    : id.slice(0, 8)
}

function formatTime(value: number | string): string {
  const date = typeof value === 'string' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function call<T>(endpoint: string, payload: unknown): Promise<T> {
  const response = await fetch(`${ROUTE}/${endpoint}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  const text = await response.text()
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`HTTP ${response.status}`)
  }
  const envelope = body as { ok?: boolean; value?: T; error?: { message?: string } }
  if (envelope.ok === true) return envelope.value as T
  throw new Error(envelope.error?.message ?? `HTTP ${response.status}`)
}

/**
 * Sidebar glyph. Monochrome on purpose: the sidebar renders icons in the
 * theme's own label color, so the stroke and the faint lid tint both use
 * `currentColor` and follow light/dark without a hardcoded brand color.
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

function ConfirmDialog(props: {
  t: Translate
  pending: Pending
  mode: DeleteMode
  onMode: (mode: DeleteMode) => void
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t, pending, mode, onMode, busy, onCancel, onConfirm } = props
  const [acknowledged, setAcknowledged] = useState(false)

  const isPurge = pending.kind === 'empty' || pending.kind === 'purgeOne' || mode === 'purge'
  const needsAck = isPurge

  const title =
    pending.kind === 'delete'
      ? t('confirm.deleteTitle', { count: pending.ids.length })
      : pending.kind === 'empty'
        ? t('confirm.emptyTitle')
        : t('confirm.purgeOneTitle')

  const body =
    pending.kind === 'delete'
      ? t('confirm.deleteBody')
      : pending.kind === 'empty'
        ? t('confirm.emptyBody', { count: pending.count })
        : t('confirm.purgeOneBody')

  const bytes =
    pending.kind === 'delete'
      ? pending.bytes
      : pending.kind === 'empty'
        ? pending.bytes
        : pending.bytes

  const labels =
    pending.kind === 'delete' ? pending.labels : pending.kind === 'purgeOne' ? [pending.label] : []

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div style={styles.dialog}>
        <h3 style={styles.dialogTitle}>{title}</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: colors.secondary }}>{body}</p>

        {labels.length > 0 && (
          <ul style={styles.dialogList}>
            {labels.slice(0, 6).map((label, index) => (
              <li key={`${label}-${index}`} style={styles.dialogRow}>
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {label}
                </span>
              </li>
            ))}
            {labels.length > 6 && <li style={styles.dialogRow}>+{labels.length - 6}</li>}
          </ul>
        )}

        <div style={{ fontSize: 13, color: colors.secondary }}>
          {t('confirm.release', { size: formatBytes(bytes) })}
        </div>

        {pending.kind === 'delete' && (
          <div style={{ marginTop: 12 }}>
            <label style={styles.choice}>
              <input
                type="radio"
                checked={mode === 'trash'}
                onChange={() => onMode('trash')}
                disabled={busy}
              />
              {t('toggle.trash')}
            </label>
            <label style={styles.choice}>
              <input
                type="radio"
                checked={mode === 'purge'}
                onChange={() => onMode('purge')}
                disabled={busy}
              />
              {t('action.purge')}
            </label>
          </div>
        )}

        {needsAck && (
          <label style={{ ...styles.choice, marginTop: 8, color: colors.danger }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={busy}
            />
            {t('confirm.ack')}
          </label>
        )}

        <div style={styles.actions}>
          <button style={styles.button} onClick={onCancel} disabled={busy} type="button">
            {t('action.cancel')}
          </button>
          <button
            style={needsAck ? styles.dangerButton : styles.primaryButton}
            onClick={onConfirm}
            disabled={busy || (needsAck && !acknowledged)}
            type="button"
          >
            {t('action.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ArchiveDeskPage({ t }: { t: Translate }) {
  const [tab, setTab] = useState<Tab>('archived')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [page, setPage] = useState(0)
  const [list, setList] = useState<ListResult>({
    total: 0,
    offset: 0,
    limit: PAGE_SIZE,
    totalBytes: 0,
    missing: 0,
    matchingIds: [],
    items: [],
  })
  const [trash, setTrash] = useState<TrashItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [mode, setMode] = useState<DeleteMode>('trash')
  const [pending, setPending] = useState<Pending | null>(null)
  const [dialogMode, setDialogMode] = useState<DeleteMode>('trash')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedQuery(query)
      setPage(0)
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  const refresh = useCallback(async () => {
    try {
      if (tab === 'archived') {
        const result = await call<ListResult>('list', {
          offset: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          ...(appliedQuery === '' ? {} : { query: appliedQuery }),
        })
        setList(result)
      } else {
        const entries = await call<TrashItem[]>('listTrash', {})
        setTrash(entries)
      }
      setError(null)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }, [tab, page, appliedQuery])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // A delete request from the sidebar session menu: locate the row, then open
  // the same confirmation the list uses. Runs once on mount as well, because
  // the menu may have fired it before the panel was rendered.
  useEffect(() => {
    let active = true

    const openRequested = async (): Promise<void> => {
      const id = takeDeletion()
      if (id === null || !active) return
      try {
        const found = await call<ListResult>('list', { query: id, limit: 5 })
        const item = found.items.find((row) => row.id === id)
        if (item === undefined || !active) return
        setTab('archived')
        setDialogMode('trash')
        setPending({ kind: 'delete', ids: [id], labels: [item.title], bytes: item.sizeBytes })
      } catch {
        // Leave the panel usable; the row is still reachable from the list.
      }
    }

    const unsubscribe = subscribeDeletion(() => {
      void openRequested()
    })
    void openRequested()

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const totalBytes = useMemo(
    () =>
      tab === 'archived' ? list.totalBytes : trash.reduce((sum, item) => sum + item.sizeBytes, 0),
    [tab, list.totalBytes, trash],
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const pageIds = useMemo(() => list.items.map((item) => item.id), [list.items])
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id))

  const toggle = (id: string): void => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const selectAll = (): void => {
    setSelected(allSelected ? [] : list.matchingIds)
  }

  const run = async (operation: () => Promise<string>): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      setNotice(await operation())
      await refresh()
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const confirmDelete = (): void => {
    if (pending === null || pending.kind !== 'delete') return
    void run(async () => {
      const result = await call<DeleteResult>('delete', { ids: pending.ids, mode: dialogMode })
      setSelected([])
      const skipped =
        result.skipped.length > 0 ? ` · ${t('notice.keep', { count: result.skipped.length })}` : ''
      return `${t('notice.deleted', { count: result.deleted.length, size: formatBytes(result.freedBytes) })}${skipped}`
    })
  }

  const confirmPurgeOne = (): void => {
    if (pending === null || pending.kind !== 'purgeOne') return
    void run(async () => {
      const result = await call<PurgeResult>('purgeTrash', { trashIds: [pending.trashId] })
      return t('notice.purged', {
        count: result.purged.length,
        size: formatBytes(result.freedBytes),
      })
    })
  }

  const confirmEmpty = (): void => {
    if (pending === null || pending.kind !== 'empty') return
    void run(async () => {
      const result = await call<PurgeResult>('emptyTrash', {})
      return t('notice.purged', {
        count: result.purged.length,
        size: formatBytes(result.freedBytes),
      })
    })
  }

  const restore = (trashId: string): void => {
    void run(async () => {
      const result = await call<RestoreResult>('restore', { trashIds: [trashId] })
      return t('notice.restored', { count: result.restored.length })
    })
  }

  const cleanDangling = (): void => {
    void run(async () => {
      const result = await call<{ removed: string[] }>('cleanDangling', {})
      return t('notice.dangling', { count: result.removed.length })
    })
  }

  const missing = list.missing
  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE))
  const selectedBytes = list.items
    .filter((item) => selectedSet.has(item.id))
    .reduce((sum, item) => sum + item.sizeBytes, 0)

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>{t('page.title')}</h2>
          <span style={styles.summary}>
            {t('page.summary', {
              count: tab === 'archived' ? list.total : trash.length,
              size: formatBytes(totalBytes),
            })}
          </span>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          type="button"
          style={styles.tab(tab === 'archived')}
          onClick={() => setTab('archived')}
        >
          {t('tab.archived')}
        </button>
        <button type="button" style={styles.tab(tab === 'trash')} onClick={() => setTab('trash')}>
          {t('tab.trash')} ({trash.length})
        </button>
      </div>

      {error !== null && <div style={styles.banner('error')}>{error}</div>}
      {notice !== null && <div style={styles.banner('info')}>{notice}</div>}

      {tab === 'archived' ? (
        <>
          {missing > 0 && (
            <div style={styles.banner('info')}>{t('hint.missing', { count: missing })}</div>
          )}
          <div style={styles.toolbar}>
            <input
              style={styles.search}
              value={query}
              placeholder={t('search.placeholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={allSelected} onChange={selectAll} />
              {t('action.selectAll')}
            </label>
            <span style={styles.meta}>{t('selection.count', { count: selected.length })}</span>
            {missing > 0 && (
              <button type="button" style={styles.button} onClick={cleanDangling} disabled={busy}>
                {t('action.cleanDangling', { count: missing })}
              </button>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={mode === 'trash'}
                onChange={(event) => setMode(event.target.checked ? 'trash' : 'purge')}
              />
              {t('toggle.trash')}
            </label>
            <button
              type="button"
              style={styles.dangerButton}
              disabled={busy || selected.length === 0}
              onClick={() => {
                setDialogMode(mode)
                setPending({
                  kind: 'delete',
                  ids: selected,
                  labels: list.items
                    .filter((item) => selectedSet.has(item.id))
                    .map((item) => item.title),
                  bytes: selectedBytes,
                })
              }}
            >
              {t('action.delete')} ({selected.length})
            </button>
          </div>

          <div style={styles.list}>
            {list.items.length === 0 ? (
              <div style={styles.empty}>{t('empty.archived')}</div>
            ) : (
              list.items.map((item) => (
                <div key={item.id} style={styles.row}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <div style={{ minWidth: 0 }}>
                    <span style={styles.rowTitle}>
                      {item.status === 'missing'
                        ? t('row.missingTitle', { id: shortSessionId(item.id) })
                        : item.title}
                    </span>
                    <span style={styles.rowSnippet}>
                      {item.status === 'missing' ? t('row.missingSnippet') : item.snippet}
                    </span>
                  </div>
                  <span style={styles.meta}>
                    {item.workspaceTitle ?? item.cwd ?? '—'}
                    <br />
                    {item.status === 'live'
                      ? t('status.live')
                      : item.status === 'missing'
                        ? t('status.missing')
                        : formatTime(item.updatedAt)}
                  </span>
                  <span style={styles.meta}>
                    {item.status === 'missing' ? '—' : formatBytes(item.sizeBytes)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={styles.footer}>
            <span>{t('page.indicator', { page: page + 1, total: totalPages })}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={styles.button}
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                {t('page.prev')}
              </button>
              <button
                type="button"
                style={styles.button}
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('page.next')}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={styles.toolbar}>
            <span style={styles.meta}>{t('tab.trash')}</span>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              style={styles.dangerButton}
              disabled={busy || trash.length === 0}
              onClick={() =>
                setPending({
                  kind: 'empty',
                  count: trash.length,
                  bytes: trash.reduce((sum, item) => sum + item.sizeBytes, 0),
                })
              }
            >
              {t('action.emptyTrash')}
            </button>
          </div>

          <div style={styles.list}>
            {trash.length === 0 ? (
              <div style={styles.empty}>{t('empty.trash')}</div>
            ) : (
              trash.map((item) => (
                <div key={item.trashId} style={styles.row}>
                  <span />
                  <div style={{ minWidth: 0 }}>
                    <span style={styles.rowTitle}>{item.title}</span>
                    <span style={styles.rowSnippet}>{item.snippet}</span>
                  </div>
                  <span style={styles.meta}>
                    {t('trash.deletedAt', { time: formatTime(item.movedAt) })}
                  </span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => restore(item.trashId)}
                    >
                      {t('action.restore')}
                    </button>
                    <button
                      type="button"
                      style={styles.dangerButton}
                      onClick={() =>
                        setPending({
                          kind: 'purgeOne',
                          trashId: item.trashId,
                          label: item.title,
                          bytes: item.sizeBytes,
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.footer}>
            <span>{t('tab.trash')}</span>
          </div>
        </>
      )}

      {pending !== null && (
        <ConfirmDialog
          t={t}
          pending={pending}
          mode={dialogMode}
          onMode={setDialogMode}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={
            pending.kind === 'delete'
              ? confirmDelete
              : pending.kind === 'empty'
                ? confirmEmpty
                : confirmPurgeOne
          }
        />
      )}
    </div>
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
 * One row in a session's "…" menu, only for sessions that are archived.
 * It reuses the panel's confirmation instead of carrying a second delete path.
 */
function SessionMenuDelete(props: MenuRowProps) {
  const { sessionId, useWorkspaces, useMenuOpenState, t, openPanel } = props
  const [, setMenuOpen] = useMenuOpenState()
  const archived = useWorkspaces((state) => state.archivedSessionIds.includes(sessionId))

  if (!archived) return null

  return (
    <>
      <style>{`
        .archive-desk-menu-row{display:flex;align-items:center;width:100%;padding:8px 12px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;text-align:left;cursor:pointer}
        .archive-desk-menu-row:hover{background:var(--dsw-alias-bg-layer-2)}
        .archive-desk-menu-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      `}</style>
      <button
        type="button"
        role="menuitem"
        className="archive-desk-menu-row"
        onClick={() => {
          setMenuOpen(false)
          requestDeletion(sessionId)
          openPanel()
        }}
      >
        {t('action.delete')}
      </button>
    </>
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
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'archive-desk: dictionaries')
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
