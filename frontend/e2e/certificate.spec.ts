import { expect, test } from '@playwright/test'

const caught = { best: { caught: true, repaired: true, quizCorrect: 3 }, plays: 1 }

test('certificate is locked until the badge is earned', async ({ page }) => {
  await page.goto('/moon/certificate')
  await expect(page.getByRole('heading', { level: 1, name: /Certificate locked/ })).toBeVisible()
  await expect(page.getByText(/Apollo 11, Apollo 14, Apollo 15, Surveyor 3/)).toBeVisible()
})

test('with the badge: nickname only, cleaned, unofficial, printable', async ({ page }) => {
  await page.goto('/moon/campaign')
  await page.evaluate((c) => {
    const ids = ['apollo-11-eagle', 'apollo-14-antares', 'apollo-15-falcon', 'surveyor-3']
    localStorage.setItem(
      'n4s4.progress.v1',
      JSON.stringify({ version: 1, settings: {}, campaigns: { moon: { artifacts: Object.fromEntries(ids.map((id) => [id, c])), badges: ['moon-explorer'] } } }),
    )
  }, caught)
  await page.reload()
  await page.getByRole('link', { name: /Get your certificate/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: /Moon Explorer badge earned/ })).toBeVisible()

  const print = page.getByRole('button', { name: /Print or save as PDF/ })
  await expect(print).toBeDisabled()
  await page.getByLabel(/Your nickname/).fill('Star <b>Kid</b> 7!!')
  await expect(page.getByTestId('certificate-name')).toHaveText('Star bKidb 7')
  await expect(page.getByText(/12 \/ 12/)).toBeVisible()
  await expect(page.getByText(/^N4S4-MOON-[A-Z2-9]{4}-[A-Z2-9]{4}$/)).toBeVisible()
  await expect(page.getByText('Unofficial N4S4 F0R FUN achievement certificate. Not issued or endorsed by NASA.')).toBeVisible()

  await page.evaluate(() => {
    ;(window as unknown as { printed: boolean }).printed = false
    window.print = () => {
      ;(window as unknown as { printed: boolean }).printed = true
    }
  })
  await print.click()
  expect(await page.evaluate(() => (window as unknown as { printed: boolean }).printed)).toBe(true)

  // The nickname is never stored.
  const stored = await page.evaluate(() => JSON.stringify(localStorage))
  expect(stored).not.toContain('Kid')
})
