import { test, expect, visible } from './fixtures.js'

/**
 * Navigation flows — covers TESTING.md items 1-11 (web + mobile nav).
 *
 * The cosmic/classic split has caused many bugs where one nav was fixed
 * but the other wasn't. These tests focus on cosmic (default) since that's
 * where the bottom-sheet pattern adds the most breakage surface.
 *
 * Note: panels stay in the DOM when their BottomSheet is closed (just
 * display:none), so we use the `visible(page, sel)` helper to filter.
 */

async function loadDemo(page) {
  await page.goto('/')
  await page.locator('.cosmic-onboarding')
    .getByRole('button', { name: /family tree/i })
    .click()
  await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })
}

test.describe('navigation', () => {
  test('bottom nav: tap each tab opens the right sheet', async ({ page }) => {
    await loadDemo(page)

    const nav = page.locator('.cosmic-bottom-nav')
    await expect(nav).toBeVisible()

    // Insights
    await nav.getByRole('button', { name: /insights/i }).click()
    await expect(visible(page, '.insights-panel')).toBeVisible({ timeout: 5_000 })

    // Saved
    await nav.getByRole('button', { name: /saved/i }).click()
    await expect(visible(page, '.charts-panel')).toBeVisible({ timeout: 5_000 })

    // Chart (back to canvas) — bottom sheet should close, astro-nodes visible
    await nav.getByRole('button', { name: /chart/i }).click()
    await expect(page.locator('.astro-node').first()).toBeVisible()
  })

  test('browser back: insights → saved → back returns to insights', async ({ page }) => {
    await loadDemo(page)

    const nav = page.locator('.cosmic-bottom-nav')
    await nav.getByRole('button', { name: /insights/i }).click()
    await expect(visible(page, '.insights-panel')).toBeVisible({ timeout: 5_000 })

    await nav.getByRole('button', { name: /saved/i }).click()
    await expect(visible(page, '.charts-panel')).toBeVisible({ timeout: 5_000 })

    await page.goBack()
    await expect(visible(page, '.insights-panel')).toBeVisible({ timeout: 5_000 })
  })

  test('view switcher: tree → constellation → tree (no errors)', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    await loadDemo(page)

    const pills = page.locator('.cosmic-pill-btn')
    await pills.filter({ hasText: 'Constellation' }).first().click()
    await page.waitForTimeout(500) // tiny settle

    await pills.filter({ hasText: 'Tree' }).first().click()
    await expect(page.locator('.astro-node').first()).toBeVisible()

    expect(errors, `Page errors: ${errors.join('\n')}`).toEqual([])
  })
})
