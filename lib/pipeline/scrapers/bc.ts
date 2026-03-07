import { BaseScraper } from './base'

/**
 * BC Province scraper — reference implementation.
 *
 * Currently a structured stub. When real scraping is implemented:
 * - scrapeRules() will fetch https://www.welcomebc.ca/Immigrate-to-B-C/Entrepreneur-Immigration
 *   and parse key requirements (personal net worth, investment amount, job creation, etc.)
 * - scrapeDraws() will fetch the BC PNP draw results page and extract draw records
 *   (date, invitations issued, minimum score, etc.)
 */
export class BCScraper extends BaseScraper {
  province = 'bc'

  private readonly rulesUrl =
    'https://www.welcomebc.ca/Immigrate-to-B-C/Entrepreneur-Immigration'
  private readonly drawsUrl =
    'https://www.welcomebc.ca/Immigrate-to-B-C/BC-PNP-Draws'

  async scrapeRules(): Promise<unknown[]> {
    // TODO: Fetch this.rulesUrl and parse HTML to extract:
    // - Minimum personal net worth
    // - Minimum investment amount
    // - Job creation requirements
    // - Business ownership percentage
    // - Language requirements
    // - Education requirements
    // For now, return placeholder structured data showing the expected shape.
    return [
      {
        program: 'BC PNP Entrepreneur Immigration',
        source_url: this.rulesUrl,
        requirements: {
          personal_net_worth_cad: 600_000,
          investment_amount_cad: 200_000,
          job_creation: 1,
          business_ownership_pct: 33.33,
          language: { clb_level: null, note: 'CLB 4 recommended' },
          education: { minimum: null, note: 'Post-secondary preferred' },
        },
        last_known_update: null,
        _stub: true,
      },
    ]
  }

  async scrapeDraws(): Promise<unknown[]> {
    // TODO: Fetch this.drawsUrl and parse HTML to extract draw records.
    // Each record should include: draw_date, invitations_issued, min_score, category.
    // For now, return placeholder data showing the expected shape.
    return [
      {
        program: 'BC PNP Entrepreneur Immigration - Base',
        source_url: this.drawsUrl,
        draw_date: '2025-01-15',
        invitations_issued: 29,
        min_score: 124,
        category: 'Entrepreneur Immigration - Base',
        _stub: true,
      },
    ]
  }
}
