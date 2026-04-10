import { test, expect, asPremium, visible } from './fixtures.js'

/**
 * Insights panel — covers TESTING.md items 34-39.
 *
 * Past bugs:
 *   - Insights tab disabled before 2 members
 *   - Locked cards not appearing for free users
 *   - DIG paywall slide missing for free users
 */

async function loadDemoAndOpenInsights(page) {
  await page.goto('/')
  await page.locator('.cosmic-onboarding')
    .getByRole('button', { name: /family tree/i })
    .click()
  await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

  await page.locator('.cosmic-bottom-nav')
    .getByRole('button', { name: /insights/i })
    .click()
  await expect(visible(page, '.insights-panel')).toBeVisible({ timeout: 5_000 })
}

test.describe('insights panel', () => {
  test('free tier: insights panel renders with at least one card', async ({ page }) => {
    await loadDemoAndOpenInsights(page)
    await expect(visible(page, '.insight-card').first()).toBeVisible({ timeout: 5_000 })
  })

  test('free tier: at least one upgrade affordance is visible', async ({ page }) => {
    await loadDemoAndOpenInsights(page)
    // Locked insights surface as text mentioning Celestial / Unlock somewhere
    // in the visible insights panel.
    const panel = visible(page, '.insights-panel').first()
    await expect(panel.getByText(/celestial|unlock/i).first())
      .toBeVisible({ timeout: 5_000 })
  })

  test('premium tier: no "Unlock Celestial" CTA inside insights panel', async ({ page }) => {
    await asPremium(page)
    await loadDemoAndOpenInsights(page)

    const panel = visible(page, '.insights-panel').first()
    await expect(panel.getByText(/unlock celestial/i)).toHaveCount(0)
  })
})
