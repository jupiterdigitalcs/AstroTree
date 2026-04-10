import { test, expect } from './fixtures.js'

/**
 * Core flow: add a family member, verify they appear and the chart renders.
 *
 * AstroDig has TWO add-form variants on first load:
 *   1. CanvasOnboarding (cosmic mode default) — center overlay with single Name
 *      input + MM/DD/YYYY split inputs + "Add to Chart" button
 *   2. AddMembersForm (classic mode + bottom sheet) — row-based form
 *
 * Since cosmic is the default for all 4 device projects, this test targets
 * the CanvasOnboarding flow. A separate test can cover classic later.
 */

test.describe('add member (cosmic onboarding)', () => {
  test('add one person → name appears on chart', async ({ page }) => {
    await page.goto('/')

    // Scope to the CanvasOnboarding container — there are duplicate forms in
    // hidden bottom sheets, so we must avoid leaking matches into them.
    const onboarding = page.locator('.cosmic-onboarding')
    await expect(onboarding).toBeVisible({ timeout: 10_000 })

    await onboarding.getByPlaceholder('Name').fill('Test Person')
    await onboarding.getByPlaceholder('MM').fill('06')
    await onboarding.getByPlaceholder('DD').fill('15')
    await onboarding.getByPlaceholder('YYYY').fill('1990')

    // Wait for the submit button to become enabled (state propagation can lag
    // a tick after the last fill — the disabled attribute is the canonical signal)
    const submit = onboarding.getByRole('button', { name: /add to chart/i })
    await expect(submit).toBeEnabled({ timeout: 5_000 })
    await submit.click()

    // After add, the member appears as a React Flow node on the chart.
    // The .astro-node container is rendered by AstroNode.jsx for each member.
    await expect(page.locator('.astro-node').filter({ hasText: 'Test Person' }))
      .toBeVisible({ timeout: 15_000 })

    // Sun sign should be Gemini for 1990-06-15
    await expect(page.locator('.astro-node').filter({ hasText: 'Test Person' }))
      .toContainText('Gemini')
  })
})
