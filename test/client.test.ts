import assert from 'node:assert/strict'
import { test } from 'node:test'

interface Registered {
  name?: string
  key?: string
  id?: string
}

test('client bundle registers the sidebar entry and the panel', async () => {
  const globals = globalThis as unknown as {
    window?: { __ModuleLoader__: { load(entry: unknown): void } }
  }

  let captured: {
    id: string
    factory(require: (id: string) => unknown): {
      inject: string[]
      apply(ctx: unknown): void
    }
  } | null = null

  globals.window = {
    __ModuleLoader__: {
      load(entry) {
        captured = entry as typeof captured
      },
    },
  }

  await import('../dist/client.js')
  assert.ok(captured, 'the bundle must call __ModuleLoader__.load')

  const bundle = captured as NonNullable<typeof captured>
  assert.equal(bundle.id, 'dsh-archive-desk')

  const plugin = bundle.factory(() => ({}))
  assert.deepEqual(plugin.inject, ['slots', 'locale', 'layout'])

  const registered: Registered[] = []
  const ctx = {
    effect: (execute: () => () => void) => execute(),
    locale: {
      register: () => () => undefined,
      bind: () => (key: string) => key,
    },
    slots: {
      inject: (_name: string, register: () => void) => register(),
      register: (options: Registered) => {
        registered.push(options)
        return () => undefined
      },
    },
    layout: {
      selectPanel: () => undefined,
    },
  }

  plugin.apply(ctx)

  assert.equal(registered.length, 3)
  assert.equal(registered[0]?.name, 'sidebar.panellist')
  assert.equal(registered[0]?.id, 'archive-desk')
  assert.equal(registered[1]?.name, 'main')
  assert.equal(registered[1]?.key, 'archive-desk')
  assert.equal(registered[2]?.name, 'sidebar.workspaces.session.menu.item')
  assert.equal(registered[2]?.id, 'archive-desk-delete')
})
