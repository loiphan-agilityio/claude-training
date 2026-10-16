import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { initialColumns } from '../src/board.ts'
import type { Card } from '../src/board.ts'

// Real Chromium: jsdom has no native <dialog> focus and no dnd-kit sensors.
const [todo, ...otherColumns] = initialColumns
// the only High card in To Do
const highCard = todo.cards[0]
const filterName = 'Filter by priority'

const getFilter = (page: Page) =>
  page.getByRole('combobox', { name: filterName })

const getArticles = (page: Page, columnTitle: string) =>
  page.getByRole('region', { name: columnTitle }).getByRole('article')

const getTitles = (page: Page, columnTitle: string) =>
  getArticles(page, columnTitle).getByRole('heading', { level: 3 })

const getAddButton = (page: Page, columnTitle: string) =>
  page.getByRole('button', { name: `Add card to ${columnTitle}` })

// edits the card's priority through the Edit dialog
const editPriority = async (page: Page, title: string, priority: string) => {
  await page.getByRole('button', { name: `Edit ${title}` }).click()
  await page
    .getByRole('dialog', { name: 'Edit card' })
    .getByLabel('Priority')
    .selectOption(priority)
  await page.getByRole('button', { name: 'Save' }).click()
}

test('moves focus to the column + button when a card is edited out of the filter', async ({
  page,
}) => {
  await page.goto('/')
  await getFilter(page).selectOption('high')
  await editPriority(page, highCard.title, 'low')

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(getArticles(page, todo.title)).toHaveCount(0)
  await expect(getAddButton(page, todo.title)).toBeFocused()
})

test('reaches the select with Tab and changes it with the arrow keys', async ({
  page,
}) => {
  await page.goto('/')

  // the theme toggle comes first; the select is within a couple of Tabs
  for (let press = 0; press < 5; press++) {
    if (await getFilter(page).evaluate((el) => el.matches(':focus'))) {
      break
    }

    await page.keyboard.press('Tab')
  }

  await expect(getFilter(page)).toBeFocused()

  await page.keyboard.press('ArrowDown')

  await expect(getFilter(page)).toHaveValue('high')
  await expect(getArticles(page, todo.title)).toHaveCount(1)
})

test('resets the filter on reload and keeps the board', async ({ page }) => {
  await page.goto('/')
  await getFilter(page).selectOption('high')
  await editPriority(page, highCard.title, 'low')
  await page.reload()

  await expect(getFilter(page)).toHaveValue('all')
  await expect(getArticles(page, todo.title)).toHaveCount(todo.cards.length)
  await expect(getTitles(page, todo.title).first()).toHaveText(highCard.title)
})

test('drops a card on a visible card and keeps the hidden cards in order', async ({
  page,
}) => {
  const [first, hidden, second] = [
    { id: 'a', title: 'Alpha', priority: 'high' },
    { id: 'b', title: 'Bravo', priority: 'low' },
    { id: 'c', title: 'Charlie', priority: 'high' },
  ] satisfies Card[]
  const columns = [{ ...todo, cards: [first, hidden, second] }, ...otherColumns]

  await page.addInitScript(
    (state) => localStorage.setItem('kanban-board', state),
    JSON.stringify({ state: { columns }, version: 0 }),
  )
  await page.goto('/')
  await getFilter(page).selectOption('high')

  await expect(getTitles(page, todo.title)).toHaveText([
    first.title,
    second.title,
  ])

  // the drag handle is the card; its name would also match the Edit button's.
  // dnd-kit needs a moment between keyboard drag steps
  await page
    .locator('[aria-roledescription="sortable"]')
    .filter({ hasText: first.title })
    .focus()
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(300)
  await page.keyboard.press('Space')

  await expect(getTitles(page, todo.title)).toHaveText([
    second.title,
    first.title,
  ])

  await getFilter(page).selectOption('all')

  await expect(getTitles(page, todo.title)).toHaveText([
    hidden.title,
    second.title,
    first.title,
  ])
})
