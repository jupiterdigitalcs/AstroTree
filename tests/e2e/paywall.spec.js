import { test, expect } from '@playwright/test'

/**
 * Paywall checks.
 *
 * NOTE: Real paywall coverage requires intercepting the /api/chart and
 * /api/device entitlements responses to inject a config with gated features
 * (since locally the server returns an empty config and free tier behaves
 * as if nothing is gated). That's a follow-up.
 *
 * For now, just verify the demo flow works and free-tier UI elements render.
 */

test.describe('paywall (free tier)', () => {
  test('clicking "Try: Family Tree" loads the demo chart', async ({ page }) => {
    await page.goto('/')
    const onboarding = page.locator('.cosmic-onboarding')
    await expect(onboarding).toBeVisible({ timeout: 10_000 })

    await onboarding.getByRole('button', { name: /family tree/i }).click()

    // Demo chart should render at least one astro-node
    // Demo loads 9 members in parallel — astrology API calls take time
    await expect(page.locator('.astro-node').first())
      .toBeVisible({ timeout: 30_000 })
  })

  test('view switcher pills (FloatingPills) render in cosmic mode after demo', async ({ page }) => {
    await page.goto('/')
    await page.locator('.cosmic-onboarding').getByRole('button', { name: /family tree/i }).click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 30_000 })

    // FloatingPills should show all 4 view options
    const pills = page.locator('.cosmic-pill-btn')
    await expect(pills).toHaveCount(4)
    await expect(pills.filter({ hasText: /tree/i }).first()).toBeVisible()
    await expect(pills.filter({ hasText: /constellation/i }).first()).toBeVisible()
    await expect(pills.filter({ hasText: /zodiac/i }).first()).toBeVisible()
    await expect(pills.filter({ hasText: /tables/i }).first()).toBeVisible()
  })
})
