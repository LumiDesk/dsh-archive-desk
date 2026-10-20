import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import {
  Button,
  Checkbox,
  IconArchiveOutlineRegular,
  IconChevronLeftOutlineRegular,
  IconChevronRightOutlineRegular,
  IconLoadingOutlineRegular,
  IconRefreshOutlineRegular,
  IconSearchOutlineRegular,
  IconTrashOutlineRegular,
  IconUnarchiveOutlineRegular,
  IconWarningTriangleOutlineRegular,
  Input,
  SegmentedTabs,
  StateDot,
  Tag,
  Toast,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'

import { call } from './api'
import { ConfirmDialog } from './dialog'
import {
  errorText,
  formatBytes,
  formatDateTime,
  formatRelativeTime,
  shortSessionId,
} from './format'
import type { Translate } from './locales'
import { subscribeDeletion, takeDeletion } from './pending'
import type {
  ArchivedItem,
  DeleteMode,
  DeleteResult,
  InspectResult,
  ListResult,
  PageSize,
  Pending,
  PurgeResult,
  RestoreResult,
  SortMode,
  Tab,
  ToastState,
  TrashItem,
  TrashListResult,
  UnarchiveResult,
} from './types'

const PAGE_SIZE_OPTIONS: PageSize[] = [10, 20, 50]
const MAX_RENDERED_PAGES = 7

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span className="adk-spinner" aria-hidden="true">
      <IconLoadingOutlineRegular size={size} />
    </span>
  )
}

function isSelectable(item: ArchivedItem): boolean {
  return item.status === 'ok' || item.status === 'missing'
}

function StatusBadge({ item, t }: { item: ArchivedItem; t: Translate }) {
  if (item.status === 'running') {
    return (
      <Tooltip label={t('status.tooltip.running')} side="bottom">
        <span className="adk-status" data-status="running">
          <StateDot state="ongoing" />
          {t('status.running')}
        </span>
      </Tooltip>
    )
  }
  if (item.status === 'open') {
    return (
      <Tooltip label={t('status.tooltip.open')} side="bottom">
        <span className="adk-status" data-status="open">
          <StateDot state="idle" />
          {t('status.open')}
        </span>
      </Tooltip>
    )
  }
  if (item.status === 'missing') {
    return (
      <Tooltip label={t('status.tooltip.missing')} side="bottom">
        <span className="adk-status" data-status="missing">
          <Tag tone="danger">{t('status.missing')}</Tag>
        </span>
      </Tooltip>
    )
  }
  return null
}

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="adk-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="adk-skeleton-row" key={index}>
          <span className="adk-skeleton-bar" data-dot="true" />
          <span className="adk-skeleton-bar" data-wide="true" />
          <span className="adk-skeleton-bar" />
          <span className="adk-skeleton-bar" data-short="true" />
          <span className="adk-skeleton-bar" data-short="true" />
        </div>
      ))}
    </div>
  )
}

function EmptyState(props: { icon: ReactNode; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="adk-empty">
      <span className="adk-empty-icon">{props.icon}</span>
      <span className="adk-empty-title">{props.title}</span>
      <span className="adk-empty-hint">{props.hint}</span>
      {props.action !== undefined && <span className="adk-empty-action">{props.action}</span>}
    </div>
  )
}

function pageNumbers(current: number, total: number): Array<number | 'gap'> {
  if (total <= MAX_RENDERED_PAGES) return Array.from({ length: total }, (_, index) => index)
  const wanted = new Set([0, total - 1, current - 1, current, current + 1])
  const pages = [...wanted].filter((page) => page >= 0 && page < total).sort((a, b) => a - b)
  const result: Array<number | 'gap'> = []
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]
    if (page === undefined) continue
    if (index > 0 && page - (pages[index - 1] ?? page) > 1) result.push('gap')
    result.push(page)
  }
  return result
}

