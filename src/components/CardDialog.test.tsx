import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import App from '../App'
import type { Card } from '../board'
import { buildCard, buildColumn } from '../mocks/board'
import { useBoardStore } from '../store'

const titleLabel = 'Title'
const descriptionLabel = 'Description'
const priorityLabel = 'Priority'
const assigneeLabel = 'Assignee'
const dueDateLabel = 'Due date'
const addButtonName = 'Add card'
const saveButtonName = 'Save'
const cancelButtonName = 'Cancel'
const editDialogName = 'Edit card'
const highPriorityLabel = 'High'
const newTitle = 'Write release notes'
const whitespace = '   '

const getArticles = (region: HTMLElement) =>
  within(region).getAllByRole('article')

const renderAddBoard = async () => {
  const column = buildColumn()
  const user = userEvent.setup()
  const addCardToColumn = `Add card to ${column.title}`

  useBoardStore.setState({ columns: [column, buildColumn()] })
  render(<App />)

  const openDialog = async () => {
    await user.click(screen.getByRole('button', { name: addCardToColumn }))

    return screen.getByRole('dialog', { name: addCardToColumn })
  }

  const dialog = await openDialog()

  return {
    user,
    column,
    dialog,
    openDialog,
    ui: within(dialog),
    region: screen.getByRole('region', { name: column.title }),
  }
}

const renderAddedBoard = async () => {
  const board = await renderAddBoard()
  const { user, ui } = board

  await user.type(ui.getByLabelText(titleLabel), newTitle)
  await user.click(ui.getByRole('button', { name: addButtonName }))

  return board
}

const renderEditBoard = async (overrides?: Partial<Card>) => {
  const card = buildCard(overrides)
  const column = buildColumn({ cards: [buildCard(), card, buildCard()] })
  const user = userEvent.setup()

  useBoardStore.setState({ columns: [column, buildColumn()] })
  render(<App />)

  const openDialog = async () => {
    await user.click(screen.getByRole('button', { name: `Edit ${card.title}` }))

    return screen.getByRole('dialog', { name: editDialogName })
  }

  const dialog = await openDialog()
  const region = screen.getByRole('region', { name: column.title })

  return {
    user,
    column,
    card,
    dialog,
    openDialog,
    ui: within(dialog),
    region,
    getCardArticle: () => getArticles(region)[column.cards.indexOf(card)],
  }
}

const renderSavedBoard = async () => {
  // pinned: the test selects High, which must differ from the saved value
  const board = await renderEditBoard({ priority: 'low' })
  const { user, ui } = board

  await user.clear(ui.getByLabelText(titleLabel))
  await user.type(ui.getByLabelText(titleLabel), newTitle)
  await user.selectOptions(ui.getByLabelText(priorityLabel), highPriorityLabel)
  await user.click(ui.getByRole('button', { name: saveButtonName }))

  return board
}

it('opens a dialog named after the column', async () => {
  const { dialog } = await renderAddBoard()

  expect(dialog).toBeVisible()
})

it('adds the card at the bottom of the column', async () => {
  const { column, region } = await renderAddedBoard()
  const articles = getArticles(region)

  expect(articles).toHaveLength(column.cards.length + 1)
  expect(articles.at(-1)).toHaveTextContent(newTitle)
})

it('updates the column and board counts after adding', async () => {
  const { column, region } = await renderAddedBoard()
  const total = column.cards.length + 1

  expect(within(region).getByText(String(total))).toBeInTheDocument()
  expect(
    within(screen.getByRole('banner')).getByText(`${total} ${column.title}`),
  ).toBeInTheDocument()
})

