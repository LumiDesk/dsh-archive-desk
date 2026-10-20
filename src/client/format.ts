import { ArchiveDeskClientError } from './api'
import type { Translate } from './locales'

const ERROR_KEYS: Record<string, string> = {
  'archive/live-session': 'error.archive/live-session',
  'archive/open-session': 'error.archive/open-session',
  'archive/not-archived': 'error.archive/not-archived',
  'archive/busy': 'error.archive/busy',
  'archive/not-found': 'error.archive/not-found',
  'archive/restore-conflict': 'error.archive/restore-conflict',
  'archive/trash-corrupt': 'error.archive/trash-corrupt',
  'archive/unsupported': 'error.archive/unsupported',
  'archive/forbidden': 'error.archive/forbidden',
  'archive/bad-request': 'error.archive/bad-request',
  'archive/cross-device': 'error.archive/cross-device',
  'archive/internal': 'error.archive/internal',
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[index] ?? 'TB'}`
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

/** Browser-local relative time, falling back to a date for older rows. */
export function formatRelativeTime(value: number | string | undefined, now = Date.now()): string {
  if (value === undefined || value === '') return '—'
  const time = typeof value === 'string' ? Date.parse(value) : value
  if (!Number.isFinite(time) || time <= 0) return '—'
  const delta = time - now
  const absolute = Math.abs(delta)
  if (absolute < 60 * 1000)
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(0, 'second')
  if (absolute > 30 * 24 * 60 * 60 * 1000) {
    return new Date(time).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, size] of RELATIVE_UNITS) {
    if (absolute >= size) return formatter.format(Math.round(delta / size), unit)
  }
  return formatter.format(Math.round(delta / (60 * 1000)), 'minute')
}

export function formatDateTime(value: number | string | undefined): string {
  if (value === undefined || value === '') return '—'
  const time = typeof value === 'string' ? Date.parse(value) : value
  if (!Number.isFinite(time) || time <= 0) return '—'
  return new Date(time).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Tail of a session id, for a row whose log is gone and has no title. */
export function shortSessionId(id: string): string {
  return id.startsWith('session-')
    ? id.slice('session-'.length, 'session-'.length + 8)
    : id.slice(0, 8)
}

/** Map a Host error code to localized copy, falling back to its message. */
export function errorText(error: unknown, t: Translate): string {
  if (error instanceof ArchiveDeskClientError) {
    const key = ERROR_KEYS[error.code]
    if (key !== undefined) return t(key)
    return error.message
  }
  if (error instanceof Error && error.name === 'AbortError') return t('error.unknown')
  return error instanceof Error ? error.message : t('error.unknown')
}