function Pagination(props: {
  t: Translate
  page: number
  pageSize: PageSize
  total: number
  busy: boolean
  onPage: (page: number) => void
  onPageSize: (size: PageSize) => void
}) {
  const { t, page, pageSize, total, busy, onPage, onPageSize } = props
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  const pages = pageNumbers(page, totalPages)

  return (
    <div className="adk-footer">
      <div className="adk-footer-left">
        <span>{t('pagination.range', { from, to, total })}</span>
        <label className="adk-selected">
          {t('pageSize.label')}
          <select
            className="adk-select"
            value={pageSize}
            disabled={busy}
            aria-label={t('pageSize.label')}
            onChange={(event) => onPageSize(Number(event.target.value) as PageSize)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option value={size} key={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="adk-footer-right">
        <button
          type="button"
          className="adk-page"
          aria-label={t('pagination.prev')}
          disabled={busy || page <= 0}
          onClick={() => onPage(Math.max(0, page - 1))}
        >
          <IconChevronLeftOutlineRegular size={15} />
        </button>
        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <span className="adk-page-gap" key={`gap-${index}`}>
              …
            </span>
          ) : (
            <button
              type="button"
              className="adk-page"
              data-active={entry === page}
              aria-current={entry === page ? 'page' : undefined}
              disabled={busy}
              key={entry}
              onClick={() => onPage(entry)}
            >
              {entry + 1}
            </button>
          ),
        )}
        <button
          type="button"
          className="adk-page"
          aria-label={t('pagination.next')}
          disabled={busy || page + 1 >= totalPages}
          onClick={() => onPage(Math.min(totalPages - 1, page + 1))}
        >
          <IconChevronRightOutlineRegular size={15} />
        </button>
      </div>
    </div>
  )
}

