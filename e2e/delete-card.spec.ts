import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { initialColumns } from '../src/board.ts'

// Real Chromium: jsdom has no native <dialog> focus, Tab trap or Esc.
const [todo, , done] = initialColumns
const card = todo.cards[0]
// the only card in its column, so deleting it empties the column
const lastCard = done.cards[0]
const deleteButtonName = 'Delete'
const cancelButtonName = 'Cancel'

const getEditDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Edit card' })

const getConfirmDialog = (page: Page, title: string) =>
  page.getByRole('dialog', { name: `Delete “${title}”?` })

const getArticles = (page: Page, columnTitle: string) =>
  page.getByRole('region', { name: columnTitle }).getByRole('article')

const getAddButton = (page: Page, columnTitle: string) =>
  page.getByRole('button', { name: `Add card to ${columnTitle}` })

// opens Edit, then Delete, and returns the confirm dialog
const openConfirm = async (page: Page, title = card.title) => {
  await page.goto('/')
  await page.getByRole('button', { name: `Edit ${title}` }).click()
  await getEditDialog(page)
    .getByRole('button', { name: deleteButtonName })
    .click()

  return getConfirmDialog(page, title)
}

const confirmDelete = async (page: Page, title = card.title) => {
  await openConfirm(page, title)
  await getConfirmDialog(page, title)
    .getByRole('button', { name: deleteButtonName })
    .click()
}

test('focuses Cancel, not Delete, when the confirm dialog opens', async ({
  page,
}) => {
  const confirm = await openConfirm(page)

  await expect(
    confirm.getByRole('button', { name: cancelButtonName }),
  ).toBeFocused()
})

test('keeps Tab and Shift+Tab inside the confirm dialog', async ({ page }) => {
  const confirm = await openConfirm(page)

  await page.keyboard.press('Tab')
  await expect(
    confirm.getByRole('button', { name: deleteButtonName }),
  ).toBeFocused()

  // past the last button focus may leave the page for the browser's own UI,
  // but while the page has focus it must be in the confirm dialog
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let press = 0; press < 6; press++) {
      await page.keyboard.press(key)

      expect(await confirm.locator(':focus').count()).toBe(
        await page.locator(':focus').count(),
      )
    }
  }
})

test('closes only the confirm dialog on Esc and returns focus to Delete', async ({
  page,
}) => {
  const confirm = await openConfirm(page)

  await page.keyboard.press('Escape')

  await expect(confirm).toBeHidden()
  await expect(getEditDialog(page)).toBeVisible()
  await expect(
    getEditDialog(page).getByRole('button', { name: deleteButtonName }),
  ).toBeFocused()
  await expect(getArticles(page, todo.title)).toHaveCount(todo.cards.length)
})

test('closes the Edit dialog on a second Esc and returns focus to the card', async ({
  page,
}) => {
  await openConfirm(page)

  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(
    page.getByRole('button', { name: `Edit ${card.title}` }),
  ).toBeFocused()
})

test('deletes the card, closes both dialogs and focuses the column + button', async ({
  page,
}) => {
  await confirmDelete(page)

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(getArticles(page, todo.title)).toHaveCount(todo.cards.length - 1)
  await expect(getAddButton(page, todo.title)).toBeFocused()
})

test('keeps focus on the + button when the last card of a column is deleted', async ({
  page,
}) => {
  await confirmDelete(page, lastCard.title)

  await expect(page.getByRole('region', { name: done.title })).toContainText(
    'No cards',
  )
  await expect(getAddButton(page, done.title)).toBeFocused()
})

test('keeps the card gone after a reload', async ({ page }) => {
  await confirmDelete(page)
  await page.reload()

  await expect(getArticles(page, todo.title)).toHaveCount(todo.cards.length - 1)
  await expect(page.getByText(card.title)).toBeHidden()
})
