import { test, expect, openSheet } from './fixtures.js'

/**
 * Saved charts panel — covers TESTING.md items 65-72.
 *
 * Most chart CRUD goes through localStorage AND the cloud API. With the
 * fixture mocking /api/chart, save/load operations succeed without a real
 * Supabase backend.
 */

async function addOneMember(page, name) {
  const onboarding = page.locator('.cosmic-onboarding')
  await onboarding.getByPlaceholder('Name').fill(name)
  await onboarding.getByPlaceholder('MM').fill('06')
  await onboarding.getByPlaceholder('DD').fill('15')
  await onboarding.getByPlaceholder('YYYY').fill('1990')
  await onboarding.getByRole('button', { name: /add to chart/i }).click()
  await expect(page.locator('.astro-node').filter({ hasText: name }))
    .toBeVisible({ timeout: 10_000 })
}

test.describe('saved charts', () => {
  test('after first add, saved toast appears', async ({ page }) => {
    await page.goto('/')
    await addOneMember(page, 'Auto Save Test')
    await expect(page.locator('.saved-toast')).toBeVisible({ timeout: 5_000 })
  })

  test('auto-saved chart persists to localStorage', async ({ page }) => {
    await page.goto('/')
    await addOneMember(page, 'Persisted Chart')

    const stored = await page.evaluate(() =>
      localStorage.getItem('astrotree_charts')
    )
    expect(stored).toBeTruthy()
    const charts = JSON.parse(stored)
    expect(charts).toHaveLength(1)
    expect(charts[0].title).toMatch(/persisted chart/i)
  })

  test('auto-saved chart appears in Saved panel without reload', async ({ page }) => {
    await page.goto('/')
    await addOneMember(page, 'Live Save')

    // After first add, the Family bottom sheet is auto-opened. Close it so
    // the Saved nav button isn't covered.
    await openSheet(page).locator('.cosmic-bottom-sheet-close').click()

    await page.locator('.cosmic-bottom-nav')
      .getByRole('button', { name: /saved/i })
      .click()

    const sheet = openSheet(page)
    await expect(sheet.locator('.cosmic-bottom-sheet-title'))
      .toContainText(/saved/i, { timeout: 5_000 })

    // ChartsPanel listens for the storage CHARTS_CHANGED_EVENT, so the new
    // chart appears immediately even though it was added after panel mount.
    await expect(sheet.locator('.charts-panel').getByText(/live save/i).first())
      .toBeVisible({ timeout: 5_000 })
  })
})
