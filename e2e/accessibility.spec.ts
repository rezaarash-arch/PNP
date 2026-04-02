import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility - Assessment Landing Page', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/assessment')

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test('main heading has correct hierarchy', async ({ page }) => {
    await page.goto('/assessment')

    // Page should have exactly one h1
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)
  })

  test('CTA link is keyboard accessible', async ({ page }) => {
    await page.goto('/assessment')

    const cta = page.getByRole('link', { name: /start assessment/i })
    await expect(cta).toBeVisible()

    // Tab to the CTA and verify it receives focus
    await cta.focus()
    await expect(cta).toBeFocused()
  })

  test('decorative SVG icons are hidden from screen readers', async ({
    page,
  }) => {
    await page.goto('/assessment')

    // All decorative SVGs in feature cards should have aria-hidden="true"
    const svgs = page.locator('svg[aria-hidden="true"]')
    const count = await svgs.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Accessibility - Questionnaire Page', () => {
  test('has no accessibility violations', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test('navigation buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // Continue button should be focusable
    const continueButton = page.getByRole('button', { name: /continue/i })
    await continueButton.focus()
    await expect(continueButton).toBeFocused()
  })

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // All visible inputs should be labeled (via label element, aria-label, or aria-labelledby)
    const inputs = page.locator(
      'input:visible, select:visible, textarea:visible',
    )
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const id = await input.getAttribute('id')

      // Input should have aria-label, aria-labelledby, or be linked via a <label>
      const hasLabel =
        ariaLabel !== null ||
        ariaLabelledBy !== null ||
        (id !== null &&
          (await page.locator(`label[for="${id}"]`).count()) > 0)

      expect(
        hasLabel,
        `Input at index ${i} is missing an accessible label`,
      ).toBe(true)
    }
  })
})

test.describe('Accessibility - Review Page', () => {
  test('has no accessibility violations when answers are present', async ({
    page,
  }) => {
    await page.goto('/assessment/questionnaire')

    // Seed sessionStorage so the review page renders fully
    await page.evaluate(() => {
      const answers = {
        age: 35,
        citizenshipCountry: 'IN',
        languageTest: 'ielts',
        clbEnglish: 7,
        educationLevel: 'bachelors',
        hasOwnedBusiness: 'yes',
        netWorth: 300000,
        liquidAssets: 150000,
        investmentAmount: 200000,
        interestedProvince: 'ON',
      }
      sessionStorage.setItem('assessmentAnswers', JSON.stringify(answers))
    })

    await page.goto('/assessment/review')

    await expect(
      page.getByRole('heading', { name: /review your answers/i }),
    ).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test('consent checkbox has an accessible label', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    await page.evaluate(() => {
      sessionStorage.setItem(
        'assessmentAnswers',
        JSON.stringify({ age: 30, citizenshipCountry: 'US' }),
      )
    })

    await page.goto('/assessment/review')

    await expect(
      page.getByRole('heading', { name: /review your answers/i }),
    ).toBeVisible()

    // The checkbox should be wrapped in a <label>, making it accessible
    const checkbox = page.getByRole('checkbox')
    await expect(checkbox).toBeVisible()

    // Verify the checkbox is inside a label element
    const parentLabel = page.locator('label:has(input[type="checkbox"])')
    await expect(parentLabel).toHaveCount(1)
  })

  test('edit buttons are accessible', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    await page.evaluate(() => {
      sessionStorage.setItem(
        'assessmentAnswers',
        JSON.stringify({
          age: 30,
          citizenshipCountry: 'US',
          languageTest: 'ielts',
          educationLevel: 'bachelors',
        }),
      )
    })

    await page.goto('/assessment/review')

    await expect(
      page.getByRole('heading', { name: /review your answers/i }),
    ).toBeVisible()

    // All Edit buttons should be keyboard accessible
    const editButtons = page.getByRole('button', { name: /edit/i })
    const count = await editButtons.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const button = editButtons.nth(i)
      await button.focus()
      await expect(button).toBeFocused()
    }
  })
})

test.describe('Accessibility - Results Page', () => {
  test('has no accessibility violations when results are present', async ({
    page,
  }) => {
    await page.goto('/assessment/questionnaire')

    // Seed sessionStorage with mock results
    await page.evaluate(() => {
      const results = {
        results: [
          {
            programId: 'ON-ENT',
            programName: 'Ontario Entrepreneur Stream',
            province: 'ON',
            score: 82,
            eligible: true,
            gaps: [],
          },
        ],
        meta: {
          timestamp: new Date().toISOString(),
        },
      }
      sessionStorage.setItem('assessmentResults', JSON.stringify(results))
    })

    await page.goto('/assessment/results')

    // Wait for the page to not redirect
    await page.waitForTimeout(1000)
    await expect(page).not.toHaveURL(/\/assessment\/questionnaire/)

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
})
