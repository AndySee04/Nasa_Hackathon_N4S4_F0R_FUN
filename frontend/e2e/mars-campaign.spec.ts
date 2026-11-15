import { expect, test, type Page } from '@playwright/test'
import { MARS_CAMPAIGN } from '../src/data/campaigns/mars'
import { canDig, COLS, dig, digLayout, ROWS, startDig, type Cell, type DigState } from '../src/game/dig'
import { shortestSolution } from '../src/game/drive'

const isRealError = (text: string) => !/Failed to load resource|ERR_|net::|Failed to fetch|CORS/i.test(text)

test('Mars campaign hub: briefing, Mars facts and buried signals', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && isRealError(m.text()) && errors.push(m.text()))

  await page.goto('/mars')
  await page.getByRole('link', { name: /Play the Mars Explorer Mission/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mars Explorer Mission' })).toBeVisible()
  await expect(page.getByText('0 / 15')).toBeVisible()

  // Tap open ground near the bottom of the planet, away from the pins.
  const mars = page.getByRole('button', { name: 'Tap Mars for Mars facts' })
  const box = (await mars.boundingBox())!
  await mars.click({ position: { x: box.width * 0.5, y: box.height * 0.88 } })
  await expect(page.getByRole('region', { name: 'Mars facts' })).toBeVisible()
  await expect(page.getByText(/687 Earth days/)).toBeVisible()

  await expect(page.getByRole('button', { name: /^Buried signal/ })).toHaveCount(7)
  await page
    .getByRole('button', { name: /^Buried signal/ })
    .first()
    .click()
  await expect(page.getByRole('heading', { name: 'Something is buried here…' })).toBeVisible()
  expect(errors).toEqual([])
})

/** Same greedy digger as the unit tests: always hit the reachable tile nearest the next machine tile. */
function plan(artifactId: string): Cell[] {
  const layout = digLayout(artifactId, 0)
  let s: DigState = startDig(layout, true)
  const hits: Cell[] = []
  for (const target of layout.machine) {
    for (let guard = 0; guard < 300 && s.hitsLeft[target.row][target.col] > 0; guard++) {
      const options: Cell[] = []
      for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) if (canDig(layout, s, { col, row })) options.push({ col, row })
      const cost = (c: Cell) => s.hitsLeft[c.row][c.col] + 3 * (Math.abs(c.col - target.col) + Math.abs(c.row - target.row))
      options.sort((a, b) => cost(a) - cost(b))
      s = dig(layout, s, options[0]).state
      hits.push(options[0])
    }
  }
  return hits
}

async function playLevel(page: Page, index: number) {
  const level = MARS_CAMPAIGN.artifacts[index]
  await page.goto(`/mars/campaign/${level.artifactId}`)
  await expect(page.getByRole('button', { name: /Easy mode: on/ })).toBeVisible()
  for (const c of plan(level.artifactId)) await page.locator(`[data-cell="${c.col},${c.row}"]`).click()
  await expect(page.getByText('⭐ Dig star earned!')).toBeVisible()
  await page.getByRole('button', { name: 'See what you found →' }).click()

  await page.getByRole('button', { name: /^(Plan a drive|Move the arm|Plan a flight)/ }).click()

  const words = { F: /forward$/i, L: /Turn left/, R: /Turn right/ } as const
  let moves = shortestSolution(level.drive)!
  while (moves.length) {
    const chunk = moves.slice(0, level.drive.maxCommands)
    moves = moves.slice(level.drive.maxCommands)
    for (const m of chunk) await page.getByRole('group', { name: 'Add a move' }).getByRole('button', { name: words[m] }).click()
    await page.getByRole('button', { name: /Send \w+ plan/ }).click()
    if (moves.length) await expect(page.getByRole('button', { name: /Send \w+ plan/ })).toBeDisabled()
    if (moves.length) await expect(page.getByText(/^Plan \(0 \//)).toBeVisible({ timeout: 15_000 })
  }
  await expect(page.getByText(/Drive star earned/)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Read the real story →' }).click()
  await page.getByRole('button', { name: 'Quiz time →' }).click()

  for (const q of level.quiz) {
    await page.getByRole('button', { name: q.options[q.answer], exact: true }).click()
    await page.getByRole('button', { name: /Next question|See my score/ }).click()
  }
  await page.getByRole('button', { name: 'See my stars →' }).click()
  await expect(page.getByRole('heading', { name: /^You explored / })).toBeVisible()
  await expect(page.getByLabel('3 of 3 stars for this machine')).toBeVisible()
}

test('a full Mars level: dig, drive and quiz earn three stars', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await playLevel(page, 0)
  await page.getByRole('link', { name: /Back to Mars/ }).click()
  await expect(page.getByText('3 / 15')).toBeVisible()
  expect(errors).toEqual([])
})

test('the Mars certificate unlocks only with full stars', async ({ page }) => {
  await page.goto('/mars/certificate')
  await expect(page.getByRole('heading', { level: 1, name: /Certificate locked/ })).toBeVisible()
  const full = Object.fromEntries(
    MARS_CAMPAIGN.artifacts.map((a) => [a.artifactId, { best: { caught: true, repaired: true, quizCorrect: 4 }, plays: 1 }]),
  )
  await page.evaluate(
    (artifacts) =>
      localStorage.setItem(
        'n4s4.progress.v1',
        JSON.stringify({ version: 1, settings: {}, campaigns: { mars: { artifacts, badges: ['mars-explorer'] } } }),
      ),
    full,
  )
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /Mars Explorer badge earned/ })).toBeVisible()
  await expect(page.getByText(/Not issued or endorsed by NASA/)).toBeVisible()
  await expect(page.getByText(/N4S4-MARS-/)).toBeVisible()
})
