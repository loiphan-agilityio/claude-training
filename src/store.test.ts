import { expect, it } from 'vitest'
import { initialColumns } from './board'
import { buildColumn } from './mocks/board'
import { useBoardStore } from './store'

const storageKey = 'kanban-board'

it('starts with the sample board when nothing is stored', async () => {
  await useBoardStore.persist.rehydrate()
  expect(useBoardStore.getState().columns).toEqual(initialColumns)
})

it('saves the board to localStorage when a card moves', () => {
  const [todo, , done] = initialColumns
  const card = todo.cards[0]

  useBoardStore.getState().moveCard(card.id, done.id, 0)

  const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')

  expect(saved.state.columns[2].cards[0].id).toBe(card.id)
})

it('restores the stored board', async () => {
  const columns = [buildColumn(), buildColumn()]

  localStorage.setItem(storageKey, JSON.stringify({ state: { columns } }))
  await useBoardStore.persist.rehydrate()

  expect(useBoardStore.getState().columns).toEqual(columns)
})

it.each([
  ['invalid JSON', '{not json'],
  ['JSON of the wrong shape', JSON.stringify({ state: { columns: 'oops' } })],
])('falls back to the sample board on %s', async (_, stored) => {
  localStorage.setItem(storageKey, stored)
  await useBoardStore.persist.rehydrate()

  expect(useBoardStore.getState().columns).toEqual(initialColumns)
})
