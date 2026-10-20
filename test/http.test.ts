import assert from 'node:assert/strict'
import { test } from 'node:test'

import { endpointOf } from '../src/host/index.ts'

test('endpointOf accepts one segment under the route', () => {
  assert.equal(endpointOf('/archive-desk/status'), 'status')
  assert.equal(endpointOf('/archive-desk/list'), 'list')
  assert.equal(endpointOf('/archive-desk/status?x=1'), 'status')
})

test('endpointOf rejects anything outside the route shape', () => {
  assert.equal(endpointOf(undefined), undefined)
  assert.equal(endpointOf('/'), undefined)
  assert.equal(endpointOf('/archive-desk'), undefined)
  assert.equal(endpointOf('/archive-desk/'), undefined)
  assert.equal(endpointOf('/archive-desk/a/b'), undefined)
  assert.equal(endpointOf('/other/status'), undefined)
  assert.equal(endpointOf('/archive-desk/../apix'), undefined)
})
