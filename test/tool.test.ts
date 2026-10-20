import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Context } from '@deepseek-ai/cordis'
import { assertSupportedJsonSchema } from '@deepseek-ai/dsh-tools'

import type { ArchiveDeskService } from '../src/host/service.ts'
import { toolDefinition } from '../src/host/tool.ts'

interface ToolResult {
  ok: boolean
  action?: string
  error?: string
  total?: number
  deleted?: number
  restored?: number
  items?: unknown[]
}

function definition(overrides: Partial<ArchiveDeskService> = {}) {
  const calls: Array<{ method: string; request: unknown }> = []
  const service = {
    list: async (request: unknown) => {
      calls.push({ method: 'list', request })
      return {
        total: 1,
        offset: 0,
        limit: 20,
        totalBytes: 42,
        matchingIds: ['session-a'],
        items: [
          {
            id: 'session-a',
            title: '归档清理',
            snippet: '帮我删掉',
            updatedAt: 1_200,
            createdAt: 900,
            sizeBytes: 42,
            status: 'ok',
          },
        ],
      }
    },
    listTrash: async (request: unknown) => {
      calls.push({ method: 'listTrash', request })
      return { total: 0, totalBytes: 0, offset: 0, limit: 50, items: [] }
    },
    delete: async (request: unknown) => {
      calls.push({ method: 'delete', request })
      return { deleted: ['session-a'], partial: [], skipped: [], freedBytes: 42 }
    },
    restore: async (request: unknown) => {
      calls.push({ method: 'restore', request })
      return { restored: ['trash-a'], failed: [] }
    },
    ...overrides,
  } as unknown as ArchiveDeskService

  const tool = toolDefinition(() => service, {} as Context) as unknown as {
    execute(args: unknown): Promise<ToolResult>
    output: { render(args: unknown, value: unknown): Array<{ type: string; text: string }> }
  }

  return { tool, calls }
}

test('list summarizes rows and forwards paging', async () => {
  const { tool, calls } = definition()
  const result = await tool.execute({ action: 'list', query: '归档', limit: 5 })

  assert.equal(result.ok, true)
  assert.equal(result.total, 1)
  assert.equal((result.items as Array<{ title: string }>)[0]?.title, '归档清理')
  assert.deepEqual(calls[0], { method: 'list', request: { query: '归档', limit: 5 } })
})

test('delete requires explicit confirmation and never purges', async () => {
  const { tool, calls } = definition()

  const refused = await tool.execute({ action: 'delete', ids: ['session-a'] })
  assert.equal(refused.ok, false)
  assert.match(refused.error ?? '', /forbidden/)
  assert.equal(calls.length, 0)

  const accepted = await tool.execute({ action: 'delete', ids: ['session-a'], confirm: true })
  assert.equal(accepted.ok, true)
  assert.equal(accepted.deleted, 1)
  assert.deepEqual(calls[0], {
    method: 'delete',
    request: { ids: ['session-a'], mode: 'trash' },
  })
})

test('restore needs trash ids and reports the count', async () => {
  const { tool, calls } = definition()

  const refused = await tool.execute({ action: 'restore' })
  assert.equal(refused.ok, false)
  assert.equal(calls.length, 0)

  const accepted = await tool.execute({ action: 'restore', trashIds: ['trash-a'] })
  assert.equal(accepted.ok, true)
  assert.equal(accepted.restored, 1)
})

test('unknown actions are rejected, and rendering is plain text', async () => {
  const { tool } = definition()

  const result = await tool.execute({ action: 'purge', ids: ['session-a'] })
  assert.equal(result.ok, false)
  assert.match(result.error ?? '', /unknown action/)

  const blocks = tool.output.render({}, { ok: true })
  assert.equal(blocks[0]?.type, 'text')
  assert.match(blocks[0]?.text ?? '', /"ok": true/)
})

test('every tool result survives a lossless JSON round-trip', async () => {
  // A list row without a workspace used to carry `workspaceTitle: undefined`,
  // which the tool layer rejects with "value is not lossless JSON".
  const { tool } = definition()

  for (const args of [
    { action: 'list' },
    { action: 'trash' },
    { action: 'delete', ids: ['session-a'], confirm: true },
    { action: 'restore', trashIds: ['trash-a'] },
    { action: 'nope' },
  ]) {
    const value = await tool.execute(args)
    assert.deepEqual(
      JSON.parse(JSON.stringify(value)),
      value,
      `round-trip failed for ${args.action}`,
    )
  }
})

test('delete refuses more than 100 ids instead of silently truncating', async () => {
  const { tool, calls } = definition()
  const ids = Array.from({ length: 101 }, (_, index) => `session-${String(index)}`)
  const result = await tool.execute({ action: 'delete', ids, confirm: true })

  assert.equal(result.ok, false)
  assert.match(result.error ?? '', /at most 100/)
  assert.equal(calls.length, 0)
})

test('trash forwards paging and renders corrupt entries', async () => {
  const calls: Array<{ method: string; request: unknown }> = []
  const service = {
    listTrash: async (request: unknown) => {
      calls.push({ method: 'listTrash', request })
      return {
        total: 1,
        totalBytes: 0,
        offset: 10,
        limit: 5,
        items: [
          {
            trashId: 'trash-broken',
            status: 'corrupt',
            title: 'broken',
            snippet: '',
            sizeBytes: 0,
            reason: 'payload',
          },
        ],
      }
    },
  } as unknown as ArchiveDeskService
  const tool = toolDefinition(() => service, {} as Context) as unknown as {
    execute(args: unknown): Promise<{ items?: Array<{ status?: string }>; total?: number }>
  }

  const result = await tool.execute({ action: 'trash', offset: 10, limit: 5 })
  assert.equal(result.total, 1)
  assert.equal(result.items?.[0]?.status, 'corrupt')
  assert.deepEqual(calls[0], { method: 'listTrash', request: { offset: 10, limit: 5 } })
})

test('tool schemas pass the harness JSON Schema validator', () => {
  // Two earlier shapes broke every model request:
  //   - property-level `required: true` → `true is not of type "array"`
  //   - a bare property map           → `got "type: null"`
  // `assertSupportedJsonSchema` is the harness's own gate, so passing it here
  // means the wire schema is accepted before it ever reaches a provider.
  const { tool } = definition()
  const definitionShape = tool as unknown as {
    parameters: {
      type: string
      required: string[]
      properties: Record<string, { type: string; items?: unknown; required?: unknown }>
    }
    output: { schema: unknown }
  }

  assertSupportedJsonSchema(definitionShape.parameters as never)
  assertSupportedJsonSchema(definitionShape.output.schema as never)

  assert.equal(definitionShape.parameters.type, 'object')
  assert.deepEqual(definitionShape.parameters.required, ['action'])
  for (const spec of Object.values(definitionShape.parameters.properties)) {
    assert.equal(typeof spec.type, 'string')
    assert.equal('required' in spec, false)
    if (spec.type === 'array') assert.equal(typeof spec.items, 'object')
  }
})
