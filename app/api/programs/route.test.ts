import { describe, it, expect } from 'vitest'
import { GET, type ProgramInfo } from './route'

const VALID_CATEGORIES = ['main', 'regional', 'graduate', 'farm', 'strategic'] as const
const VALID_STATUSES = ['active', 'paused', 'closed', 'redesigning'] as const
const VALID_EOI_TYPES = ['points_ranked', 'first_come', 'intake_period', 'none'] as const

describe('GET /api/programs', () => {
  it('returns a JSON array with all 21 programs', async () => {
    const res = await GET()
    const data: ProgramInfo[] = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(21)
  })

  it('each program has all required fields with valid types', async () => {
    const res = await GET()
    const data: ProgramInfo[] = await res.json()

    for (const program of data) {
      expect(typeof program.id).toBe('string')
      expect(program.id.length).toBeGreaterThan(0)

      expect(typeof program.provinceCode).toBe('string')
      expect(program.provinceCode.length).toBeGreaterThanOrEqual(2)

      expect(typeof program.provinceName).toBe('string')
      expect(program.provinceName.length).toBeGreaterThan(0)

      expect(typeof program.streamName).toBe('string')
      expect(program.streamName.length).toBeGreaterThan(0)

      expect(VALID_CATEGORIES).toContain(program.category)
      expect(VALID_STATUSES).toContain(program.status)
      expect(VALID_EOI_TYPES).toContain(program.eoiType)

      expect(typeof program.hasPointsGrid).toBe('boolean')
    }
  })

  it('all 21 expected program IDs are present', async () => {
    const res = await GET()
    const data: ProgramInfo[] = await res.json()
    const ids = data.map((p) => p.id)

    const expectedIds = [
      'bc-entrepreneur-base',
      'bc-entrepreneur-regional',
      'bc-entrepreneur-strategic',
      'ab-rural-entrepreneur',
      'ab-graduate-entrepreneur',
      'ab-foreign-graduate',
      'ab-farm',
      'sk-entrepreneur',
      'sk-graduate-entrepreneur',
      'mb-entrepreneur',
      'mb-farm-investor',
      'on-entrepreneur',
      'nb-entrepreneurial',
      'nb-post-grad',
      'ns-entrepreneur',
      'ns-graduate-entrepreneur',
      'pei-work-permit',
      'nl-entrepreneur',
      'nl-graduate-entrepreneur',
      'nwt-business',
      'yk-business-nominee',
    ]

    for (const expectedId of expectedIds) {
      expect(ids).toContain(expectedId)
    }
  })

  it('program IDs are unique', async () => {
    const res = await GET()
    const data: ProgramInfo[] = await res.json()
    const ids = data.map((p) => p.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('sets proper cache headers', async () => {
    const res = await GET()
    const cacheControl = res.headers.get('Cache-Control')

    expect(cacheControl).toBe('public, s-maxage=3600, stale-while-revalidate=86400')
  })

  it('programs with hasPointsGrid=true have eoiType points_ranked', async () => {
    const res = await GET()
    const data: ProgramInfo[] = await res.json()

    const withGrid = data.filter((p) => p.hasPointsGrid)
    for (const program of withGrid) {
      expect(program.eoiType).toBe('points_ranked')
    }
  })

  it('contains correct status for specific programs', async () => {
    const res = await GET()
    const data: ProgramInfo[] = await res.json()

    const skEntrepreneur = data.find((p) => p.id === 'sk-entrepreneur')
    expect(skEntrepreneur?.status).toBe('closed')

    const skGraduate = data.find((p) => p.id === 'sk-graduate-entrepreneur')
    expect(skGraduate?.status).toBe('closed')

    const onEntrepreneur = data.find((p) => p.id === 'on-entrepreneur')
    expect(onEntrepreneur?.status).toBe('redesigning')

    const bcBase = data.find((p) => p.id === 'bc-entrepreneur-base')
    expect(bcBase?.status).toBe('active')
  })
})
