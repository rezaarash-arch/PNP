import { getAnthropicClient } from './client'

export interface ResearchResult {
  draws: { draw_date: string; min_score: number | null; invitations_issued: number | null }[]
  ruleChanges: { field: string; oldValue: string; newValue: string; source: string }[]
  statusChanges: { newStatus: 'active' | 'paused' | 'closed' | 'redesigning'; reason: string; source: string }[]
  notes: string
}

export interface ResearchContext {
  currentRules: Record<string, unknown>
  lastDrawDate: string | null
}

const SYSTEM_PROMPT = `You are a Canadian Provincial Nominee Program (PNP) research assistant.
Your job is to report ONLY verifiable facts about PNP program updates.
Do NOT speculate or infer. Only include information you can attribute to an official source.

Respond with strict JSON matching this schema (no markdown, no wrapping):
{
  "draws": [{ "draw_date": "YYYY-MM-DD", "min_score": <number|null>, "invitations_issued": <number|null> }],
  "ruleChanges": [{ "field": "<field_name>", "oldValue": "<old>", "newValue": "<new>", "source": "<url_or_description>" }],
  "statusChanges": [{ "newStatus": "active"|"paused"|"closed"|"redesigning", "reason": "<reason>", "source": "<url_or_description>" }],
  "notes": "<any additional context>"
}

If there are no updates, return empty arrays and an empty notes string.`

/**
 * Research a specific PNP program for recent updates using Claude.
 * Returns structured research results, or null on failure.
 */
export async function researchProgram(
  programId: string,
  context: ResearchContext
): Promise<ResearchResult | null> {
  try {
    const client = getAnthropicClient()

    const userPrompt = `Research the Canadian PNP program with ID: "${programId}".

Current rules snapshot: ${JSON.stringify(context.currentRules)}
Last known draw date: ${context.lastDrawDate ?? 'unknown'}

Report any new draws, rule changes, or status changes since the last known draw date.
Return ONLY valid JSON matching the required schema.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return null

    const parsed = JSON.parse(textBlock.text) as ResearchResult
    return parsed
  } catch (err) {
    console.error(`Research failed for ${programId}:`, err)
    return null
  }
}
