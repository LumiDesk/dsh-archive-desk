const TOOL_NAME = 'archived_conversations';
const MAX_IDS = 100;
const TOOL_DESCRIPTION = [
    'List, delete (into the recycle bin) or restore archived DeepSeek Harness conversations.',
    'Actions: list (newest first, with title/preview/size and running/open state), delete (archived',
    'ids -> recycle bin; requires confirm:true), restore (recycle-bin trashIds back to the archive),',
    'trash (page through the bin). Permanent deletion is not available through this tool; ask the',
    'user to use the Archive Desk panel.',
].join(' ');
function strings(value) {
    if (!Array.isArray(value))
        return [];
    return [...new Set(value.filter((entry) => typeof entry === 'string'))];
}
/**
 * The tool layer rejects a result that is not lossless JSON (`undefined`, NaN,
 * a class instance). Round-tripping is the cheapest guarantee that whatever
 * the service produced can travel as a tool result.
 */
function losslessJson(value) {
    return JSON.parse(JSON.stringify(value));
}
function truncatedTrash(entries) {
    return (entries ?? []).map((entry) => ({
        trashId: entry.trashId,
        status: entry.status,
        ...(entry.sessionId === undefined ? {} : { sessionId: entry.sessionId }),
        title: entry.title,
        sizeBytes: entry.sizeBytes,
        ...(entry.movedAt === undefined ? {} : { movedAt: entry.movedAt }),
        ...(entry.reason === undefined ? {} : { reason: entry.reason }),
    }));
}
function summarizeList(result) {
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
    };
}
function summarizeDelete(result) {
    return {
        deleted: result.deleted.length,
        partial: result.partial ?? [],
        freedBytes: result.freedBytes,
        skipped: result.skipped,
    };
}
/** Build the `archived_conversations` definition for one Host context. */
export function toolDefinition(createService, ctx) {
    const run = async (args) => {
        const service = createService(ctx);
        const action = typeof args.action === 'string' ? args.action : '';
        if (action === 'list') {
            const request = {
                ...(typeof args.query === 'string' ? { query: args.query } : {}),
                ...(typeof args.offset === 'number' ? { offset: args.offset } : {}),
                ...(typeof args.limit === 'number' ? { limit: args.limit } : {}),
            };
            return { ok: true, action, ...summarizeList(await service.list(request)) };
        }
        if (action === 'trash') {
            const page = await service.listTrash({
                ...(typeof args.offset === 'number' ? { offset: args.offset } : {}),
                ...(typeof args.limit === 'number' ? { limit: args.limit } : {}),
            });
            return {
                ok: true,
                action,
                total: page.total,
                totalBytes: page.totalBytes,
                items: truncatedTrash(page.items),
            };
        }
        if (action === 'delete') {
            const ids = strings(args.ids);
            if (ids.length === 0) {
                return { ok: false, action, error: 'archive/bad-request: ids required' };
            }
            if (ids.length > MAX_IDS) {
                return {
                    ok: false,
                    action,
                    error: `archive/bad-request: at most ${MAX_IDS} ids per call`,
                };
            }
            if (args.confirm !== true) {
                return {
                    ok: false,
                    action,
                    error: 'archive/forbidden: pass confirm:true to move these conversations to the recycle bin',
                };
            }
            const result = await service.delete({ ids, mode: 'trash' });
            return { ok: true, action, ...summarizeDelete(result) };
        }
        if (action === 'restore') {
            const trashIds = strings(args.trashIds);
            if (trashIds.length === 0) {
                return { ok: false, action, error: 'archive/bad-request: trashIds required' };
            }
            if (trashIds.length > MAX_IDS) {
                return {
                    ok: false,
                    action,
                    error: `archive/bad-request: at most ${MAX_IDS} trashIds per call`,
                };
            }
            const result = await service.restore({ trashIds });
            return {
                ok: true,
                action,
                restored: result.restored.length,
                failed: result.failed,
            };
        }
        return {
            ok: false,
            action,
            error: `archive/bad-request: unknown action ${JSON.stringify(action)}`,
        };
    };
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
                    enum: ['list', 'delete', 'restore', 'trash'],
                    description: 'Operation to perform.',
                },
                ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Archived session ids for `delete`. Maximum 100.',
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
            render: (_args, value) => [
                { type: 'text', text: JSON.stringify(value, null, 2) },
            ],
        },
        // The tool layer validates the returned value as lossless JSON; the
        // round-trip is the guarantee, the field fixes above are the cause.
        execute: async (args) => losslessJson(await run(args)),
    };
}
