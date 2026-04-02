import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAnthropicClient, resetClient } from './client'

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn()
  return { default: MockAnthropic }
})

describe('getAnthropicClient', () => {
  beforeEach(() => {
    resetClient()
    delete process.env.ANTHROPIC_API_KEY
  })

  it('creates a client when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-123'
    const client = getAnthropicClient()
    expect(client).toBeDefined()
  })

  it('returns the same singleton on subsequent calls', () => {
    process.env.ANTHROPIC_API_KEY = 'test-key-123'
    const client1 = getAnthropicClient()
    const client2 = getAnthropicClient()
    expect(client1).toBe(client2)
  })

  it('throws when ANTHROPIC_API_KEY is missing', () => {
    expect(() => getAnthropicClient()).toThrow(
      'ANTHROPIC_API_KEY environment variable is required for AI features'
    )
  })
})
