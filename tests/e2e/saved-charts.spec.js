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

    // Verify the chart was written to localStorage by handleAdd's auto-save.
    // (Note: ChartsPanel's UI may not reflect this until the next mount —
    // there's a known refreshTick bug where handleAdd doesn't bump the tick.)
    const stored = await page.evaluate(() =>
      localStorage.getItem('astrotree_charts')
    )
    expect(stored).toBeTruthy()
    const charts = JSON.parse(stored)
    expect(charts).toHaveLength(1)
    expect(charts[0].title).toMatch(/persisted chart/i)
  })

  test('after reload, chart appears in Saved panel', async ({ page }) => {
    await page.goto('/')
    await addOneMember(page, 'Reload Test')

    // Reload — ChartsPanel will re-mount and read the saved chart from
    // localStorage. This is the only path that currently works around the
    // refreshTick bug.
    await page.reload()

    // After reload, since astrotree_used is set, CanvasOnboarding shows the
    // "Welcome Back" screen instead of the add form. Skip past it via the
    // bottom-nav Saved button (which doesn't require loading the chart first).
    await page.locator('.cosmic-bottom-nav')
      .getByRole('button', { name: /saved/i })
      .click()

    const sheet = openSheet(page)
    await expect(sheet.locator('.cosmic-bottom-sheet-title'))
      .toContainText(/saved/i, { timeout: 5_000 })
    await expect(sheet.locator('.charts-panel').getByText(/reload test/i).first())
      .toBeVisible({ timeout: 5_000 })
  })
})
