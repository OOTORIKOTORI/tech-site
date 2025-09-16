import { describe, it, expect } from 'vitest'
import { parseCron, nextRuns } from '../../utils/cron'

describe('cron utils (dowDomMode)', () => {
  const base = new Date('2025-09-01T15:00:00.000Z') // 2025-09-02 00:00 JST (火曜)
  const tz = 'Asia/Tokyo' as const

  it('OR: dom=* / dow=1 → 月曜のみ', () => {
    const spec = parseCron('0 0 * * 1', { dowDomMode: 'OR' })
    const runs = nextRuns(spec, base, tz, 3)
    // 月曜のみ取得
    expect(
      runs.every(d => {
        const jstDate = new Date(d.getTime() + 9 * 3600000)
        return jstDate.getUTCDay() === 1
      })
    ).toBe(true)
  })

  it('OR: dom=1 / dow=* → 毎月1日のみ', () => {
    const spec = parseCron('0 0 1 * *', { dowDomMode: 'OR' })
    const runs = nextRuns(spec, base, tz, 3)
    expect(
      runs.every(d => {
        const jstDate = new Date(d.getTime() + 9 * 3600000)
        return jstDate.getUTCDate() === 1
      })
    ).toBe(true)
  })

  it('OR: dom=1 / dow=1 → 1日または月曜', () => {
    const spec = parseCron('0 0 1 * 1', { dowDomMode: 'OR' })
    const runs = nextRuns(spec, base, tz, 5)
    // 1日 or 月曜
    expect(
      runs.every(d => {
        const jstDate = new Date(d.getTime() + 9 * 3600000)
        return jstDate.getUTCDate() === 1 || jstDate.getUTCDay() === 1
      })
    ).toBe(true)
  })

  it('AND: dom=1 / dow=1 → 1日かつ月曜のみ', () => {
    const spec = parseCron('0 0 1 * 1', { dowDomMode: 'AND' })
    const runs = nextRuns(spec, base, tz, 3)
    // 1日かつ月曜
    expect(
      runs.every(d => {
        const jstDate = new Date(d.getTime() + 9 * 3600000)
        return jstDate.getUTCDate() === 1 && jstDate.getUTCDay() === 1
      })
    ).toBe(true)
  })

  it("AND: dom=* / dow=1 → 月曜のみ（'*'は常時true）", () => {
    const spec = parseCron('0 0 * * 1', { dowDomMode: 'AND' })
    const runs = nextRuns(spec, base, tz, 3)
    expect(
      runs.every(d => {
        const jstDate = new Date(d.getTime() + 9 * 3600000)
        return jstDate.getUTCDay() === 1
      })
    ).toBe(true)
  })
})
