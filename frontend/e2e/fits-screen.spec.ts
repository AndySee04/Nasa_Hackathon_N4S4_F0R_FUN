import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * The Moon and Mars pages and games should not need scrolling to reach the thing you play or tap next.
 * Checked on a small laptop screen; phones are covered by the archive test at the end.
 */
const LAPTOP = { width: 1280, height: 720 }

async function bottomOf(target: Locator) {
  const box = await target.boundingBox()
  return box ? box.y + box.height : Infinity
}

async function onScreen(page: Page, target: Locator) {
  await expect(target).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(await bottomOf(target)).toBeLessThanOrEqual(LAPTOP.height)
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(LAPTOP)
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('the Moon map and its signals are on screen', async ({ page }) => {
  await page.goto('/moon/campaign')
  await onScreen(page, page.getByRole('button', { name: 'Tap the Moon for Moon facts' }))
})

test('the Mars map and its dig sites are on screen', async ({ page }) => {
  await page.goto('/mars/campaign')
  await onScreen(page, page.getByRole('button', { name: 'Tap Mars for Mars facts' }))
})

test('the rocket claw game and its DROP button are on screen', async ({ page }) => {
  await page.goto('/moon/campaign/apollo-11-eagle')
  await onScreen(page, page.getByRole('slider', { name: /Rocket claw position/ }))
  await onScreen(page, page.getByRole('button', { name: 'DROP!' }))
})

test('the whole Mars dig site is on screen', async ({ page }) => {
  await page.goto('/mars/campaign/viking-1-lander')
  await onScreen(page, page.locator('[data-cell]').last())
})

test('on a phone, the first machine in an archive shows without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/moon')
  const first = page.getByRole('article').first()
  await expect(first).toBeVisible()
  expect(await bottomOf(first)).toBeLessThanOrEqual(844)
})
