import { expect, it } from 'vitest'
import { initialColumns } from './board'
import { buildCard, buildColumn } from './mocks/board'
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

it('adds a card with a fresh id at the bottom of the column and saves it', () => {
  const { id: _, ...card } = buildCard()
  const [todo] = initialColumns

  useBoardStore.getState().addCard(todo.id, card)
  useBoardStore.getState().addCard(todo.id, card)

  const added = useBoardStore.getState().columns[0].cards.slice(-2)
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')

  expect(added[0]).toMatchObject(card)
  expect(added[0].id).not.toBe(added[1].id)
  expect(saved.state.columns[0].cards.at(-1).id).toBe(added[1].id)
})

it('updates a card in place and saves it', () => {
  const { id: _, ...fields } = buildCard()
  const [todo] = initialColumns
  const card = todo.cards[1]

  useBoardStore.getState().updateCard(card.id, fields)

  const updated = useBoardStore.getState().columns[0].cards
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')

  expect(updated[1]).toEqual({ ...fields, id: card.id })
  expect(updated).toHaveLength(todo.cards.length)
  expect(saved.state.columns[0].cards[1]).toEqual({ ...fields, id: card.id })
})

it('deletes a card and saves it', () => {
  const [todo] = initialColumns
  const card = todo.cards[1]

  useBoardStore.getState().deleteCard(card.id)

  const remaining = useBoardStore.getState().columns[0].cards
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')

  expect(remaining.map((c) => c.id)).toEqual(
    todo.cards.filter((c) => c.id !== card.id).map((c) => c.id),
  )
  expect(saved.state.columns[0].cards).toHaveLength(todo.cards.length - 1)
  expect(JSON.stringify(saved)).not.toContain(card.id)
})

it('keeps a deleted card gone after a reload', async () => {
  const [todo] = initialColumns
  const card = todo.cards[1]

  useBoardStore.getState().deleteCard(card.id)

  const stored = localStorage.getItem(storageKey) ?? ''

  // a reload: memory is back to the sample board, only localStorage remembers
  useBoardStore.setState(useBoardStore.getInitialState(), true)
  localStorage.setItem(storageKey, stored)
  await useBoardStore.persist.rehydrate()

  const ids = useBoardStore
    .getState()
    .columns.flatMap((c) => c.cards.map((x) => x.id))

  expect(ids).not.toContain(card.id)
  expect(ids).toHaveLength(initialColumns.flatMap((c) => c.cards).length - 1)
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
