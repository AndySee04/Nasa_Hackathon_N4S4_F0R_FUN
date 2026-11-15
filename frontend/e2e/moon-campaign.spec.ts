import { expect, test } from '@playwright/test'

const isRealError = (text: string) => !/Failed to load resource|ERR_|net::|Failed to fetch|CORS/i.test(text)

test('Moon campaign hub: briefing, Moon facts and signals', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && isRealError(m.text()) && errors.push(m.text()))

  await page.goto('/moon')
  await page.getByRole('link', { name: /Play the Moon Explorer Mission/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Moon Explorer Mission' })).toBeVisible()
  await expect(page.getByText('Mission briefing')).toBeVisible()
  await expect(page.getByText('0 / 12')).toBeVisible()

  await page.getByRole('button', { name: 'Tap the Moon for Moon facts' }).click()
  await expect(page.getByRole('region', { name: 'Moon facts' })).toBeVisible()
  await expect(page.getByText('384,400 km')).toBeVisible()
  await page.getByRole('button', { name: 'Close ✕' }).click()
  await expect(page.getByRole('region', { name: 'Moon facts' })).toBeHidden()

  const signals = page.getByRole('button', { name: /^Mystery signal/ })
  await expect(signals).toHaveCount(5)
  await signals.first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Something is down there…' })).toBeVisible()
  await expect(page.getByText(/Signal from: Tranquility Base/)).toBeVisible()
  expect(errors).toEqual([])
})

test('saved stars show on the hub and survive a reload', async ({ page }) => {
  await page.goto('/moon/campaign')
  await page.evaluate(() =>
    localStorage.setItem(
      'n4s4.progress.v1',
      JSON.stringify({
        version: 1,
        settings: {},
        campaigns: { moon: { artifacts: { 'apollo-11-eagle': { best: { caught: true, repaired: true, quizCorrect: 3 }, plays: 1 } }, badges: [] } },
      }),
    ),
  )
  await page.reload()
  await expect(page.getByText('3 / 12')).toBeVisible()
  await page.getByRole('button', { name: /Eagle Lunar Module descent stage: 3 of 3 stars/ }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Eagle Lunar Module descent stage' })).toBeVisible()

  await page.getByRole('button', { name: 'Start over' }).click()
  await page.getByRole('button', { name: 'Yes, start over' }).click()
  await expect(page.getByText('0 / 12')).toBeVisible()
})
