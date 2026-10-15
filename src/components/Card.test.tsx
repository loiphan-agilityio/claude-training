import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Card as CardData } from '../board'
import { buildCard } from '../mocks/board'
import Card from './Card'

const renderCard = (overrides?: Partial<CardData>) => {
  const card = buildCard(overrides)

  return { card, ...render(<Card card={card} />) }
}

it('shows the title as a heading', () => {
  const { card } = renderCard()

  expect(
    screen.getByRole('heading', { level: 3, name: card.title }),
  ).toBeInTheDocument()
})

it('shows the description', () => {
  const { card } = renderCard()

  expect(screen.getByText(card.description)).toBeInTheDocument()
})

it('omits the description when missing', () => {
  const { container } = renderCard({ description: undefined })

  expect(container.querySelector('p')).toBeNull()
})

it.each([
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
] as const)('labels %s priority as %s', (priority, label) => {
  renderCard({ priority })
  expect(screen.getByText(label)).toBeInTheDocument()
})

it('shows the assignee with their capitalised initial', () => {
  const { card } = renderCard({ assignee: 'alice' })

  expect(screen.getByText(card.assignee)).toBeInTheDocument()
  expect(screen.getByText('A')).toBeInTheDocument()
})

it('omits the assignee when missing', () => {
  // dueDate is cleared too: its calendar icon is also aria-hidden
  const { container } = renderCard({ assignee: undefined, dueDate: undefined })

  expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
})

it.each([
  ['2026-10-20', 'Oct 20'],
  ['2026-01-01', 'Jan 1'],
  ['2026-12-31', 'Dec 31'],
])('shows due date %s as %s', (dueDate, text) => {
  const { card, container } = renderCard({ dueDate })
  const time = container.querySelector('time')

  expect(time).toHaveAttribute('datetime', card.dueDate)
  expect(time).toHaveTextContent(text)
})

it('omits the due date when missing', () => {
  const { container } = renderCard({ dueDate: undefined })

  expect(container.querySelector('time')).toBeNull()
})
