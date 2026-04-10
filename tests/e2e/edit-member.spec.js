import { test, expect, openSheet } from './fixtures.js'

/**
 * Edit member flow — covers TESTING.md item 5 ("click a node on tree → edit
 * panel opens, close it → returns to tree").
 *
 * Past bugs:
 *   - Click after drag was opening edit panel unintentionally
 *   - Edit panel state was leaking when switching tabs
 *
 * Implementation note: we add ONE member instead of loading the demo, so the
 * Family bottom sheet is already open after the add (handleAdd sets
 * activeTab='add' on first add). This avoids the timing flake of opening
 * the sheet via the bottom-nav after a heavy demo render.
 *
 * We also avoid clicking React Flow nodes — Playwright's synthetic clicks
 * on SVG node groups don't reliably trigger React Flow's onNodeClick handler.
 * The member-pill in the family list does the same thing (sets editingNodeId).
 */

async function addOneMember(page, name = 'Editor Subject') {
  await page.goto('/')
  const onboarding = page.locator('.cosmic-onboarding')
  await onboarding.getByPlaceholder('Name').fill(name)
  await onboarding.getByPlaceholder('MM').fill('06')
  await onboarding.getByPlaceholder('DD').fill('15')
  await onboarding.getByPlaceholder('YYYY').fill('1990')
  await onboarding.getByRole('button', { name: /add to chart/i }).click()
  await expect(page.locator('.astro-node').filter({ hasText: name }))
    .toBeVisible({ timeout: 10_000 })
}

test.describe('edit member', () => {
  test('click member pill opens edit panel', async ({ page }) => {
    await addOneMember(page, 'Subject A')

    // Family sheet is already open after first add. Scope to the OPEN sheet.
    const sheet = openSheet(page)
    await sheet.locator('.member-pill').first().click()

    // The cosmic BottomSheet header switches to "Edit Member" when editing.
    await expect(sheet.locator('.cosmic-bottom-sheet-title'))
      .toContainText(/edit member/i, { timeout: 5_000 })
  })

  test('back button closes edit panel and returns to family list', async ({ page }) => {
    await addOneMember(page, 'Subject B')

    const sheet = openSheet(page)
    await sheet.locator('.member-pill').first().click()
    await expect(sheet.locator('.cosmic-bottom-sheet-title'))
      .toContainText(/edit member/i, { timeout: 5_000 })

    // Back button: "← Back to Family"
    await sheet.locator('.back-btn').click()

    // After back, the bottom sheet header should say Family (not Edit Member)
    await expect(sheet.locator('.cosmic-bottom-sheet-title'))
      .toContainText(/family/i, { timeout: 5_000 })
    // family list reappears with the member-pill
    await expect(sheet.locator('.member-pill').first()).toBeVisible()
  })
})
