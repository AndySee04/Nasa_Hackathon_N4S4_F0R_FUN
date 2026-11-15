import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', heading: 'N4S4 F0R FUN' },
  { path: '/explore', heading: 'Explore the Universe' },
  { path: '/moon', heading: 'Moon Archive' },
  { path: '/moon/campaign', heading: 'Moon Explorer Mission' },
  { path: '/mars', heading: 'Mars Archive' },
  { path: '/deep-space', heading: 'Deep Space Archive' },
  { path: '/artifact/opportunity', heading: 'Opportunity rover' },
  { path: '/timeline', heading: 'Mission Timeline' },
  { path: '/science-lab', heading: 'Science Lab' },
  { path: '/ask-astro', heading: 'Ask Astro AI' },
  { path: '/about', heading: 'About N4S4 F0R FUN' },
  // Which heading depends on whether Supabase is configured in the local .env.
  { path: '/account', heading: /Accounts are switched off|Sign in|Welcome aboard/ },
]

// Network failures are expected in tests (no backend, no internet for NASA images).
// Anything else logged as an error means the page is broken.
const isRealError = (text: string) => !/Failed to load resource|ERR_|net::|Failed to fetch|CORS/i.test(text)

for (const { path, heading } of PAGES) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && isRealError(m.text()) && errors.push(m.text()))

    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })
}

test('navigating between pages keeps working', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/mars')
  await page.getByRole('button', { name: /Open its story/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('link', { name: 'Read the full story' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'Mars Archive' })).toBeVisible()
  expect(errors).toEqual([])
})

test('unknown pages show the friendly 404', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: 'Lost in space!' })).toBeVisible()
})
