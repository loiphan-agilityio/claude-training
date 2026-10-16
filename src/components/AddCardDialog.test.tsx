import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import App from './../App'
import { buildCard, buildColumn } from '../mocks/board'
import { useBoardStore } from '../store'

const newTitle = 'Write release notes'

const renderBoard = async () => {
  const columns = [buildColumn(), buildColumn()]
  const [column] = columns
  const user = userEvent.setup()

  useBoardStore.setState({ columns })
  render(<App />)
  await user.click(
    screen.getByRole('button', { name: `Add card to ${column.title}` }),
  )

  const dialog = screen.getByRole('dialog', {
    name: `Add card to ${column.title}`,
  })

  return {
    user,
    column,
    dialog,
    region: screen.getByRole('region', { name: column.title }),
    ui: within(dialog),
  }
}

it('opens a dialog named after the column', async () => {
  const { dialog } = await renderBoard()

  expect(dialog).toBeVisible()
})

it('adds the card at the bottom of the column and updates the counts', async () => {
  const { user, column, ui, region } = await renderBoard()
  const count = column.cards.length

  await user.type(ui.getByLabelText('Title'), newTitle)
  await user.click(ui.getByRole('button', { name: 'Add card' }))

  const articles = within(region).getAllByRole('article')

  expect(articles).toHaveLength(count + 1)
  expect(articles.at(-1)).toHaveTextContent(newTitle)
  expect(within(region).getByText(String(count + 1))).toBeInTheDocument()
  expect(
    within(screen.getByRole('banner')).getByText(
      `${count + 1} ${column.title}`,
    ),
  ).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('shows every field that was filled in on the card', async () => {
  const { user, ui, region } = await renderBoard()
  const { description, assignee } = buildCard()

  await user.type(ui.getByLabelText('Title'), newTitle)
  await user.type(ui.getByLabelText('Description'), description)
  await user.selectOptions(ui.getByLabelText('Priority'), 'High')
  await user.type(ui.getByLabelText('Assignee'), assignee)
  await user.type(ui.getByLabelText('Due date'), '2026-10-20')
  await user.click(ui.getByRole('button', { name: 'Add card' }))

  const card = within(region).getAllByRole('article').at(-1)

  expect(card).toHaveTextContent(description)
  expect(card).toHaveTextContent('High')
  expect(card).toHaveTextContent(assignee)
  expect(card?.querySelector('time')).toHaveAttribute('datetime', '2026-10-20')
})

it('leaves optional fields off the card when they are empty', async () => {
  const { user, ui, region } = await renderBoard()

  await user.type(ui.getByLabelText('Title'), newTitle)
  await user.type(ui.getByLabelText('Assignee'), '   ')
  await user.click(ui.getByRole('button', { name: 'Add card' }))

  const card = within(region).getAllByRole('article').at(-1)

  // title and the default Medium priority, nothing else
  expect(card?.textContent).toBe(`${newTitle}Medium`)
})

it.each([
  ['empty', ''],
  ['whitespace-only', '   '],
])('adds nothing and stays open for an %s title', async (_, title) => {
  const { user, column, dialog, ui, region } = await renderBoard()

  if (title) {
    await user.type(ui.getByLabelText('Title'), title)
  }

  await user.click(ui.getByRole('button', { name: 'Add card' }))

  expect(within(region).getAllByRole('article')).toHaveLength(
    column.cards.length,
  )
  expect(dialog).toBeVisible()
})

it('closes without adding on Cancel and reopens with an empty form', async () => {
  const { user, column, ui, region } = await renderBoard()

  await user.type(ui.getByLabelText('Title'), newTitle)
  await user.type(ui.getByLabelText('Description'), 'draft')
  await user.selectOptions(ui.getByLabelText('Priority'), 'High')
  await user.click(ui.getByRole('button', { name: 'Cancel' }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(within(region).getAllByRole('article')).toHaveLength(
    column.cards.length,
  )

  await user.click(
    screen.getByRole('button', { name: `Add card to ${column.title}` }),
  )

  expect(ui.getByLabelText('Title')).toHaveValue('')
  expect(ui.getByLabelText('Description')).toHaveValue('')
  expect(ui.getByLabelText('Priority')).toHaveValue('medium')
})
