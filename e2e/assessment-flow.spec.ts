import { test, expect } from '@playwright/test'

test.describe('Assessment Landing Page', () => {
  test('renders the hero section with heading and CTA', async ({ page }) => {
    await page.goto('/assessment')

    // Verify the main heading is visible
    await expect(
      page.getByRole('heading', {
        name: /find your best path to canadian entrepreneurship/i,
      }),
    ).toBeVisible()

    // Verify the Start Assessment CTA link exists and points to the questionnaire
    const cta = page.getByRole('link', { name: /start assessment/i })
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/assessment/questionnaire')
  })

  test('displays feature cards', async ({ page }) => {
    await page.goto('/assessment')

    await expect(page.getByText('5-Minute Questionnaire')).toBeVisible()
    await expect(page.getByText('Scored Against 15+ Programs')).toBeVisible()
    await expect(page.getByText('Personalized Gap Analysis')).toBeVisible()
  })
})

test.describe('Questionnaire Page', () => {
  test('loads the questionnaire shell', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // The questionnaire should render with a Continue button
    const continueButton = page.getByRole('button', { name: /continue/i })
    await expect(continueButton).toBeVisible()
  })

  test('does not show Back button on first section', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // Back button should not be present on the first section
    await expect(
      page.getByRole('button', { name: /^back$/i }),
    ).not.toBeVisible()
  })

  test('navigates forward and back between sections', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // Click Continue to advance to section 2
    await page.getByRole('button', { name: /continue/i }).click()

    // Back button should now be visible
    const backButton = page.getByRole('button', { name: /^back$/i })
    await expect(backButton).toBeVisible()

    // Continue button should still be present
    await expect(
      page.getByRole('button', { name: /continue/i }),
    ).toBeVisible()

    // Click Back to return to section 1
    await backButton.click()

    // Back button should disappear again on the first section
    await expect(
      page.getByRole('button', { name: /^back$/i }),
    ).not.toBeVisible()
  })

  test('shows "View Results" on the last section', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // Navigate through all 7 sections (click Continue 6 times to reach section 7)
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: /continue/i }).click()
    }

    // The last section should show "View Results" instead of "Continue"
    await expect(
      page.getByRole('button', { name: /view results/i }),
    ).toBeVisible()
  })

  test('displays section progress indicators', async ({ page }) => {
    await page.goto('/assessment/questionnaire')

    // Verify section labels are present in the progress bar
    const sectionLabels = [
      'Personal Info',
      'Language',
      'Education',
      'Business',
      'Financial',
      'Canada',
      'Intent',
    ]

    for (const label of sectionLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })
})

test.describe('Review Page', () => {
  test('redirects to questionnaire when no answers are stored', async ({
    page,
  }) => {
    await page.goto('/assessment/review')

    // Without sessionStorage data, the review page should redirect to the questionnaire
    await page.waitForURL('**/assessment/questionnaire', { timeout: 10000 })
    expect(page.url()).toContain('/assessment/questionnaire')
  })

  test('displays review content when answers are present', async ({
    page,
  }) => {
    await page.goto('/assessment/questionnaire')

    // Seed sessionStorage with minimal answers so the review page renders
    await page.evaluate(() => {
      const answers = {
        age: 35,
        citizenshipCountry: 'IN',
        residenceCountry: 'IN',
        languageTest: 'ielts',
        clbEnglish: 7,
        educationLevel: 'bachelors',
        hasOwnedBusiness: 'yes',
        yearsOfOwnership: 5,
        netWorth: 300000,
        liquidAssets: 150000,
        investmentAmount: 200000,
        hasVisitedCanada: 'yes',
        interestedProvince: 'ON',
      }
      sessionStorage.setItem('assessmentAnswers', JSON.stringify(answers))
    })

    await page.goto('/assessment/review')

    // The review heading should be visible
    await expect(
      page.getByRole('heading', { name: /review your answers/i }),
    ).toBeVisible()

    // The consent checkbox should be present
    await expect(page.getByRole('checkbox')).toBeVisible()

    // The submit button should be present but disabled until consent is given
    const submitButton = page.getByRole('button', { name: /get my results/i })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeDisabled()
  })

  test('enables submit button after consent checkbox is checked', async ({
    page,
  }) => {
    await page.goto('/assessment/questionnaire')

    // Seed sessionStorage
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

    // Check the consent checkbox
    await page.getByRole('checkbox').check()

    // Submit button should now be enabled
    const submitButton = page.getByRole('button', { name: /get my results/i })
    await expect(submitButton).toBeEnabled()
  })
})

test.describe('Results Page', () => {
  test('redirects to questionnaire when no results are stored', async ({
    page,
  }) => {
    await page.goto('/assessment/results')

    // Without sessionStorage data, the results page should redirect to the questionnaire
    await page.waitForURL('**/assessment/questionnaire', { timeout: 10000 })
    expect(page.url()).toContain('/assessment/questionnaire')
  })

  test('displays results dashboard when data is present', async ({ page }) => {
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

    // The results page should render content (not redirect)
    await expect(page).not.toHaveURL(/\/assessment\/questionnaire/)
  })
})
