export interface ScraperResult {
  province: string
  scrapedAt: string
  rules: unknown[]
  draws: unknown[]
  errors: { message: string; url: string }[]
}

export abstract class BaseScraper {
  abstract province: string
  abstract scrapeRules(): Promise<unknown[]>
  abstract scrapeDraws(): Promise<unknown[]>

  async run(): Promise<ScraperResult> {
    const errors: { message: string; url: string }[] = []
    let rules: unknown[] = []
    let draws: unknown[] = []
    try {
      rules = await this.scrapeRules()
    } catch (e: unknown) {
      errors.push({ message: e instanceof Error ? e.message : String(e), url: '' })
    }
    try {
      draws = await this.scrapeDraws()
    } catch (e: unknown) {
      errors.push({ message: e instanceof Error ? e.message : String(e), url: '' })
    }
    return {
      province: this.province,
      scrapedAt: new Date().toISOString(),
      rules,
      draws,
      errors,
    }
  }
}
