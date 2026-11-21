import test from 'node:test'
import assert from 'node:assert/strict'
import { matchRates, matchZones } from './matching.ts'

const zones = [
  { id: 'eastern', name: 'Eastern bypass', counties: ['utawala ruai'], towns: ['benedicta shooters'] },
  { id: 'nairobi', name: 'Nairobi Metro', counties: ['Nairobi'], towns: ['ruai'] },
]

test('Nairobi / Ruai matches the exact configured zone despite case and whitespace', () => {
  assert.deepEqual(matchZones(zones, '  NAIROBI ', ' ruai  ').map((zone) => zone.id), ['nairobi'])
})

test('a matching town does not override a wrong county', () => {
  assert.deepEqual(matchZones(zones, 'Mombasa', 'Ruai'), [])
})

test('Nairobi with an unsupported town is not delivered by a town match in another county', () => {
  assert.deepEqual(matchZones(zones, 'Nairobi', 'Unsupported Town'), [])
})

test('combined array entries are not split or guessed', () => {
  assert.deepEqual(matchZones(zones, 'Utawala', 'Benedicta'), [])
  assert.deepEqual(matchZones(zones, 'Utawala Ruai', 'Benedicta Shooters').map((zone) => zone.id), ['eastern'])
})

test('no configured match returns no zone and duplicate matches remain ambiguous', () => {
  assert.deepEqual(matchZones(zones, 'Kiambu', 'Thika'), [])
  const overlapping = [...zones, { id: 'duplicate', name: 'Duplicate', counties: ['nairobi'], towns: ['ruai'] }]
  assert.equal(matchZones(overlapping, 'Nairobi', 'Ruai').length, 2)
})

test('rate matching honors minimum, finite maximum, and unlimited null maximum', () => {
  const rates = [
    { id: 'low', min_order: 70, max_order: 999 },
    { id: 'high', min_order: 1000, max_order: null },
  ]
  assert.deepEqual(matchRates(rates, 69), [])
  assert.deepEqual(matchRates(rates, 104000).map((rate) => rate.id), ['high'])
  assert.deepEqual(matchRates([{ id: 'bounded', min_order: 70, max_order: 1000 }], 1001), [])
  assert.deepEqual(matchRates([], 104000), [])
})

test('overlapping applicable rates stay ambiguous for the caller to reject', () => {
  assert.equal(matchRates([
    { id: 'first', min_order: 70, max_order: 5000 },
    { id: 'second', min_order: 1000, max_order: null },
  ], 2000).length, 2)
})
