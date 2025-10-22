import { describe, it, expect } from 'vitest'
import { parseCron, humanizeCron, nextRuns } from '../../utils/cron'

describe('cron humanize & 6-field/alias', () => {
  it('humanize: 平日 9:00 for 0 9 * * 1-5', () => {
    const spec = parseCron('0 9 * * 1-5')
    expect(humanizeCron(spec)).toMatchSnapshot()
  })

  it('alias: @hourly -> 0 * * * *', () => {
    const spec = parseCron('@hourly')
    expect(humanizeCron(spec)).toMatchSnapshot()
    // 次回計算（UTC基準）
    const base = new Date('2025-01-01T00:30:00.000Z')
    const runs = nextRuns(spec, base, 'UTC', 2).map(d => d.toISOString())
    expect(runs).toMatchSnapshot()
  })

  it('6-field: 30 0 9 * * 1 (Mon 09:00:30)', () => {
    const spec = parseCron('30 0 9 * * 1')
    expect(humanizeCron(spec)).toMatchSnapshot()
    const base = new Date('2025-01-06T08:59:50.000Z') // Mon 17:59:50 JST
    const next = nextRuns(spec, base, 'UTC', 3).map(d => d.toISOString())
    expect(next).toMatchSnapshot()
  })
})
