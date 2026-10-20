import { expect, test } from '@playwright/test'

// Real Chromium: the saved theme must be applied before the app script runs, or a light user sees a dark flash.
test('applies a saved light theme before the app script loads', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('kanban-theme', 'light'))
  await page.route('**/src/main.tsx', (route) => route.abort())
  await page.goto('/')

  await expect(page.locator('html')).not.toHaveClass(/dark/)
})

test('keeps the theme chosen with the toggle after a reload', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await page.reload()

  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(
    page.getByRole('button', { name: 'Switch to dark mode' }),
  ).toBeVisible()
})
