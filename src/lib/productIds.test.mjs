import test from 'node:test'
import assert from 'node:assert/strict'
import { isProductUuid } from './productIds.ts'

test('product UUID validation accepts canonical database IDs', () => {
  assert.equal(isProductUuid('b3f6b1e2-4c8e-4d19-b153-f3e18d9a8a61'), true)
})

test('product UUID validation rejects catalogue slugs and SKU-like IDs', () => {
  assert.equal(isProductUuid('laptop-001'), false)
  assert.equal(isProductUuid('ORM-LAPTOP-001'), false)
})
