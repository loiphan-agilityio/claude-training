import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { initialColumns } from './board'
import { buildCard, buildColumn } from './mocks/board'
import { useBoardStore } from './store'

const filterName = 'Filter by priority'
const allLabel = 'All priorities'
const noMatchText = 'No matching cards'

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

// the first column holds High, Low, High; the second only a Low card
const renderFilterBoard = () => {
  const user = userEvent.setup()
  const [high, low, otherHigh] = [
    buildCard({ priority: 'high' }),
    buildCard({ priority: 'low' }),
    buildCard({ priority: 'high' }),
  ]
  const first = buildColumn({ cards: [high, low, otherHigh] })
  const second = buildColumn({ cards: [buildCard({ priority: 'low' })] })

  useBoardStore.setState({ columns: [first, second] })
  render(<App />)

  const select = screen.getByRole('combobox', { name: filterName })

  return {
    user,
    select,
    high,
    low,
    otherHigh,
    first,
    second,
    firstRegion: screen.getByRole('region', { name: first.title }),
    secondRegion: screen.getByRole('region', { name: second.title }),
    selectPriority: (label: string) => user.selectOptions(select, label),
  }
}

const getTitles = (region: HTMLElement) =>
  within(region)
    .queryAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)

it('has a priority select with All priorities chosen on load', () => {
  const { select } = renderFilterBoard()

  expect(
    within(select)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual([allLabel, 'High', 'Medium', 'Low'])
  expect(select).toHaveValue('all')
})

it('shows only the cards of the chosen priority in every column', async () => {
  const { selectPriority, high, otherHigh, firstRegion, secondRegion } =
    renderFilterBoard()

  await selectPriority('High')

  expect(getTitles(firstRegion)).toEqual([high.title, otherHigh.title])
  expect(within(secondRegion).queryByRole('article')).not.toBeInTheDocument()
})

it('shows every card again on All priorities', async () => {
  const { selectPriority, first, second, firstRegion, secondRegion } =
    renderFilterBoard()

  await selectPriority('High')
  await selectPriority(allLabel)

  expect(getTitles(firstRegion)).toEqual(first.cards.map((c) => c.title))
  expect(getTitles(secondRegion)).toEqual(second.cards.map((c) => c.title))
})

it('counts the cards shown in the badges but keeps the board totals in the header', async () => {
  const { selectPriority, first, second, firstRegion, secondRegion } =
    renderFilterBoard()
  const header = within(screen.getByRole('banner'))

  await selectPriority('High')

  expect(within(firstRegion).getByText('2')).toBeInTheDocument()
  expect(within(secondRegion).getByText('0')).toBeInTheDocument()
  expect(
    header.getByText(`${first.cards.length + second.cards.length} tasks`),
  ).toBeInTheDocument()
  expect(
    header.getByText(`${first.cards.length} ${first.title}`),
  ).toBeInTheDocument()
  expect(
    header.getByText(`${second.cards.length} ${second.title}`),
  ).toBeInTheDocument()
})

it('says no matching cards in a column without the chosen priority', async () => {
  const { selectPriority, firstRegion, secondRegion } = renderFilterBoard()

  await selectPriority('High')

  expect(within(secondRegion).getByText(noMatchText)).toBeInTheDocument()
  expect(within(firstRegion).queryByText(noMatchText)).not.toBeInTheDocument()
})

it('saves a card added with a priority outside the filter and hides it', async () => {
  const { user, selectPriority, first, firstRegion } = renderFilterBoard()
  const newTitle = 'Write release notes'

  await selectPriority('High')
  await user.click(
    screen.getByRole('button', { name: `Add card to ${first.title}` }),
  )
  // the Add dialog defaults to Medium, which the High filter hides
  await user.type(screen.getByLabelText('Title'), newTitle)
  await user.click(screen.getByRole('button', { name: 'Add card' }))

  expect(getTitles(firstRegion)).not.toContain(newTitle)

  await selectPriority(allLabel)

  expect(getTitles(firstRegion).at(-1)).toBe(newTitle)
})

it('hides a card edited to a priority outside the filter and moves focus to the column + button', async () => {
  const { user, selectPriority, high, first, firstRegion } = renderFilterBoard()

  await selectPriority('High')
  await user.click(screen.getByRole('button', { name: `Edit ${high.title}` }))
  await user.selectOptions(
    within(screen.getByRole('dialog', { name: 'Edit card' })).getByLabelText(
      'Priority',
    ),
    'Low',
  )
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(getTitles(firstRegion)).not.toContain(high.title)
  expect(
    screen.getByRole('button', { name: `Add card to ${first.title}` }),
  ).toHaveFocus()

  await selectPriority(allLabel)

  expect(getTitles(firstRegion)).toContain(high.title)
})

it('does not move focus to the column + button when the edited card stays visible', async () => {
  const { user, selectPriority, high, first } = renderFilterBoard()

  await selectPriority('High')
  await user.click(screen.getByRole('button', { name: `Edit ${high.title}` }))
  await user.type(screen.getByLabelText('Title'), ' edited')
  await user.click(screen.getByRole('button', { name: 'Save' }))

  expect(
    screen.getByRole('button', { name: `Add card to ${first.title}` }),
  ).not.toHaveFocus()
})

const themeKey = 'kanban-theme'
const toDarkName = 'Switch to dark mode'
const toLightName = 'Switch to light mode'

it('starts dark when no theme was saved', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: toLightName })).toBeInTheDocument()
  expect(document.documentElement).toHaveClass('dark')
})

it('saves the theme when it is toggled', async () => {
  const user = userEvent.setup()

  render(<App />)
  await user.click(screen.getByRole('button', { name: toLightName }))
  expect(localStorage.getItem(themeKey)).toBe('light')
  expect(document.documentElement).not.toHaveClass('dark')

  await user.click(screen.getByRole('button', { name: toDarkName }))
  expect(localStorage.getItem(themeKey)).toBe('dark')
  expect(document.documentElement).toHaveClass('dark')
})

it('restores a saved light theme on load', () => {
  localStorage.setItem(themeKey, 'light')
  render(<App />)
  expect(screen.getByRole('button', { name: toDarkName })).toBeInTheDocument()
  expect(document.documentElement).not.toHaveClass('dark')
})

// storage can be blocked (private mode, cookies off): the app must still work
const blockStorage = (method: 'getItem' | 'setItem') =>
  vi.spyOn(Storage.prototype, method).mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })

afterEach(() => vi.restoreAllMocks())

it('starts dark when storage cannot be read', () => {
  blockStorage('getItem')
  render(<App />)
  expect(screen.getByRole('button', { name: toLightName })).toBeInTheDocument()
})

it('still toggles the theme when storage cannot be written', async () => {
  const user = userEvent.setup()

  blockStorage('setItem')
  render(<App />)
  await user.click(screen.getByRole('button', { name: toLightName }))
  expect(screen.getByRole('button', { name: toDarkName })).toBeInTheDocument()
  expect(document.documentElement).not.toHaveClass('dark')
})
