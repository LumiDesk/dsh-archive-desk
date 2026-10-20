import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Context } from '@deepseek-ai/cordis'

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
    listTrash: async () => {
      calls.push({ method: 'listTrash', request: {} })
      return []
    },
    delete: async (request: unknown) => {
      calls.push({ method: 'delete', request })
      return { deleted: ['session-a'], skipped: [], freedBytes: 42 }
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

test('parameters stay a compact property map, never a wrapped JSON schema', () => {
  // The harness compiles this map into a JSON Schema. Passing a schema object
  // once produced `Invalid schema for function ...: true is not of type
  // "array"` and broke every model request.
  const { tool } = definition()
  const parameters = (tool as unknown as { parameters: Record<string, unknown> }).parameters

  assert.equal('type' in parameters, false)
  assert.equal('properties' in parameters, false)
  assert.deepEqual(Object.keys(parameters).sort(), [
    'action',
    'confirm',
    'ids',
    'limit',
    'offset',
    'query',
    'trashIds',
  ])
  for (const value of Object.values(parameters)) {
    const spec = value as { type?: unknown; items?: unknown }
    assert.equal(typeof spec.type, 'string')
    if (spec.type === 'array') assert.equal(typeof spec.items, 'object')
  }
  assert.equal((parameters.action as { required?: boolean }).required, true)
})
