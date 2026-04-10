import { test, expect, asPremium, asFreeWithEmptyConfig } from './fixtures.js'

/**
 * Paywall checks — uses the fixtures file to inject a paywall_enabled config
 * with all celestial features gated. Without this mock, free tier behaves
 * as if nothing is gated.
 */

test.describe('paywall (free tier — default mocks)', () => {
  test('demo loads and FloatingPills shows lock on Zodiac + Tables', async ({ page }) => {
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    const pills = page.locator('.cosmic-pill-btn')
    await expect(pills).toHaveCount(4)

    // Tree + Constellation: no lock
    await expect(pills.filter({ hasText: 'Tree' }).first()).not.toContainText('🔒')
    await expect(pills.filter({ hasText: 'Constellation' }).first()).not.toContainText('🔒')

    // Zodiac + Tables: locked for free tier
    await expect(pills.filter({ hasText: 'Zodiac' }).first()).toContainText('🔒')
    await expect(pills.filter({ hasText: 'Tables' }).first()).toContainText('🔒')
  })

  test('clicking locked Zodiac pill shows LockedOverlay', async ({ page }) => {
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    await page.locator('.cosmic-pill-btn').filter({ hasText: 'Zodiac' }).first().click()

    await expect(page.locator('.locked-overlay')).toBeVisible({ timeout: 10_000 })
  })

  test('LockedOverlay has Unlock Celestial CTA', async ({ page }) => {
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    await page.locator('.cosmic-pill-btn').filter({ hasText: 'Tables' }).first().click()

    const overlay = page.locator('.locked-overlay')
    await expect(overlay).toBeVisible()
    await expect(overlay.getByRole('button', { name: /unlock|celestial|upgrade/i }).first())
      .toBeVisible()
  })
})

test.describe('paywall (fail-closed when server config is missing)', () => {
  test('empty server config still locks Zodiac for free users', async ({ page }) => {
    await asFreeWithEmptyConfig(page)
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    // Even with config={}, the client falls back to DEFAULT_GATED_FEATURES
    // and the lock icon should still appear on Zodiac/Tables.
    const pills = page.locator('.cosmic-pill-btn')
    await expect(pills.filter({ hasText: 'Zodiac' }).first()).toContainText('🔒')
    await expect(pills.filter({ hasText: 'Tables' }).first()).toContainText('🔒')
  })

  test('empty server config: clicking Zodiac shows LockedOverlay', async ({ page }) => {
    await asFreeWithEmptyConfig(page)
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    await page.locator('.cosmic-pill-btn').filter({ hasText: 'Zodiac' }).first().click()
    await expect(page.locator('.locked-overlay')).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('paywall (premium — overridden mocks)', () => {
  test('premium user sees no locks on any view pill', async ({ page }) => {
    await asPremium(page)
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    const pills = page.locator('.cosmic-pill-btn')
    await expect(pills).toHaveCount(4)
    for (const view of ['Tree', 'Constellation', 'Zodiac', 'Tables']) {
      await expect(pills.filter({ hasText: view }).first()).not.toContainText('🔒')
    }
  })

  test('premium user can switch to Zodiac without LockedOverlay', async ({ page }) => {
    await asPremium(page)
    await page.goto('/')
    await page.locator('.cosmic-onboarding')
      .getByRole('button', { name: /family tree/i })
      .click()
    await expect(page.locator('.astro-node').first()).toBeVisible({ timeout: 10_000 })

    await page.locator('.cosmic-pill-btn').filter({ hasText: 'Zodiac' }).first().click()
    await expect(page.locator('.locked-overlay')).not.toBeVisible()
  })
})
