import { test, expect } from './fixtures.js'

/**
 * Smoke tests — verify the app loads without crashing on every device.
 * If these fail, something is fundamentally broken.
 */

test.describe('smoke', () => {
  test('app loads, no console errors, brand visible', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')

    // Page title is the most reliable cross-mode check (cosmic hides top-nav,
    // classic hides cosmic brand — but title is set in layout.jsx for both)
    await expect(page).toHaveTitle(/AstroDig/i, { timeout: 10_000 })

    // Filter out known noisy errors that aren't bugs (analytics, third-party, etc.)
    const realErrors = errors.filter(e =>
      !e.includes('vercel') &&
      !e.includes('google') &&
      !e.includes('ipapi.co') && // geolocation lookup, often CORS-blocked locally
      !e.includes('Failed to load resource') &&
      !e.includes('favicon')
    )
    expect(realErrors, `Console errors:\n${realErrors.join('\n')}`).toEqual([])
  })

  test('starfield renders without layout shift crash', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.stars')).toBeAttached()
  })
})
