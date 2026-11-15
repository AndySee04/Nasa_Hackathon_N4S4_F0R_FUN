import { expect, test, type Page } from '@playwright/test'

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

/** Steers the claw with the keyboard until it is over the signal, then drops it. */
async function catchByKeyboard(page: Page) {
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
}

test('a full mission for 3 stars: catch, mission card, repair, real story, quiz', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/moon/campaign')
  await page.getByRole('button', { name: /^Mystery signal/ }).first().click()
  await page.getByRole('link', { name: /Launch rocket claw/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Catch the signal!' })).toBeVisible()
  await catchByKeyboard(page)

  // Stage 3: mission card with NASA-sourced facts.
  await expect(page.getByRole('heading', { level: 1, name: 'Signal identified!' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Eagle Lunar Module descent stage' })).toBeVisible()
  await expect(page.getByText('Laser Ranging Retroreflector')).toBeVisible()
  await page.getByText('Where do these facts come from?').click()
  await expect(page.getByRole('link', { name: /NASA NSSDCA: Apollo 11 Lunar Module/ })).toBeVisible()
  await page.getByRole('button', { name: /Start the repair mission/ }).click()

  // Stage 4: the pretend repair, clearly labelled. A wrong match gets a kind clue, never "wrong".
  await expect(page.getByText(/Pretend mission · training simulator/)).toBeVisible()
  await expect(page.getByText(/The real machines on the Moon were not repaired/)).toBeVisible()
  await page.getByRole('button', { name: 'Landing legs', exact: true }).click()
  await page.getByRole('button', { name: /bounce laser light/ }).click()
  await expect(page.getByRole('status')).toHaveText(/Good try|Nearly|keep going/)
  const parts: [string, RegExp][] = [
    ['Descent stage', /bottom half with the landing legs/],
    ['Ascent stage', /top half with the crew cabin/],
    ['Landing legs', /hold the lander up/],
    ['Laser retroreflector', /bounce laser light/],
  ]
  for (const [part, slot] of parts) {
    await page.getByRole('button', { name: part, exact: true }).click()
    await page.getByRole('button', { name: slot }).click()
  }
  await page.getByRole('button', { name: /Repair star/ }).click()

  // Stage 5: the real story.
  await expect(page.getByRole('heading', { level: 1, name: 'The real story' })).toBeVisible()
  await expect(page.getByText(/Real story · true facts from NASA records/)).toBeVisible()
  await expect(page.getByText(/about 3.8 cm each year/)).toBeVisible()
  await page.getByRole('button', { name: /Quiz time/ }).click()

  // Stage 6: quiz, all three right.
  for (const answer of ['The bottom half (descent stage)', 'Bounces laser light back to Earth', '21.5 kg']) {
    await page.getByRole('button', { name: answer }).click()
    await expect(page.getByText(/Yes, that’s right!/)).toBeVisible()
    await page.getByRole('button', { name: /Next question|See my score/ }).click()
  }
  await expect(page.getByRole('heading', { name: /You got 3 out of 3/ })).toBeVisible()
  await page.getByRole('button', { name: /See my stars/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Signal complete!' })).toBeVisible()
  await expect(page.getByText(/Moon stars:/)).toContainText('3 / 12')
  await page.getByRole('link', { name: /Next signal/ }).click()
  await expect(page.getByText(/Fra Mauro highlands/)).toBeVisible()

  await page.goto('/moon/campaign')
  await expect(page.getByText('3 / 12')).toBeVisible()
  await expect(page.getByRole('button', { name: /Eagle Lunar Module descent stage: 3 of 3 stars/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('sequence repair and a low quiz score: still friendly, quiz star not given', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/moon/campaign/surveyor-3')
  await catchByKeyboard(page)
  await page.getByRole('button', { name: /Start the repair mission/ }).click()
  await page.getByRole('button', { name: 'Dig trenches with the scoop' }).click()
  await expect(page.getByRole('status')).toHaveText(/Good try|Nearly|keep going/)
  for (const step of ['Launch from Earth', 'Bounce twice while landing', 'Dig trenches with the scoop', 'Go silent when the lunar night comes', 'Get a visit from Apollo 12 astronauts']) {
    await page.getByRole('button', { name: step }).click()
  }
  await expect(page.getByRole('status')).toHaveText('Perfect order!')
  await page.getByRole('button', { name: /Repair star/ }).click()
  await page.getByRole('button', { name: /Quiz time/ }).click()
  for (const answer of ['A meteor hit it', 'The soil was runny like water', 'Apollo 12 astronauts Pete Conrad and Alan Bean']) {
    await page.getByRole('button', { name: answer }).click()
    await page.getByRole('button', { name: /Next question|See my score/ }).click()
  }
  await expect(page.getByRole('heading', { name: /You got 1 out of 3/ })).toBeVisible()
  await expect(page.getByText(/Get 2 right to earn the quiz star/)).toBeVisible()
  await page.getByRole('button', { name: /See my stars/ }).click()
  await expect(page.getByText(/Moon stars:/)).toContainText('2 / 12')
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
