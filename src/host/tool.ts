/**
 * Agent-facing surface: one tool over the same service the panel uses.
 *
 * The tool is deliberately narrower than the UI: it can list, delete into the
 * recycle bin, restore, and inspect the bin. Permanent deletion stays a human
 * action, because an unrecoverable bulk delete triggered by a sentence is not
 * a trade this plugin makes (docs/设计.md §7).
 *
 * The definition is hand-written instead of importing `defineTool`, so the
 * plugin keeps zero runtime imports from the harness installation.
 */
import type { Context } from '@deepseek-ai/cordis'

import type { ArchiveDeskService, DeleteResult, ListResult } from './service.ts'
import type { TrashEntry } from './trash.ts'

const TOOL_NAME = 'archived_conversations'
const MAX_IDS = 100

const TOOL_DESCRIPTION = [
  'List, unarchive, delete (into the recycle bin) or restore archived DeepSeek Harness',
  'conversations. Actions: list (newest first, with title/preview/size and running/open state),',
  'unarchive (archived ids -> the normal workspace, files untouched), delete (archived ids ->',
  'recycle bin; requires confirm:true), restore (recycle-bin trashIds back to the archive), trash',
  '(page through the bin). Permanent deletion is not available through this tool; ask the user to',
  'use the Archive Desk panel.',
].join(' ')

interface ToolArgs {
  action?: unknown
  ids?: unknown
  trashIds?: unknown
  query?: unknown
  offset?: unknown
  limit?: unknown
  confirm?: unknown
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))]
}

/**
 * The tool layer rejects a result that is not lossless JSON (`undefined`, NaN,
 * a class instance). Round-tripping is the cheapest guarantee that whatever
 * the service produced can travel as a tool result.
 */
function losslessJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown
}

function truncatedTrash(entries: readonly TrashEntry[] | undefined): unknown[] {
  return (entries ?? []).map((entry) => ({
    trashId: entry.trashId,
    status: entry.status,
    ...(entry.sessionId === undefined ? {} : { sessionId: entry.sessionId }),
    title: entry.title,
    sizeBytes: entry.sizeBytes,
    ...(entry.movedAt === undefined ? {} : { movedAt: entry.movedAt }),
    ...(entry.reason === undefined ? {} : { reason: entry.reason }),
  }))
}

function summarizeList(result: ListResult): Record<string, unknown> {
  return {
    total: result.total,
    totalBytes: result.totalBytes,
    missing: result.missing ?? 0,
    missingTotal: result.missingTotal ?? result.missing ?? 0,
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      snippet: item.snippet,
      // An absent workspace must not surface as `undefined`: the tool layer
      // rejects a result that is not lossless JSON.
      ...(item.workspaceTitle === undefined ? {} : { workspaceTitle: item.workspaceTitle }),
      updatedAt: item.updatedAt,
      sizeBytes: item.sizeBytes,
      status: item.status,
    })),
  }
}

function summarizeDelete(result: DeleteResult): Record<string, unknown> {
  return {
    deleted: result.deleted.length,
    partial: result.partial ?? [],
    freedBytes: result.freedBytes,
    skipped: result.skipped,
  }
}

/** Build the `archived_conversations` definition for one Host context. */
export function toolDefinition(
  createService: (ctx: Context) => ArchiveDeskService,
  ctx: Context,
): Record<string, unknown> {
  const run = async (args: ToolArgs): Promise<Record<string, unknown>> => {
    const service = createService(ctx)
    const action = typeof args.action === 'string' ? args.action : ''

    if (action === 'list') {
      const request = {
        ...(typeof args.query === 'string' ? { query: args.query } : {}),
        ...(typeof args.offset === 'number' ? { offset: args.offset } : {}),
        ...(typeof args.limit === 'number' ? { limit: args.limit } : {}),
      }
      return { ok: true, action, ...summarizeList(await service.list(request)) }
    }

    if (action === 'trash') {
      const page = await service.listTrash({
        ...(typeof args.offset === 'number' ? { offset: args.offset } : {}),
        ...(typeof args.limit === 'number' ? { limit: args.limit } : {}),
      })
      return {
        ok: true,
        action,
        total: page.total,
        totalBytes: page.totalBytes,
        items: truncatedTrash(page.items),
      }
    }

    if (action === 'delete') {
      const ids = strings(args.ids)
      if (ids.length === 0) {
        return { ok: false, action, error: 'archive/bad-request: ids required' }
      }
      if (ids.length > MAX_IDS) {
        return {
          ok: false,
          action,
          error: `archive/bad-request: at most ${MAX_IDS} ids per call`,
        }
      }
      if (args.confirm !== true) {
        return {
          ok: false,
          action,
          error:
            'archive/forbidden: pass confirm:true to move these conversations to the recycle bin',
        }
      }
      const result = await service.delete({ ids, mode: 'trash' })
      return { ok: true, action, ...summarizeDelete(result) }
    }

    if (action === 'unarchive') {
      const ids = strings(args.ids)
      if (ids.length === 0) {
        return { ok: false, action, error: 'archive/bad-request: ids required' }
      }
      if (ids.length > MAX_IDS) {
        return {
          ok: false,
          action,
          error: `archive/bad-request: at most ${MAX_IDS} ids per call`,
        }
      }
      const result = await service.unarchive({ ids })
      return {
        ok: true,
        action,
        unarchived: result.unarchived.length,
        skipped: result.skipped,
      }
    }

    if (action === 'restore') {
      const trashIds = strings(args.trashIds)
      if (trashIds.length === 0) {
        return { ok: false, action, error: 'archive/bad-request: trashIds required' }
      }
      if (trashIds.length > MAX_IDS) {
        return {
          ok: false,
          action,
          error: `archive/bad-request: at most ${MAX_IDS} trashIds per call`,
        }
      }
      const result = await service.restore({ trashIds })
      return {
        ok: true,
        action,
        restored: result.restored.length,
        failed: result.failed,
      }
    }

    return {
      ok: false,
      action,
      error: `archive/bad-request: unknown action ${JSON.stringify(action)}`,
    }
  }

  return {
    name: TOOL_NAME,
    description: TOOL_DESCRIPTION,
    // `register()` takes the COMPILED definition: `parameters` must be a real
    // JSON Schema (top-level `type`, a `required` array, and no property-level
    // `required: true`). Two earlier shapes broke every model request:
    //   1. property-level `required: true`  → `true is not of type "array"`
    //   2. a bare property map              → `got "type: null"`
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'unarchive', 'delete', 'restore', 'trash'],
          description: 'Operation to perform.',
        },
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Archived session ids for `unarchive` or `delete`. Maximum 100.',
        },
        trashIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recycle-bin entry ids for `restore`. Maximum 100.',
        },
        query: { type: 'string', description: 'Filter for `list`.' },
        offset: {
          type: 'integer',
          description: 'Page offset for `list` or `trash` (default 0).',
        },
        limit: {
          type: 'integer',
          description: 'Page size for `list` or `trash` (default 20/50, max 100).',
        },
        confirm: {
          type: 'boolean',
          description: 'Must be true to perform `delete`. Deletion moves sessions to the bin.',
        },
      },
    },
    output: {
      schema: { type: 'object' },
      render: (_args: ToolArgs, value: unknown) => [
        { type: 'text', text: JSON.stringify(value, null, 2) },
      ],
    },
    // The tool layer validates the returned value as lossless JSON; the
    // round-trip is the guarantee, the field fixes above are the cause.
    execute: async (args: ToolArgs) => losslessJson(await run(args)),
  }
}
