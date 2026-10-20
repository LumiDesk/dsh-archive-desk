/**
 * Cross-component hand-off: the sidebar session menu asks the panel to delete
 * one session. The panel may not be mounted yet when the click lands, so the
 * request is parked until a subscriber appears (mount) or fires immediately.
 */
export interface PendingDeletion {
  ids: string[]
  title?: string
}

let pendingDeletion: PendingDeletion | null = null

export function requestDeletion(ids: string[], title?: string): void {
  pendingDeletion = { ids, ...(title === undefined ? {} : { title }) }
  for (const listener of deletionListeners) listener()
}

export function takeDeletion(): PendingDeletion | null {
  const value = pendingDeletion
  pendingDeletion = null
  return value
}

const deletionListeners = new Set<() => void>()

export function subscribeDeletion(listener: () => void): () => void {
  deletionListeners.add(listener)
  return () => {
    deletionListeners.delete(listener)
  }
}
