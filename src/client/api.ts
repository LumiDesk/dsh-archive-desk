/** Small typed client for the plugin's own `/archive-desk/*` route. */

const ROUTE = '/archive-desk'

export class ArchiveDeskClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ArchiveDeskClientError'
    this.code = code
    this.status = status
  }
}

interface Envelope<T> {
  ok?: boolean
  value?: T
  error?: { code?: string; message?: string }
}

export async function call<T>(
  endpoint: string,
  payload: unknown = {},
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${ROUTE}/${endpoint}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  const text = await response.text()
  let body: Envelope<T>
  try {
    body = JSON.parse(text) as Envelope<T>
  } catch {
    throw new ArchiveDeskClientError('archive/internal', `HTTP ${response.status}`, response.status)
  }
  if (body.ok === true) return body.value as T
  throw new ArchiveDeskClientError(
    body.error?.code ?? 'archive/internal',
    body.error?.message ?? `HTTP ${response.status}`,
    response.status,
  )
}