it('closes the dialog after adding', async () => {
  await renderAddedBoard()

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('shows every field that was filled in on the card', async () => {
  const { user, ui, region } = await renderAddBoard()
  const { description, assignee } = buildCard()
  const dueDate = '2026-10-20'

  await user.type(ui.getByLabelText(titleLabel), newTitle)
  await user.type(ui.getByLabelText(descriptionLabel), description)
  await user.selectOptions(ui.getByLabelText(priorityLabel), highPriorityLabel)
  await user.type(ui.getByLabelText(assigneeLabel), assignee)
  await user.type(ui.getByLabelText(dueDateLabel), dueDate)
  await user.click(ui.getByRole('button', { name: addButtonName }))

  const card = getArticles(region).at(-1)

  expect(card).toHaveTextContent(description)
  expect(card).toHaveTextContent(highPriorityLabel)
  expect(card).toHaveTextContent(assignee)
  expect(card?.querySelector('time')).toHaveAttribute('datetime', dueDate)
})

it('leaves optional fields off the card when they are empty', async () => {
  const { user, ui, region } = await renderAddBoard()

  await user.type(ui.getByLabelText(titleLabel), newTitle)
  await user.type(ui.getByLabelText(assigneeLabel), whitespace)
  await user.click(ui.getByRole('button', { name: addButtonName }))

  // title and the default Medium priority, nothing else
  expect(getArticles(region).at(-1)?.textContent).toBe(`${newTitle}Medium`)
})

it.each([
  ['empty', ''],
  ['whitespace-only', whitespace],
])('adds nothing and stays open for an %s title', async (_, title) => {
  const { user, column, dialog, ui, region } = await renderAddBoard()

  // user.type throws on an empty string
  if (title) {
    await user.type(ui.getByLabelText(titleLabel), title)
  }

  await user.click(ui.getByRole('button', { name: addButtonName }))

  expect(getArticles(region)).toHaveLength(column.cards.length)
  expect(dialog).toBeVisible()
})

it('closes without adding on Cancel', async () => {
  const { user, column, ui, region } = await renderAddBoard()

  await user.type(ui.getByLabelText(titleLabel), newTitle)
  await user.click(ui.getByRole('button', { name: cancelButtonName }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(getArticles(region)).toHaveLength(column.cards.length)
})

it('reopens with an empty form after Cancel', async () => {
  const { user, ui, openDialog } = await renderAddBoard()

  await user.type(ui.getByLabelText(titleLabel), newTitle)
  await user.type(ui.getByLabelText(descriptionLabel), 'draft')
  await user.selectOptions(ui.getByLabelText(priorityLabel), highPriorityLabel)
  await user.click(ui.getByRole('button', { name: cancelButtonName }))

  // the dialog is mounted again, so ui and dialog from before are gone
  const reopened = within(await openDialog())

  expect(reopened.getByLabelText(titleLabel)).toHaveValue('')
  expect(reopened.getByLabelText(descriptionLabel)).toHaveValue('')
  expect(reopened.getByLabelText(priorityLabel)).toHaveValue('medium')
})

it('opens an Edit card dialog with every field filled from the card', async () => {
  const { card, ui } = await renderEditBoard()

  expect(ui.getByLabelText(titleLabel)).toHaveValue(card.title)
  expect(ui.getByLabelText(descriptionLabel)).toHaveValue(card.description)
  expect(ui.getByLabelText(priorityLabel)).toHaveValue(card.priority)
  expect(ui.getByLabelText(assigneeLabel)).toHaveValue(card.assignee)
  expect(ui.getByLabelText(dueDateLabel)).toHaveValue(card.dueDate)
})

it('saves the changes in the same column and position', async () => {
  const { column, card, region, getCardArticle } = await renderSavedBoard()

  expect(getArticles(region)).toHaveLength(column.cards.length)
  expect(getCardArticle()).toHaveTextContent(newTitle)
  expect(getCardArticle()).toHaveTextContent(highPriorityLabel)
  expect(getCardArticle()).toHaveTextContent(card.description)
})

it('keeps the board count the same after saving', async () => {
  const { column } = await renderSavedBoard()

  expect(
    within(screen.getByRole('banner')).getByText(
      `${column.cards.length} ${column.title}`,
    ),
  ).toBeInTheDocument()
})

it('closes the dialog after saving', async () => {
  await renderSavedBoard()

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('removes an optional field from the card when it is cleared', async () => {
  const { user, card, ui, getCardArticle } = await renderEditBoard({
    priority: 'high',
  })

  await user.clear(ui.getByLabelText(descriptionLabel))
  await user.clear(ui.getByLabelText(assigneeLabel))
  await user.clear(ui.getByLabelText(dueDateLabel))
  await user.click(ui.getByRole('button', { name: saveButtonName }))

  expect(getCardArticle().textContent).toBe(`${card.title}${highPriorityLabel}`)
})

it.each([
  ['empty', ''],
  ['whitespace-only', whitespace],
])('saves nothing and stays open for an %s title', async (_, title) => {
  const { user, card, dialog, ui, getCardArticle } = await renderEditBoard()

  await user.clear(ui.getByLabelText(titleLabel))

  // user.type throws on an empty string
  if (title) {
    await user.type(ui.getByLabelText(titleLabel), title)
  }

  await user.click(ui.getByRole('button', { name: saveButtonName }))

  expect(dialog).toBeVisible()
  expect(getCardArticle()).toHaveTextContent(card.title)
})

it('discards the changes on Cancel', async () => {
  const { user, card, ui, getCardArticle } = await renderEditBoard({
    priority: 'low',
  })

  await user.type(ui.getByLabelText(titleLabel), ' edited')
  await user.selectOptions(ui.getByLabelText(priorityLabel), highPriorityLabel)
  await user.click(ui.getByRole('button', { name: cancelButtonName }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  // exact heading name: toHaveTextContent would also match "<title> edited"
  expect(
    within(getCardArticle()).getByRole('heading', {
      level: 3,
      name: card.title,
    }),
  ).toBeInTheDocument()
  expect(getCardArticle()).not.toHaveTextContent(highPriorityLabel)
})

it('reopens with the saved values after Cancel', async () => {
  const { user, card, ui, openDialog } = await renderEditBoard({
    priority: 'low',
  })

  await user.type(ui.getByLabelText(titleLabel), ' edited')
  await user.selectOptions(ui.getByLabelText(priorityLabel), highPriorityLabel)
  await user.click(ui.getByRole('button', { name: cancelButtonName }))

  const reopened = within(await openDialog())

  expect(reopened.getByLabelText(titleLabel)).toHaveValue(card.title)
  expect(reopened.getByLabelText(priorityLabel)).toHaveValue(card.priority)
})
