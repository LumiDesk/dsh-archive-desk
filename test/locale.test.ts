import assert from 'node:assert/strict'
import { test } from 'node:test'

import { dictionaryKeys, formatMessage } from '../src/client/locales.ts'

test('Chinese and English dictionaries carry the same keys', () => {
  const keys = dictionaryKeys()
  assert.deepEqual(keys.en, keys.zh)
})

test('formatMessage replaces named placeholders without touching other text', () => {
  assert.equal(
    formatMessage('已选 {count} 项 · {size}', { count: 2, size: '1 KB' }),
    '已选 2 项 · 1 KB',
  )
  assert.equal(formatMessage('{missing}', {}), '{missing}')
})
