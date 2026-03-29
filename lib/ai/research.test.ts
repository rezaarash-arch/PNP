import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('./client', () => ({
  getAnthropicClient: vi.fn(() => ({
    messages: { create: mockCreate },
  })),
}))

import { researchProgram } from './research'
import type { ResearchContext } from './research'

const mockContext: ResearchContext = {
  currentRules: { minNetWorth: 600000, minInvestment: 200000 },
  lastDrawDate: '2025-12-01',
}

const validResearchResult = {
  draws: [
    { draw_date: '2026-01-15', min_score: 130, invitations_issued: 25 },
  ],
  ruleChanges: [
    {
      field: 'minNetWorth',
      oldValue: '600000',
      newValue: '800000',
      source: 'https://example.com/update',
    },
  ],
  statusChanges: [],
  notes: 'Program requirements updated in January 2026.',
}

describe('researchProgram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns structured research results on success', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(validResearchResult) }],
    })

    const result = await researchProgram('bc-entrepreneur-base', mockContext)

    expect(result).not.toBeNull()
    expect(result!.draws).toHaveLength(1)
    expect(result!.draws[0].draw_date).toBe('2026-01-15')
    expect(result!.draws[0].min_score).toBe(130)
    expect(result!.ruleChanges).toHaveLength(1)
    expect(result!.ruleChanges[0].field).toBe('minNetWorth')
    expect(result!.statusChanges).toHaveLength(0)
    expect(result!.notes).toBe('Program requirements updated in January 2026.')

    expect(mockCreate).toHaveBeenCalledOnce()
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
      })
    )
  })

  it('returns null on API failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'))

    const result = await researchProgram('bc-entrepreneur-base', mockContext)

    expect(result).toBeNull()
  })

  it('returns null when response has no text block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [],
    })

    const result = await researchProgram('bc-entrepreneur-base', mockContext)

    expect(result).toBeNull()
  })

  it('returns null when response is invalid JSON', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not valid json' }],
    })

    const result = await researchProgram('bc-entrepreneur-base', mockContext)

    expect(result).toBeNull()
  })
})