export function ArchiveDeskPage({ t }: { t: Translate }) {
  const [tab, setTab] = useState<Tab>('archived')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [pageSize, setPageSize] = useState<PageSize>(20)
  const [archivedPage, setArchivedPage] = useState(0)
  const [trashPage, setTrashPage] = useState(0)
  const [archived, setArchived] = useState<ListResult | null>(null)
  const [trash, setTrash] = useState<TrashListResult | null>(null)
  const [trashTotal, setTrashTotal] = useState(0)
  const [trashTotalBytes, setTrashTotalBytes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedMeta, setSelectedMeta] = useState<Record<string, ArchivedItem>>({})
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([])
  const [selectedTrashMeta, setSelectedTrashMeta] = useState<Record<string, TrashItem>>({})
  const [pending, setPending] = useState<Pending | null>(null)
  const [dialogMode, setDialogMode] = useState<DeleteMode>('trash')
  const [preview, setPreview] = useState<InspectResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const archivedLoaded = useRef(false)
  const trashLoaded = useRef(false)
  const requestSeq = useRef(0)
  const toastSeq = useRef(0)
  const selectAllRef = useRef<HTMLSpanElement>(null)

  const showToast = useCallback((text: string, tone: ToastState['tone'] = 'success') => {
    toastSeq.current += 1
    setToast({ id: toastSeq.current, text, tone })
  }, [])

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1)
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedQuery(query)
      setArchivedPage(0)
    }, 250)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    setArchivedPage(0)
    setTrashPage(0)
    setSelectedIds([])
    setSelectedMeta({})
    setSelectedTrashIds([])
    setSelectedTrashMeta({})
  }, [tab, appliedQuery, sort, pageSize])

  // Archived rows: one request per page/filter, with the old rows kept while
  // a refresh is in flight so the page does not flash empty.
  useEffect(() => {
    if (tab !== 'archived') return
    const controller = new AbortController()
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    const first = !archivedLoaded.current
    setError(null)
    if (first) setLoading(true)
    else setRefreshing(true)

    call<ListResult>(
      'list',
      {
        offset: archivedPage * pageSize,
        limit: pageSize,
        sort,
        ...(appliedQuery === '' ? {} : { query: appliedQuery }),
      },
      controller.signal,
    )
      .then((value) => {
        if (seq !== requestSeq.current) return
        const maxPage = Math.max(0, Math.ceil(value.total / pageSize) - 1)
        archivedLoaded.current = true
        setArchived(value)
        if (archivedPage > maxPage) setArchivedPage(maxPage)
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted || seq !== requestSeq.current) return
        setError(errorText(failure, t))
      })
      .finally(() => {
        if (seq !== requestSeq.current) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => controller.abort()
  }, [tab, archivedPage, pageSize, appliedQuery, sort, refreshToken, t])

  // The bin count is needed even while the archived tab is active.
  useEffect(() => {
    const controller = new AbortController()
    call<TrashListResult>('listTrash', { offset: 0, limit: 1 }, controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return
        setTrashTotal(value.total)
        setTrashTotalBytes(value.totalBytes)
      })
      .catch(() => {
        // A failed count must not replace the main list error.
      })
    return () => controller.abort()
  }, [refreshToken])

  useEffect(() => {
    if (tab !== 'trash') return
    const controller = new AbortController()
    const seq = requestSeq.current + 1
    requestSeq.current = seq
    const first = !trashLoaded.current
    setError(null)
    if (first) setLoading(true)
    else setRefreshing(true)

    call<TrashListResult>(
      'listTrash',
      { offset: trashPage * pageSize, limit: pageSize },
      controller.signal,
    )
      .then((value) => {
        if (seq !== requestSeq.current) return
        const maxPage = Math.max(0, Math.ceil(value.total / pageSize) - 1)
        trashLoaded.current = true
        setTrash(value)
        setTrashTotal(value.total)
        setTrashTotalBytes(value.totalBytes)
        if (trashPage > maxPage) setTrashPage(maxPage)
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted || seq !== requestSeq.current) return
        setError(errorText(failure, t))
      })
      .finally(() => {
        if (seq !== requestSeq.current) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => controller.abort()
  }, [tab, trashPage, pageSize, refreshToken, t])

  const openDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return
      setTab('archived')
      setDialogMode('trash')
      setPreview(null)
      setDialogError(null)
      setPending({ kind: 'delete', ids })
      setPreviewLoading(true)
      try {
        const value = await call<InspectResult>('inspect', { ids })
        setPreview(value)
      } catch (failure) {
        setDialogError(errorText(failure, t))
      } finally {
        setPreviewLoading(false)
      }
    },
    [t],
  )

  useEffect(() => {
    const handle = (): void => {
      const request = takeDeletion()
      if (request !== null) void openDelete(request.ids)
    }
    const unsubscribe = subscribeDeletion(handle)
    handle()
    return unsubscribe
  }, [openDelete])

  const archivedItems = archived?.items ?? []
  const selectablePageIds = archivedItems.filter(isSelectable).map((item) => item.id)
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allPageSelected =
    selectablePageIds.length > 0 && selectablePageIds.every((id) => selectedSet.has(id))
  const somePageSelected = selectablePageIds.some((id) => selectedSet.has(id)) && !allPageSelected

  useEffect(() => {
    const input = selectAllRef.current?.querySelector('input')
    if (input !== null && input !== undefined) input.indeterminate = somePageSelected
  }, [somePageSelected])

  const selectedBytes = selectedIds.reduce((sum, id) => sum + (selectedMeta[id]?.sizeBytes ?? 0), 0)
  const selectedBytesComplete = selectedIds.every((id) => selectedMeta[id] !== undefined)
  const matchingIds = archived?.matchingIds ?? []
  const canSelectAllMatching = matchingIds.length > selectedIds.length && archived !== null

  const toggleItem = (item: ArchivedItem): void => {
    if (!isSelectable(item)) return
    const selected = selectedSet.has(item.id)
    setSelectedIds((current) =>
      selected ? current.filter((id) => id !== item.id) : [...current, item.id],
    )
    setSelectedMeta((current) => {
      const next = { ...current }
      if (selected) delete next[item.id]
      else next[item.id] = item
      return next
    })
  }

  const togglePage = (checked: boolean): void => {
    if (checked) {
      const nextIds = new Set([...selectedIds, ...selectablePageIds])
      setSelectedIds([...nextIds])
      setSelectedMeta((current) => {
        const next = { ...current }
        for (const item of archivedItems) if (isSelectable(item)) next[item.id] = item
        return next
      })
    } else {
      const pageIds = new Set(selectablePageIds)
      setSelectedIds((current) => current.filter((id) => !pageIds.has(id)))
      setSelectedMeta((current) => {
        const next = { ...current }
        for (const id of pageIds) delete next[id]
        return next
      })
    }
  }

  const selectAllMatching = (): void => {
    setSelectedIds(matchingIds)
    setSelectedMeta((current) => {
      const next = { ...current }
      for (const item of archivedItems) {
        if (matchingIds.includes(item.id)) next[item.id] = item
      }
      return next
    })
  }

  const clearArchivedSelection = (): void => {
    setSelectedIds([])
    setSelectedMeta({})
  }

  const trashItems = trash?.items ?? []
  const selectedTrashSet = useMemo(() => new Set(selectedTrashIds), [selectedTrashIds])
  const selectableTrashPageIds = trashItems.map((item) => item.trashId)
  const allTrashPageSelected =
    selectableTrashPageIds.length > 0 &&
    selectableTrashPageIds.every((id) => selectedTrashSet.has(id))

  const toggleTrashItem = (item: TrashItem): void => {
    const selected = selectedTrashSet.has(item.trashId)
    setSelectedTrashIds((current) =>
      selected ? current.filter((id) => id !== item.trashId) : [...current, item.trashId],
    )
    setSelectedTrashMeta((current) => {
      const next = { ...current }
      if (selected) delete next[item.trashId]
      else next[item.trashId] = item
      return next
    })
  }

  const toggleTrashPage = (checked: boolean): void => {
    if (checked) {
      const ids = new Set([...selectedTrashIds, ...selectableTrashPageIds])
      setSelectedTrashIds([...ids])
      setSelectedTrashMeta((current) => {
        const next = { ...current }
        for (const item of trashItems) next[item.trashId] = item
        return next
      })
    } else {
      const pageIds = new Set(selectableTrashPageIds)
      setSelectedTrashIds((current) => current.filter((id) => !pageIds.has(id)))
      setSelectedTrashMeta((current) => {
        const next = { ...current }
        for (const id of pageIds) delete next[id]
        return next
      })
    }
  }

  const clearTrashSelection = (): void => {
    setSelectedTrashIds([])
    setSelectedTrashMeta({})
  }

  const openEmptyTrash = (): void => {
    setDialogMode('purge')
    setDialogError(null)
    setPending({
      kind: 'empty',
      count: trash?.total ?? trashTotal,
      bytes: trash?.totalBytes ?? trashTotalBytes,
    })
  }

  const openPurge = (trashIds: string[]): void => {
    if (trashIds.length === 0) return
    const selectedItems = trashIds
      .map((id) => selectedTrashMeta[id] ?? trashItems.find((item) => item.trashId === id))
      .filter((item): item is TrashItem => item !== undefined)
    setDialogMode('purge')
    setDialogError(null)
    setPending({
      kind: 'purge',
      trashIds,
      count: trashIds.length,
      bytes: selectedItems.reduce((sum, item) => sum + item.sizeBytes, 0),
      ...(trashIds.length === 1 && selectedItems[0] !== undefined
        ? { label: selectedItems[0].title }
        : {}),
    })
  }

  const restoreTrash = async (trashIds: string[]): Promise<void> => {
    if (trashIds.length === 0 || busy) return
    setBusy(true)
    try {
      const result = await call<RestoreResult>('restore', { trashIds })
      const failed = result.failed.length
      const text =
        result.restored.length > 0
          ? t('notice.restored', { count: result.restored.length }) +
            (failed > 0 ? ` · ${t('notice.failed', { count: failed })}` : '')
          : t('notice.failed', { count: failed })
      showToast(text, result.restored.length > 0 ? 'success' : 'error')
      clearTrashSelection()
      refresh()
    } catch (failure) {
      showToast(errorText(failure, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  const cleanDangling = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    try {
      const result = await call<{
        removed: string[]
        failed: Array<{ id: string; reason: string }>
      }>('cleanDangling', {})
      showToast(
        t('notice.cleaned', { count: result.removed.length }),
        result.failed.length > 0 ? 'error' : 'success',
      )
      clearArchivedSelection()
      refresh()
    } catch (failure) {
      showToast(errorText(failure, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  const unarchive = async (ids: string[]): Promise<void> => {
    if (ids.length === 0 || busy) return
    setBusy(true)
    try {
      const result = await call<UnarchiveResult>('unarchive', { ids })
      const parts = [t('notice.unarchived', { count: result.unarchived.length })]
      if (result.skipped.length > 0) {
        parts.push(t('notice.skipped', { count: result.skipped.length }))
      }
      showToast(parts.join(' · '), result.unarchived.length > 0 ? 'success' : 'error')
      clearArchivedSelection()
      refresh()
    } catch (failure) {
      showToast(errorText(failure, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirm = (): void => {
    if (pending === null || busy) return
    if (pending.kind === 'delete' && (preview === null || preview.deletable === 0)) return
    setBusy(true)
    setDialogError(null)
    void (async () => {
      try {
        if (pending.kind === 'delete') {
          const result = await call<DeleteResult>('delete', {
            ids: pending.ids,
            mode: dialogMode,
          })
          const parts = [
            t('notice.deleted', {
              count: result.deleted.length,
              size: formatBytes(result.freedBytes),
            }),
          ]
          if (result.partial.length > 0) {
            parts.push(t('notice.partial', { count: result.partial.length }))
          }
          if (result.skipped.length > 0) {
            parts.push(t('notice.skipped', { count: result.skipped.length }))
          }
          showToast(parts.join(' · '), result.deleted.length > 0 ? 'success' : 'error')
          clearArchivedSelection()
        } else if (pending.kind === 'empty') {
          const result = await call<PurgeResult>('emptyTrash', {})
          const text =
            t('notice.purged', {
              count: result.purged.length,
              size: formatBytes(result.freedBytes),
            }) +
            (result.failed.length > 0
              ? ` · ${t('notice.failed', { count: result.failed.length })}`
              : '')
          showToast(text, result.purged.length > 0 ? 'success' : 'error')
          clearTrashSelection()
        } else {
          const result = await call<PurgeResult>('purgeTrash', { trashIds: pending.trashIds })
          const text =
            t('notice.purged', {
              count: result.purged.length,
              size: formatBytes(result.freedBytes),
            }) +
            (result.failed.length > 0
              ? ` · ${t('notice.failed', { count: result.failed.length })}`
              : '')
          showToast(text, result.purged.length > 0 ? 'success' : 'error')
          clearTrashSelection()
        }
        setPending(null)
        setPreview(null)
        refresh()
      } catch (failure) {
        setDialogError(errorText(failure, t))
      } finally {
        setBusy(false)
      }
    })()
  }

  const archivedCount = archived?.total ?? 0
  const trashCount = trash?.total ?? trashTotal
  const currentCount = tab === 'archived' ? archivedCount : trashCount
  const currentBytes =
    tab === 'archived' ? (archived?.totalBytes ?? 0) : (trash?.totalBytes ?? trashTotalBytes)
  const missingTotal = archived?.missingTotal ?? 0
  const emptySearch = appliedQuery.trim() !== '' && archivedCount === 0

  return (
    <div className="adk-root">
      <div className="adk-shell">
        <header className="adk-header">
          <div className="adk-header-main">
            <h1 className="adk-title">{t('page.title')}</h1>
            <div className="adk-subtitle">
              {t('page.summary', { count: currentCount, size: formatBytes(currentBytes) })}
              {refreshing && (
                <span className="adk-selected" style={{ marginLeft: 10 }}>
                  <Spinner size={12} />
                  {t('refreshing')}
                </span>
              )}
            </div>
          </div>
          <div className="adk-header-actions">
            <Tooltip label={t('action.refresh')} side="bottom" align="end">
              <Button
                variant="outline"
                size="sm"
                aria-label={t('action.refresh')}
                disabled={busy}
                onClick={refresh}
              >
                <IconRefreshOutlineRegular size={14} />
              </Button>
            </Tooltip>
          </div>
        </header>

        <div className="adk-tabs">
          <SegmentedTabs
            label={t('page.title')}
            value={tab}
            onChange={(value) => setTab(value as Tab)}
            items={[
              {
                value: 'archived',
                label: `${t('tab.archived')} (${archivedCount})`,
                id: 'adk-tab-archived',
                panelId: 'adk-panel-archived',
              },
              {
                value: 'trash',
                label: `${t('tab.trash')} (${trashCount})`,
                id: 'adk-tab-trash',
                panelId: 'adk-panel-trash',
              },
            ]}
          />
        </div>

        {error !== null && (
          <div className="adk-banner" data-tone="error" role="alert">
            <IconWarningTriangleOutlineRegular size={16} />
            <span>{t('banner.error', { message: error })}</span>
            <span className="adk-banner-spacer" />
            <Button variant="outline" size="sm" onClick={refresh}>
              {t('action.retry')}
            </Button>
          </div>
        )}

        {tab === 'archived' && missingTotal > 0 && (
          <div className="adk-banner" data-tone="warn">
            <IconWarningTriangleOutlineRegular size={16} />
            <span>{t('banner.missing', { count: missingTotal })}</span>
            <span className="adk-banner-spacer" />
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void cleanDangling()}
            >
              {t('action.cleanDangling', { count: missingTotal })}
            </Button>
          </div>
        )}

        {tab === 'archived' ? (
          <>
            <div className="adk-toolbar">
              <div className="adk-search">
                <Input
                  className="adk-search-input"
                  value={query}
                  icon={<IconSearchOutlineRegular size={15} />}
                  placeholder={t('search.placeholder')}
                  aria-label={t('search.placeholder')}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query !== '' && (
                  <button
                    type="button"
                    className="adk-search-clear"
                    aria-label={t('search.clear')}
                    onClick={() => setQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="adk-sort">
                <select
                  className="adk-select"
                  value={sort}
                  aria-label={t('sort.label')}
                  onChange={(event) => setSort(event.target.value as SortMode)}
                >
                  <option value="recent">{t('sort.recent')}</option>
                  <option value="size">{t('sort.size')}</option>
                  <option value="title">{t('sort.title')}</option>
                  <option value="archive">{t('sort.archive')}</option>
                </select>
              </div>
              <span className="adk-toolbar-spacer" />
              {selectedIds.length > 0 && (
                <span className="adk-selected">
                  {t('select.selected', { count: selectedIds.length })}
                  {selectedBytesComplete && ` · ${formatBytes(selectedBytes)}`}
                  {canSelectAllMatching && (
                    <button type="button" className="adk-linkish" onClick={selectAllMatching}>
                      {t('select.selectAllMatching', { count: matchingIds.length })}
                    </button>
                  )}
                  <button type="button" className="adk-linkish" onClick={clearArchivedSelection}>
                    {t('select.clear')}
                  </button>
                </span>
              )}
              <div className="adk-toolbar-actions">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || selectedIds.length === 0}
                  onClick={() => void unarchive(selectedIds)}
                >
                  <IconUnarchiveOutlineRegular size={14} />
                  {t('action.unarchive')} ({selectedIds.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="adk-danger"
                  disabled={busy || selectedIds.length === 0}
                  onClick={() => void openDelete(selectedIds)}
                >
                  <IconTrashOutlineRegular size={14} />
                  {t('action.delete')} ({selectedIds.length})
                </Button>
              </div>
            </div>

            {archived?.matchingIdsTruncated === true && (
              <div className="adk-banner" data-tone="warn">
                {t('select.truncated', { limit: matchingIds.length })}
              </div>
            )}

            <div className="adk-table">
              <div className="adk-table-head">
                <span className="adk-cell-check" ref={selectAllRef}>
                  <Checkbox
                    label=""
                    checked={allPageSelected}
                    disabled={selectablePageIds.length === 0 || busy}
                    title={t('select.allPage')}
                    onChange={togglePage}
                  />
                </span>
                <span>{t('table.session')}</span>
                <span>{t('table.project')}</span>
                <span>{t('table.activity')}</span>
                <span>{t('table.size')}</span>
                <span>{t('table.status')}</span>
                <span />
              </div>
              <div className="adk-table-scroll" data-refreshing={refreshing}>
                {loading && archived === null ? (
                  <SkeletonRows />
                ) : archivedItems.length === 0 ? (
                  emptySearch ? (
                    <EmptyState
                      icon={<IconSearchOutlineRegular size={28} />}
                      title={t('empty.search.title')}
                      hint={t('empty.search.hint')}
                      action={
                        <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                          {t('search.clear')}
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<IconArchiveOutlineRegular size={28} />}
                      title={t('empty.archived.title')}
                      hint={t('empty.archived.hint')}
                    />
                  )
                ) : (
                  archivedItems.map((item) => {
                    const selected = selectedSet.has(item.id)
                    const selectable = isSelectable(item)
                    const title =
                      item.status === 'missing'
                        ? t('row.missingTitle', { id: shortSessionId(item.id) })
                        : item.title
                    const snippet =
                      item.status === 'missing' ? t('row.missingSnippet') : item.snippet
                    return (
                      <div
                        className="adk-row"
                        data-selected={selected}
                        data-disabled={!selectable}
                        key={item.id}
                        onClick={() => toggleItem(item)}
                      >
                        <span
                          className="adk-cell-check"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            label=""
                            checked={selected}
                            disabled={!selectable || busy}
                            title={
                              item.status === 'running'
                                ? t('status.tooltip.running')
                                : item.status === 'open'
                                  ? t('status.tooltip.open')
                                  : t('select.allPage')
                            }
                            onChange={() => toggleItem(item)}
                          />
                        </span>
                        <div className="adk-cell-main">
                          <div className="adk-row-title" title={title}>
                            {title}
                          </div>
                          <div className="adk-row-snippet" title={snippet}>
                            {snippet === '' ? '—' : snippet}
                          </div>
                        </div>
                        <span className="adk-cell-project" title={item.cwd ?? item.workspaceTitle}>
                          {item.workspaceTitle ?? item.cwd ?? '—'}
                        </span>
                        <span className="adk-cell-time" title={formatDateTime(item.updatedAt)}>
                          {formatRelativeTime(item.updatedAt)}
                        </span>
                        <span className="adk-cell-size">{formatBytes(item.sizeBytes)}</span>
                        <span className="adk-cell-status">
                          <StatusBadge item={item} t={t} />
                        </span>
                        <span
                          className="adk-cell-actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.status !== 'missing' && (
                            <Tooltip label={t('action.unarchive')} side="bottom" align="end">
                              <button
                                type="button"
                                className="adk-icon-button"
                                aria-label={t('action.unarchive')}
                                disabled={busy}
                                onClick={() => void unarchive([item.id])}
                              >
                                <IconUnarchiveOutlineRegular size={15} />
                              </button>
                            </Tooltip>
                          )}
                          {selectable && (
                            <Tooltip
                              label={
                                item.status === 'missing'
                                  ? t('action.removeReference')
                                  : t('action.delete')
                              }
                              side="bottom"
                              align="end"
                            >
                              <button
                                type="button"
                                className="adk-icon-button"
                                aria-label={t('action.delete')}
                                disabled={busy}
                                onClick={() => void openDelete([item.id])}
                              >
                                <IconTrashOutlineRegular size={15} />
                              </button>
                            </Tooltip>
                          )}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
              {archived !== null && archived.total > 0 && (
                <Pagination
                  t={t}
                  page={archivedPage}
                  pageSize={pageSize}
                  total={archived.total}
                  busy={busy}
                  onPage={setArchivedPage}
                  onPageSize={(size) => {
                    setPageSize(size)
                    setArchivedPage(0)
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="adk-toolbar">
              <span className="adk-selected">
                {selectedTrashIds.length > 0
                  ? t('select.selected', { count: selectedTrashIds.length })
                  : t('tab.trash')}
              </span>
              <span className="adk-toolbar-spacer" />
              <div className="adk-toolbar-actions">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || selectedTrashIds.length === 0}
                  onClick={() => void restoreTrash(selectedTrashIds)}
                >
                  <IconUnarchiveOutlineRegular size={14} />
                  {t('action.restore')} ({selectedTrashIds.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="adk-danger"
                  disabled={busy || selectedTrashIds.length === 0}
                  onClick={() => openPurge(selectedTrashIds)}
                >
                  <IconTrashOutlineRegular size={14} />
                  {t('action.purge')} ({selectedTrashIds.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="adk-danger"
                  disabled={busy || trashCount === 0}
                  onClick={openEmptyTrash}
                >
                  {t('action.emptyTrash')}
                </Button>
              </div>
            </div>

            <div className="adk-table">
              <div className="adk-table-head adk-trash-head">
                <span className="adk-cell-check">
                  <Checkbox
                    label=""
                    checked={allTrashPageSelected}
                    disabled={selectableTrashPageIds.length === 0 || busy}
                    title={t('select.allPage')}
                    onChange={toggleTrashPage}
                  />
                </span>
                <span>{t('table.session')}</span>
                <span>{t('table.project')}</span>
                <span>{t('table.activity')}</span>
                <span>{t('table.size')}</span>
                <span>{t('table.status')}</span>
                <span />
              </div>
              <div className="adk-table-scroll" data-refreshing={refreshing}>
                {loading && trash === null ? (
                  <SkeletonRows />
                ) : trashItems.length === 0 ? (
                  <EmptyState
                    icon={<IconTrashOutlineRegular size={28} />}
                    title={t('empty.trash.title')}
                    hint={t('empty.trash.hint')}
                  />
                ) : (
                  trashItems.map((item) => {
                    const selected = selectedTrashSet.has(item.trashId)
                    const corrupt = item.status === 'corrupt'
                    return (
                      <div
                        className="adk-row adk-trash-row"
                        data-selected={selected}
                        key={item.trashId}
                        onClick={() => toggleTrashItem(item)}
                      >
                        <span
                          className="adk-cell-check"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            label=""
                            checked={selected}
                            disabled={busy}
                            title={t('select.allPage')}
                            onChange={() => toggleTrashItem(item)}
                          />
                        </span>
                        <div className="adk-cell-main">
                          <div className="adk-row-title" title={item.title}>
                            {item.title}
                          </div>
                          <div className="adk-row-snippet" title={item.snippet}>
                            {corrupt
                              ? t('trash.corruptHint')
                              : item.snippet === ''
                                ? '—'
                                : item.snippet}
                          </div>
                        </div>
                        <span className="adk-cell-project">
                          {item.workspaceTitle ?? item.cwd ?? '—'}
                        </span>
                        <span className="adk-cell-time" title={formatDateTime(item.movedAt)}>
                          {item.movedAt === undefined
                            ? '—'
                            : t('trash.movedAt', { time: formatRelativeTime(item.movedAt) })}
                        </span>
                        <span className="adk-cell-size">{formatBytes(item.sizeBytes)}</span>
                        <span className="adk-cell-status">
                          {corrupt ? (
                            <Tooltip label={t('status.tooltip.corrupt')} side="bottom">
                              <span className="adk-status" data-status="missing">
                                <Tag tone="danger">{t('status.corrupt')}</Tag>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tag tone="info">{t('status.ok')}</Tag>
                          )}
                        </span>
                        <span
                          className="adk-row-actions"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip label={t('action.restore')} side="bottom" align="end">
                            <button
                              type="button"
                              className="adk-icon-button"
                              aria-label={t('action.restore')}
                              disabled={busy || corrupt}
                              onClick={() => void restoreTrash([item.trashId])}
                            >
                              <IconUnarchiveOutlineRegular size={15} />
                            </button>
                          </Tooltip>
                          <Tooltip label={t('action.purge')} side="bottom" align="end">
                            <button
                              type="button"
                              className="adk-icon-button"
                              aria-label={t('action.purge')}
                              disabled={busy}
                              onClick={() => openPurge([item.trashId])}
                            >
                              <IconTrashOutlineRegular size={15} />
                            </button>
                          </Tooltip>
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
              {trash !== null && trash.total > 0 && (
                <Pagination
                  t={t}
                  page={trashPage}
                  pageSize={pageSize}
                  total={trash.total}
                  busy={busy}
                  onPage={setTrashPage}
                  onPageSize={(size) => {
                    setPageSize(size)
                    setTrashPage(0)
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>

      {pending !== null && (
        <ConfirmDialog
          key={
            pending.kind === 'delete'
              ? `delete-${pending.ids.join(',')}`
              : pending.kind === 'purge'
                ? `purge-${pending.trashIds.join(',')}`
                : 'empty'
          }
          t={t}
          pending={pending}
          preview={preview}
          previewLoading={previewLoading}
          mode={dialogMode}
          busy={busy}
          error={dialogError}
          onMode={(mode) => {
            setDialogMode(mode)
            setDialogError(null)
          }}
          onCancel={() => {
            if (busy) return
            setPending(null)
            setPreview(null)
            setDialogError(null)
          }}
          onConfirm={confirm}
        />
      )}

      {toast !== null && (
        <Toast
          key={toast.id}
          text={toast.text}
          tone={toast.tone === 'success' ? 'success' : undefined}
          icon={
            toast.tone === 'error' ? <IconWarningTriangleOutlineRegular size={15} /> : undefined
          }
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
