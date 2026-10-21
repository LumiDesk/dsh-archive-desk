/** Wire types shared by the panel and the plugin's HTTP endpoints. */

export type ArchivedStatus = 'ok' | 'running' | 'missing'

export interface ArchivedItem {
  id: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  createdAt: number
  updatedAt: number
  sizeBytes: number
  status: ArchivedStatus
}

export type SortMode = 'recent' | 'size' | 'title' | 'archive'
export type PageSize = 10 | 20 | 50
export type Tab = 'archived' | 'trash'
export type DeleteMode = 'trash' | 'purge'

export interface ListResult {
  total: number
  offset: number
  limit: number
  totalBytes: number
  missing: number
  missingTotal: number
  matchingIds: string[]
  matchingIdsTruncated: boolean
  items: ArchivedItem[]
}

export interface InspectResult {
  items: ArchivedItem[]
  total: number
  totalBytes: number
  deletable: number
  running: number
  notSettled: number
  missing: number
  notArchived: string[]
}

export type TrashStatus = 'ready' | 'corrupt'
export type TrashCorruption = 'metadata' | 'payload' | 'interrupted'

export interface TrashItem {
  trashId: string
  status: TrashStatus
  sessionId?: string
  title: string
  snippet: string
  cwd?: string
  workspaceId?: string
  workspaceTitle?: string
  originalPath?: string
  movedAt?: string
  sizeBytes: number
  reason?: TrashCorruption
}

export interface TrashListResult {
  total: number
  totalBytes: number
  offset: number
  limit: number
  items: TrashItem[]
}

export interface UnarchiveResult {
  unarchived: string[]
  skipped: Array<{ id: string; reason: string }>
}

export interface DeleteResult {
  deleted: string[]
  partial: Array<{ id: string; reason: string }>
  skipped: Array<{ id: string; reason: string }>
  freedBytes: number
}

export interface RestoreResult {
  restored: string[]
  failed: Array<{ trashId: string; reason: string }>
}

export interface PurgeResult {
  purged: string[]
  failed: Array<{ trashId: string; reason: string }>
  freedBytes: number
}

export interface CleanDanglingResult {
  removed: string[]
  failed: Array<{ id: string; reason: string }>
}

export type Pending =
  | { kind: 'delete'; ids: string[] }
  | { kind: 'empty'; count: number; bytes: number }
  | { kind: 'purge'; trashIds: string[]; count: number; bytes: number; label?: string }

export interface ToastState {
  id: number
  text: string
  tone: 'success' | 'error'
}
