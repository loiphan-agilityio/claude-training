import { expect, it } from 'vitest'
import type { Column } from './board'
import { addCard, deleteCard, moveCard, updateCard } from './board'
import { buildCard, buildColumn } from './mocks/board'

const buildBoard = () => {
  const [a, b, c, d] = [buildCard(), buildCard(), buildCard(), buildCard()]
  const todo = buildColumn({ cards: [a, b, c] })
  const doing = buildColumn({ cards: [d] })
  const empty = buildColumn({ cards: [] })

  return { columns: [todo, doing, empty], a, b, c, d, todo, doing, empty }
}

const ids = (column: Column) => column.cards.map((card) => card.id)

it('moves a card down within its column', () => {
  const { columns, a, b, c, todo } = buildBoard()
  const [after] = moveCard(columns, a.id, todo.id, 2)

  expect(ids(after)).toEqual([b.id, c.id, a.id])
})

it('moves a card up within its column', () => {
  const { columns, a, b, c, todo } = buildBoard()
  const [after] = moveCard(columns, c.id, todo.id, 0)

  expect(ids(after)).toEqual([c.id, a.id, b.id])
})

it('moves a card to another column at the given index', () => {
  const { columns, a, b, c, d, todo, doing } = buildBoard()
  const [from, to] = moveCard(columns, b.id, doing.id, 0)

  expect(ids(from)).toEqual([a.id, c.id])
  expect(ids(to)).toEqual([b.id, d.id])
  expect(from.id).toBe(todo.id)
})

it('moves a card into an empty column', () => {
  const { columns, a, empty } = buildBoard()
  const [, , to] = moveCard(columns, a.id, empty.id, 0)

  expect(ids(to)).toEqual([a.id])
})

it('appends the card when the index is past the end', () => {
  const { columns, a, d, doing } = buildBoard()
  const [, to] = moveCard(columns, a.id, doing.id, 99)

  expect(ids(to)).toEqual([d.id, a.id])
})

it.each([
  ['card', 'missing-card', undefined],
  ['column', undefined, 'missing-column'],
])('returns the columns unchanged for an unknown %s', (_, cardId, columnId) => {
  const { columns, a, todo } = buildBoard()

  expect(moveCard(columns, cardId ?? a.id, columnId ?? todo.id, 0)).toBe(
    columns,
  )
})

it('does not mutate its input', () => {
  const { columns, a, doing } = buildBoard()
  const snapshot = structuredClone(columns)
  const result = moveCard(columns, a.id, doing.id, 0)

  expect(result).not.toBe(columns)
  expect(columns).toEqual(snapshot)
})

it('appends a card to the bottom of the given column only', () => {
  const { columns, a, b, c, d, todo, doing, empty } = buildBoard()
  const card = buildCard()
  const [after, other, untouched] = addCard(columns, doing.id, card)

  expect(ids(after)).toEqual([a.id, b.id, c.id])
  expect(ids(other)).toEqual([d.id, card.id])
  expect(after.id).toBe(todo.id)
  expect(untouched).toBe(empty)
})

it('returns the columns unchanged for an unknown column', () => {
  const { columns } = buildBoard()

  expect(addCard(columns, 'missing-column', buildCard())).toEqual(columns)
})

const fields = { title: 'Renamed card', priority: 'low' } as const

it('replaces a card in place and keeps its id, column and position', () => {
  const { columns, a, b, c, d, todo } = buildBoard()
  const [after, other] = updateCard(columns, b.id, {
    ...fields,
    assignee: 'Zed',
  })

  expect(after.id).toBe(todo.id)
  expect(ids(after)).toEqual([a.id, b.id, c.id])
  expect(after.cards[1]).toStrictEqual({ ...fields, assignee: 'Zed', id: b.id })
  expect(after.cards[0]).toBe(a)
  expect(other.cards[0]).toBe(d)
})

it('clears the optional fields that are left out', () => {
  const { columns, a } = buildBoard()
  const [after] = updateCard(columns, a.id, fields)

  expect(after.cards[0]).toStrictEqual({ ...fields, id: a.id })
})

it('returns the columns unchanged for an unknown card', () => {
  const { columns } = buildBoard()

  expect(updateCard(columns, 'missing-card', fields)).toEqual(columns)
})

it('does not mutate the columns when updating a card', () => {
  const { columns, a } = buildBoard()
  const snapshot = structuredClone(columns)

  updateCard(columns, a.id, fields)

  expect(columns).toEqual(snapshot)
})

it('removes only the card and keeps the rest in order', () => {
  const { columns, a, b, c, d } = buildBoard()
  const [after, other] = deleteCard(columns, b.id)

  expect(ids(after)).toEqual([a.id, c.id])
  expect(ids(other)).toEqual([d.id])
})

it('leaves the other columns as they were', () => {
  const { columns, a, doing, empty } = buildBoard()
  const [, other, untouched] = deleteCard(columns, a.id)

  expect(other).toEqual(doing)
  expect(untouched).toEqual(empty)
})

it('returns the columns unchanged for an unknown card', () => {
  const { columns } = buildBoard()

  expect(deleteCard(columns, 'missing-card')).toEqual(columns)
})

it('does not mutate the columns when deleting a card', () => {
  const { columns, a } = buildBoard()
  const snapshot = structuredClone(columns)

  deleteCard(columns, a.id)

  expect(columns).toEqual(snapshot)
})
