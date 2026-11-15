import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const photo = readFileSync(new URL('./fixture-photo.png', import.meta.url))

// A stand-in backend, so this runs in CI without the Python server, an AI key or the internet.
test('Astro shows NASA photos with their title and credit', async ({ page }) => {
  await page.route('**/api/health', (r) => r.fulfill({ json: { status: 'ok', ai_mode: 'knowledge', artifacts_loaded: 21 } }))
  await page.route('**/api/ai/suggested-questions**', (r) => r.fulfill({ json: { questions: ['Why is Mars red?'] } }))
  await page.route('**/api/ai/chat', (r) =>
    r.fulfill({
      json: {
        reply: "Saturn's rings are made of billions of chunks of water ice and rock.",
        sources: [{ title: 'NASA Science: Saturn Facts', url: 'https://science.nasa.gov/saturn/facts/' }],
        suggestions: ['How many moons does Saturn have?'],
        mode: 'knowledge',
        topic: 'solar_system',
        confidence: 'sourced',
        images: [
          { url: 'https://images-assets.nasa.gov/image/PIA1/PIA1~medium.jpg', title: "Saturn's rings", credit: 'NASA/JPL-Caltech/SSI', page_url: 'https://images.nasa.gov/details/PIA1', kind: 'nasa_photo' },
        ],
      },
    }),
  )
  await page.route('https://images-assets.nasa.gov/**', (r) => r.fulfill({ body: photo, contentType: 'image/png' }))

  await page.goto('/ask-astro')
  await page.getByPlaceholder(/Ask about a spacecraft/).fill("Show me Saturn's rings")
  await page.keyboard.press('Enter')
  await expect(page.getByText(/billions of chunks of water ice/)).toBeVisible()
  const img = page.getByRole('img', { name: "Saturn's rings" })
  await expect(img).toBeVisible()
  await expect(page.getByText(/📷 Saturn's rings · NASA\/JPL-Caltech\/SSI/)).toBeVisible()
  await expect(page.getByRole('link', { name: "Saturn's rings" })).toHaveAttribute('href', 'https://images.nasa.gov/details/PIA1')
})
