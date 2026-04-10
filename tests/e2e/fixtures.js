import { test as base, expect } from '@playwright/test'

/**
 * Custom Playwright test fixture with auto-mocked API routes.
 *
 * Why mock?
 *   - The astrology API depends on celestine, which is slow on cold-start
 *     (compiles on first hit, can take >30s under dev). Real calls made
 *     tests flaky on fresh dev server starts.
 *   - The entitlements config comes from the Supabase paywall_config table,
 *     which isn't populated locally — without mocking, free tier behaves as
 *     if nothing is gated and paywall locks never appear.
 *   - The chart save/load endpoints hit Supabase, which we don't want in
 *     unit-style e2e tests.
 *
 * Default behavior (free tier):
 *   - /api/astrology         → returns empty {} (sun sign computed client-side)
 *   - /api/device action=*   → returns free tier with paywall_enabled + all
 *                              celestial features gated
 *   - /api/chart action=*    → returns empty list or success
 *
 * Override behavior in a test:
 *   import { test, expect, asPremium } from './fixtures.js'
 *
 *   test('premium user sees no locks', async ({ page }) => {
 *     await asPremium(page)
 *     await page.goto('/')
 *     // ...
 *   })
 *
 * Helpers exported:
 *   - asPremium(page)         → re-mocks /api/device to return premium tier
 *   - asFree(page, { gated }) → re-mock with custom gated_features list
 *   - mockSavedCharts(page, charts) → seed /api/chart?action=list response
 */

const FREE_CONFIG = {
  paywall_enabled: true,
  gated_features: [
    'zodiac_view',
    'tables_view',
    'constellation_view',
    'advanced_insights',
    'full_dig',
    'full_compatibility',
    'zodiac_export',
    'pdf_export',
    'unlimited_charts',
  ],
  chart_limit_free: 3,
  chart_limit_premium: 50,
}

async function mockAstrology(page) {
  await page.route('**/api/astrology', async (route) => {
    // Return empty data — getSunSign is computed client-side, so the member
    // still gets a sign. Moon/inner planets are optional and not asserted on.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
}

async function mockDevice(page, { tier = 'free', config = FREE_CONFIG } = {}) {
  await page.route('**/api/device**', async (route) => {
    const url = route.request().url()
    if (url.includes('action=entitlements')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tier, config }),
      })
      return
    }
    // register, link-auth, unlink-auth, email, etc — return ok
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

async function mockChart(page, { savedCharts = [] } = {}) {
  await page.route('**/api/chart**', async (route) => {
    const url = route.request().url()
    if (url.includes('action=list')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, charts: savedCharts }),
      })
      return
    }
    if (url.includes('action=public') || url.includes('action=share')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, token: 'mock-token' }),
      })
      return
    }
    // save, delete, restore — generic ok
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await mockAstrology(page)
    await mockDevice(page)
    await mockChart(page)
    // Bypass the EmailCapture dialog that auto-opens after the user views
    // Insights for the first time. Without this, navigation tests get blocked
    // by the dialog backdrop intercepting clicks.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('astrotree_email_asked', '1')
      } catch {}
    })
    await use(page)
  },
})

/** Re-mock /api/device as premium tier — call BEFORE page.goto. */
export async function asPremium(page) {
  await mockDevice(page, { tier: 'premium', config: FREE_CONFIG })
}

/** Re-mock /api/device as free tier with custom gated_features. */
export async function asFree(page, { gated = FREE_CONFIG.gated_features } = {}) {
  await mockDevice(page, {
    tier: 'free',
    config: { ...FREE_CONFIG, gated_features: gated },
  })
}

/** Re-mock /api/chart?action=list to return seeded charts. */
export async function mockSavedCharts(page, charts) {
  await mockChart(page, { savedCharts: charts })
}

/**
 * Visible-only selector helper.
 *
 * AstroDig keeps panels (insights, charts, family, about, edit-member) in
 * the DOM even when their containing BottomSheet is closed — they're just
 * display:none. `.first()` picks DOM order, which is usually a hidden one.
 *
 * Usage: `visible(page, '.insights-panel')` returns a Locator that only
 * matches the visible instance.
 */
export function visible(page, selector) {
  return page.locator(`${selector}:visible`)
}

/**
 * The currently-open cosmic BottomSheet.
 *
 * BottomSheets stay in the DOM when closed; they're moved off-screen via
 * transform, NOT display:none. Playwright's `:visible` selector treats them
 * as visible (they have size + are in the layout), so we can't use it to
 * pick only the open one. Use this helper instead.
 *
 * Usage:
 *   await openSheet(page).getByRole('button', { name: 'Close' }).click()
 */
export function openSheet(page) {
  return page.locator('.cosmic-bottom-sheet.open')
}

export { expect }
