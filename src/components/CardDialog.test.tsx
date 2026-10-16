import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import App from '../App'
import type { Card, Column } from '../board'
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
const deleteButtonName = 'Delete'
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

const renderEditBoard = async (
  overrides?: Partial<Card>,
  siblings?: Card[],
) => {
  const card = buildCard(overrides)
  const others = siblings ?? [buildCard(), buildCard()]
  const column = buildColumn({
    cards: [...others.slice(0, 1), card, ...others.slice(1)],
  })
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

// opens Delete on the edited card and returns its confirm dialog
const renderConfirmBoard = async (
  ...args: Parameters<typeof renderEditBoard>
) => {
  const board = await renderEditBoard(...args)
  const { user, card, ui } = board

  await user.click(ui.getByRole('button', { name: deleteButtonName }))

  const confirm = screen.getByRole<HTMLDialogElement>('dialog', {
    name: `Delete “${card.title}”?`,
  })

  return { ...board, confirm, confirmUi: within(confirm) }
}

const renderDeletedBoard = async (
  ...args: Parameters<typeof renderConfirmBoard>
) => {
  const board = await renderConfirmBoard(...args)

  await board.user.click(
    board.confirmUi.getByRole('button', { name: deleteButtonName }),
  )

  return board
}

const getAddButton = (column: Column) =>
  screen.getByRole('button', { name: `Add card to ${column.title}` })

it('has a Delete button in the Edit dialog', async () => {
  const { ui } = await renderEditBoard()

  expect(ui.getByRole('button', { name: deleteButtonName })).toBeInTheDocument()
})

it('has no Delete button in the Add dialog', async () => {
  const { ui } = await renderAddBoard()

  expect(
    ui.queryByRole('button', { name: deleteButtonName }),
  ).not.toBeInTheDocument()
})

it('asks for confirmation in a dialog named after the card', async () => {
  const { confirm } = await renderConfirmBoard()

  expect(confirm).toBeVisible()
})

it('says in the confirm dialog that deleting cannot be undone', async () => {
  const { confirm } = await renderConfirmBoard()

  expect(confirm).toHaveAccessibleDescription('This cannot be undone.')
})

it('keeps the card while the confirm dialog is open', async () => {
  const { column, region } = await renderConfirmBoard()

  expect(getArticles(region)).toHaveLength(column.cards.length)
})

// the browser focuses the first focusable element of a modal dialog
it('puts Cancel before Delete in the confirm dialog', async () => {
  const { confirmUi } = await renderConfirmBoard()
  const names = confirmUi.getAllByRole('button').map((b) => b.textContent)

  expect(names).toEqual([cancelButtonName, deleteButtonName])
})

it('removes only that card from the column on confirm', async () => {
  const { column, card, region } = await renderDeletedBoard()
  const titles = column.cards.filter((c) => c !== card).map((c) => c.title)

  expect(
    getArticles(region).map(
      (a) => within(a).getByRole('heading', { level: 3 }).textContent,
    ),
  ).toEqual(titles)
})

it('closes both dialogs on confirm', async () => {
  await renderDeletedBoard()

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('updates the column and board counts after deleting', async () => {
  const { column, region } = await renderDeletedBoard()
  const total = column.cards.length - 1

  expect(within(region).getByText(String(total))).toBeInTheDocument()
  expect(
    within(screen.getByRole('banner')).getByText(`${total} ${column.title}`),
  ).toBeInTheDocument()
})

it('moves focus to the column + button after deleting', async () => {
  const { column } = await renderDeletedBoard()

  expect(getAddButton(column)).toHaveFocus()
})

it('empties the column and still moves focus to + when the last card is deleted', async () => {
  const { column, region } = await renderDeletedBoard({}, [])

  expect(within(region).queryByRole('article')).not.toBeInTheDocument()
  expect(within(region).getByText('No cards')).toBeInTheDocument()
  expect(getAddButton(column)).toHaveFocus()
})

it('keeps the card and returns to the Edit dialog on Cancel', async () => {
  const { user, column, dialog, confirm, confirmUi, region } =
    await renderConfirmBoard()

  await user.click(confirmUi.getByRole('button', { name: cancelButtonName }))

  expect(confirm).not.toBeInTheDocument()
  expect(dialog).toBeVisible()
  expect(getArticles(region)).toHaveLength(column.cards.length)
})

// jsdom has no Esc key: the browser ends Esc by closing the dialog, as done here
it('keeps the card and returns to the Edit dialog when the confirm dialog is closed with Esc', async () => {
  const { column, dialog, confirm, region } = await renderConfirmBoard()

  confirm.close()

  await waitFor(() => expect(confirm).not.toBeInTheDocument())
  expect(dialog).toBeVisible()
  expect(getArticles(region)).toHaveLength(column.cards.length)
})

it('keeps the unsaved edits when Cancel returns to the Edit dialog', async () => {
  const { user, card, dialog, ui } = await renderEditBoard()

  await user.type(ui.getByLabelText(titleLabel), ' edited')
  await user.click(ui.getByRole('button', { name: deleteButtonName }))
  await user.click(
    within(
      screen.getByRole('dialog', { name: `Delete “${card.title}”?` }),
    ).getByRole('button', { name: cancelButtonName }),
  )

  expect(within(dialog).getByLabelText(titleLabel)).toHaveValue(
    `${card.title} edited`,
  )
})

it('does not move focus to the + button after Cancel or Save', async () => {
  const { column } = await renderSavedBoard()

  expect(getAddButton(column)).not.toHaveFocus()
})
