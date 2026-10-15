import { expect, it } from 'vitest'
import type { Column } from './board'
import { moveCard } from './board'
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
