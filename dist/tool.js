const TOOL_NAME = 'archived_conversations';
const MAX_IDS = 100;
const TOOL_DESCRIPTION = [
    'List, delete (into the recycle bin) or restore archived DeepSeek Harness conversations.',
    'Actions: list (newest first, with title/preview/size), delete (archived ids -> recycle bin;',
    'requires confirm:true), restore (recycle-bin trashIds back to the archive), trash (list the bin).',
    'Permanent deletion is not available through this tool; ask the user to use the Archive Desk panel.',
].join(' ');
function strings(value, limit) {
    if (!Array.isArray(value))
        return [];
    return [...new Set(value.filter((entry) => typeof entry === 'string'))].slice(0, limit);
}
function truncatedTrash(entries) {
    return entries.map((entry) => ({
        trashId: entry.trashId,
        sessionId: entry.sessionId,
        title: entry.title,
        sizeBytes: entry.sizeBytes,
        movedAt: entry.movedAt,
    }));
}
function summarizeList(result) {
    return {
        total: result.total,
        totalBytes: result.totalBytes,
        items: result.items.map((item) => ({
            id: item.id,
            title: item.title,
            snippet: item.snippet,
            workspaceTitle: item.workspaceTitle,
            updatedAt: item.updatedAt,
            sizeBytes: item.sizeBytes,
            status: item.status,
        })),
    };
}
function summarizeDelete(result) {
    return {
        deleted: result.deleted.length,
        freedBytes: result.freedBytes,
        skipped: result.skipped,
    };
}
/** Build the `archived_conversations` definition for one Host context. */
export function toolDefinition(createService, ctx) {
    return {
        name: TOOL_NAME,
        description: TOOL_DESCRIPTION,
        parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
                action: {
                    type: 'string',
                    required: true,
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
                    description: 'Recycle-bin entry ids for `restore`.',
                },
                query: { type: 'string', description: 'Filter for `list`.' },
                offset: { type: 'integer', description: 'Page offset for `list` (default 0).' },
                limit: { type: 'integer', description: 'Page size for `list` (default 20, max 100).' },
                confirm: {
                    type: 'boolean',
                    description: 'Must be true to perform `delete`. Deletion moves sessions to the bin.',
                },
            },
        },
        output: {
            schema: { type: 'object', additionalProperties: true },
            render: (_args, value) => [
                { type: 'text', text: JSON.stringify(value, null, 2) },
            ],
        },
        async execute(args) {
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
                const entries = await service.listTrash();
                return { ok: true, action, total: entries.length, items: truncatedTrash(entries) };
            }
            if (action === 'delete') {
                const ids = strings(args.ids, MAX_IDS);
                if (ids.length === 0)
                    return { ok: false, action, error: 'archive/bad-request: ids required' };
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
                const trashIds = strings(args.trashIds, MAX_IDS);
                if (trashIds.length === 0) {
                    return { ok: false, action, error: 'archive/bad-request: trashIds required' };
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
        },
    };
}
