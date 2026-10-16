import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Column as ColumnData } from '../board'
import { buildColumn } from '../mocks/board'
import Column from './Column'

const emptyStateText = 'No cards'

const renderColumn = (overrides?: Partial<ColumnData>) => {
  const column = buildColumn(overrides)

  return { column, ...render(<Column column={column} />) }
}

it('shows the column title as a heading naming its region', () => {
  const { column } = renderColumn()
  const region = screen.getByRole('region', { name: column.title })

  expect(
    within(region).getByRole('heading', { level: 2, name: column.title }),
  ).toBeInTheDocument()
})

it('shows the number of cards', () => {
  const { column } = renderColumn()

  expect(screen.getByText(String(column.cards.length))).toBeInTheDocument()
})

it('renders every card in a list', () => {
  const { column } = renderColumn()
  const list = screen.getByRole('list')

  expect(within(list).getAllByRole('listitem')).toHaveLength(
    column.cards.length,
  )

  for (const card of column.cards) {
    expect(
      within(list).getByRole('heading', { level: 3, name: card.title }),
    ).toBeInTheDocument()
  }
})

it('shows an empty state when there are no cards', () => {
  const { column } = renderColumn({ cards: [] })

  expect(screen.getByText(emptyStateText)).toBeInTheDocument()
  expect(screen.getByText(String(column.cards.length))).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

it('does not show the empty state when there are cards', () => {
  renderColumn()

  expect(screen.queryByText(emptyStateText)).not.toBeInTheDocument()
})

it('has an add card button named after the column', () => {
  const { column } = renderColumn()

  expect(
    screen.getByRole('button', { name: `Add card to ${column.title}` }),
  ).toBeInTheDocument()
})

it('has an Edit button named after each card, outside its drag handle', () => {
  const { column } = renderColumn()

  for (const card of column.cards) {
    const edit = screen.getByRole('button', { name: `Edit ${card.title}` })

    // a button nested in the draggable role="button" would be invalid
    expect(edit.closest('[role="button"]')).toBeNull()
  }
})
