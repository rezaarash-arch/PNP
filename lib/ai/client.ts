import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (_client) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for AI features')
  }
  _client = new Anthropic({ apiKey })
  return _client
}

/** Reset the singleton (for testing only). */
export function resetClient(): void {
  _client = null
}
