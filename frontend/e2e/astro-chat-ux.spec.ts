import { expect, test, type Page } from '@playwright/test'

/**
 * Astro's chat, with the backend faked so these run without a server (as in CI).
 * Checks the things that made the chat tiresome to use: scrolling, space, and "offline" while waking up.
 */

const LONG =
  'The Moon is about 3,475 km across.\n\n' +
  Array.from({ length: 8 }, (_, i) => `Fact line ${i + 1}: the Moon keeps the same face towards Earth as it orbits.`).join('\n\n')

async function fakeBackend(page: Page, { healthy = true } = {}) {
  await page.route('**/api/health', (r) =>
    healthy
      ? r.fulfill({ json: { status: 'ok', ai_mode: 'knowledge', artifacts_loaded: 21 } })
      : r.abort('connectionrefused'),
  )
  await page.route('**/api/ai/suggested-questions**', (r) => r.fulfill({ json: { questions: ['How big is the Moon?'] } }))
  let n = 0
  await page.route('**/api/ai/chat', (r) => {
    n += 1
    return r.fulfill({
      json: {
        reply: `Answer ${n} starts here. ${LONG}`,
        sources: [
          { title: 'NASA Science: Moon Facts', url: 'https://science.nasa.gov/moon/facts/' },
          { title: 'NASA NSSDCA: Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' },
        ],
        suggestions: ['Why do we always see the same side of the Moon?', 'What are the dark patches on the Moon?', 'Why does the Moon have so many craters?'],
        mode: 'knowledge',
        topic: 'solar_system',
        confidence: 'sourced',
        images: [],
      },
    })
  })
}

test('each new answer is shown from its first line, not its end', async ({ page }) => {
  await fakeBackend(page)
  // Reduced motion makes the scroll instant, so slow CI machines don't measure mid-animation.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/moon')
  await page.getByRole('button', { name: 'Ask Astro' }).first().click()
  const input = page.locator('#astro-input-compact')
  const list = page.getByLabel('Conversation with Astro')

  for (let i = 1; i <= 3; i++) {
    await input.fill(`Question ${i}`)
    await input.press('Enter')
    await expect(list.getByText(`Answer ${i} starts here.`)).toBeVisible()
  }
  // How far the answer's first line sits below the top of the chat: a few pixels, not off the top or far down.
  const offset = async () => {
    const start = await list.getByText('Answer 3 starts here.').boundingBox()
    const box = await list.boundingBox()
    return start && box ? start.y - box.y : -1
  }
  await expect.poll(offset).toBeGreaterThanOrEqual(-1)
  await expect.poll(offset).toBeLessThan(80)
  // The cursor stays in the box for the next question.
  await expect(input).toBeFocused()
})

test('sources start folded away and open with one tap', async ({ page }) => {
  await fakeBackend(page)
  await page.goto('/ask-astro')
  await page.locator('#astro-input').fill('How big is the Moon?')
  await page.locator('#astro-input').press('Enter')

  const link = page.getByRole('link', { name: 'NASA Science: Moon Facts' })
  await expect(link).toBeHidden()
  await page.getByText('Where this comes from (2)').click()
  await expect(link).toBeVisible()
})

test('suggestions sit on one row instead of wrapping', async ({ page }) => {
  await fakeBackend(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ask-astro')
  await page.locator('#astro-input').fill('How big is the Moon?')
  await page.locator('#astro-input').press('Enter')
  const chips = page.getByRole('group', { name: 'Questions you could ask next' }).getByRole('button')
  await expect(chips).toHaveCount(3)
  // The chat paper is tilted slightly, so chips on one row differ by a pixel or two. A wrapped chip would
  // sit a whole chip height (40px+) lower.
  const tops = await chips.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top))
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(20)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('a sleeping server shows "waking up", not "offline"', async ({ page }) => {
  await fakeBackend(page, { healthy: false })
  await page.goto('/ask-astro')
  await expect(page.getByRole('status').filter({ hasText: 'Waking up' }).first()).toBeVisible()
})
