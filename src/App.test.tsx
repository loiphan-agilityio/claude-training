import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'
import { initialColumns } from './board'

it('renders the Kanban Board heading', () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'Kanban Board' }),
  ).toBeInTheDocument()
})

it('renders a region per column with its card count', () => {
  render(<App />)
  expect(initialColumns.map((c) => c.title)).toEqual([
    'To Do',
    'In Progress',
    'Done',
  ])

  for (const { title, cards } of initialColumns) {
    const region = screen.getByRole('region', { name: title })

    expect(within(region).getAllByRole('article')).toHaveLength(cards.length)
    expect(within(region).getByText(String(cards.length))).toBeInTheDocument()
  }
})

it('shows the task counts in the header', () => {
  render(<App />)
  const header = screen.getByRole('banner')
  const total = initialColumns.reduce((sum, c) => sum + c.cards.length, 0)

  expect(within(header).getByText(`${total} tasks`)).toBeInTheDocument()

  for (const { title, cards } of initialColumns) {
    expect(
      within(header).getByText(`${cards.length} ${title}`),
    ).toBeInTheDocument()
  }
})
