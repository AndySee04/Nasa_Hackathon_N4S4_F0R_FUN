import { expect, test, type Page } from '@playwright/test'

/** Explore should work on one screen: no scrolling to reach the worlds or to read about the one you chose. */

async function bottomOf(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => el.getBoundingClientRect().bottom)
}

for (const [name, viewport] of [
  ['laptop', { width: 1280, height: 720 }],
  ['phone', { width: 390, height: 844 }],
] as const) {
  test(`on a ${name}, choosing a world shows its card without scrolling`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/explore')
    const worlds = page.getByRole('group', { name: 'Choose a world' })
    await worlds.getByRole('button', { name: 'Mars' }).click()

    const card = page.getByRole('region', { name: 'Mars' })
    await expect(card).toBeVisible()
    await expect(page).toHaveURL(/body=mars/)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await bottomOf(page, 'section[aria-labelledby="world-name"]')).toBeLessThanOrEqual(viewport.height)
    expect(await bottomOf(page, '[aria-label="Choose a world"]')).toBeLessThanOrEqual(viewport.height)
  })
}

test('the card closes with its button or Escape', async ({ page }) => {
  await page.goto('/explore?body=earth')
  await expect(page.getByRole('region', { name: 'Earth' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to the whole solar system' }).click()
  await expect(page.getByRole('region', { name: 'Earth' })).toBeHidden()
  await expect(page).not.toHaveURL(/body=/)

  await page.getByRole('group', { name: 'Choose a world' }).getByRole('button', { name: 'Saturn' }).click()
  await expect(page.getByRole('region', { name: 'Saturn' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('region', { name: 'Saturn' })).toBeHidden()
})
