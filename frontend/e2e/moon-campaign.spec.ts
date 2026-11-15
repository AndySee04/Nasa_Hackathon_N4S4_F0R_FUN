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

test('a full signal: catch by keyboard, mission card, real story, next signal', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/moon/campaign')
  await page.getByRole('button', { name: /^Mystery signal/ }).first().click()
  await page.getByRole('link', { name: /Launch rocket claw/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Catch the signal!' })).toBeVisible()

  // Turn easy mode off: the visible hint hides, but the slider's text still guides keyboard players.
  await page.getByRole('button', { name: /Easy mode: on/ }).click()
  const claw = page.getByRole('slider', { name: /Rocket claw position/ })
  await claw.focus()
  for (let i = 0; i < 30; i++) {
    const text = (await claw.getAttribute('aria-valuetext')) ?? ''
    if (text.includes('right above it')) break
    await page.keyboard.press(text.includes('left') ? 'ArrowLeft' : 'ArrowRight')
  }
  await expect(claw).toHaveAttribute('aria-valuetext', /right above it/)
  await page.keyboard.press('Space')

  // Stage 3: the mission card shows NASA-sourced facts.
  await expect(page.getByRole('heading', { level: 1, name: 'Signal identified!' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Eagle Lunar Module descent stage' })).toBeVisible()
  await expect(page.getByText('Laser Ranging Retroreflector')).toBeVisible()
  await page.getByText('Where do these facts come from?').click()
  await expect(page.getByRole('link', { name: /NASA NSSDCA: Apollo 11 Lunar Module/ })).toBeVisible()

  // Stage 5: the real story, clearly marked as true.
  await page.getByRole('button', { name: /What did scientists learn/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'The real story' })).toBeVisible()
  await expect(page.getByText(/Real story · true facts from NASA records/)).toBeVisible()
  await expect(page.getByText(/about 3.8 cm each year/)).toBeVisible()

  // Done: stars, then on to the next uncaught signal.
  await page.getByRole('button', { name: /Finish this signal/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Signal complete!' })).toBeVisible()
  await expect(page.getByText(/Moon stars:/)).toContainText('1 / 12')
  await page.getByRole('link', { name: /Next signal/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Catch the signal!' })).toBeVisible()
  await expect(page.getByText(/Fra Mauro highlands/)).toBeVisible()

  await page.goto('/moon/campaign')
  await expect(page.getByText('1 / 12')).toBeVisible()
  await expect(page.getByRole('button', { name: /Eagle Lunar Module descent stage: 1 of 3 stars/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('two misses show a hint, and unknown signals are handled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/moon/campaign/surveyor-3')
  await page.getByRole('button', { name: /Easy mode: on/ }).click()
  const claw = page.getByRole('slider', { name: /Rocket claw position/ })
  await expect(page.getByText('💡')).toHaveCount(0)
  for (let miss = 0; miss < 2; miss++) {
    await claw.focus()
    // Move to whichever edge is away from the signal, then drop on empty ground or a rock.
    const text = (await claw.getAttribute('aria-valuetext')) ?? ''
    await page.keyboard.press(text.includes('left') ? 'End' : 'Home')
    await page.getByRole('button', { name: 'DROP!' }).click()
    await expect(page.getByRole('status')).toHaveText(/Try again/)
    await expect(page.getByRole('button', { name: 'DROP!' })).toBeEnabled()
  }
  await expect(page.getByText(/💡 The signal is/)).toBeVisible()

  await page.goto('/moon/campaign/not-a-real-signal')
  await expect(page.getByRole('heading', { name: 'Signal lost!' })).toBeVisible()
})
