import { describe, it, expect } from 'vitest'
import { parseCron, nextRuns } from '../../utils/cron'

describe('cron utils (extra checks)', () => {
  it('parseCron returns unified fields (*/15 9-18 * * 1-5)', () => {
    const spec = parseCron('*/15 9-18 * * 1-5')
    expect(spec.minute.values).toEqual([0, 15, 30, 45])
    expect(spec.hour.values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(spec.dom.values.length).toBe(31)
    expect(spec.dom.values[0]).toBe(1)
    expect(spec.dom.values[30]).toBe(31)
    expect(spec.month.values.length).toBe(12)
    expect(spec.month.values[0]).toBe(1)
    expect(spec.month.values[11]).toBe(12)
    expect(spec.dow.values).toEqual([1, 2, 3, 4, 5])
  })

  it('*/30 23 * * 0 from 2025-09-14T22:59+09:00 yields 23:00 and 23:30 JST', () => {
    const spec = parseCron('*/30 23 * * 0')
    const base = new Date('2025-09-14T22:59:00+09:00')
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 2)
    const iso = runs.map(d => d.toISOString())
    expect(iso[0]).toBe('2025-09-14T14:00:00.000Z') // 23:00 JST
    expect(iso[1]).toBe('2025-09-14T14:30:00.000Z') // 23:30 JST
  })

  it('range step endpoint includes boundaries (*/5 minutes)', () => {
    const spec = parseCron('*/5 9-18 * * 1-5')
    expect(spec.minute.values).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
  })

  it('invalid step throws (*/0)', () => {
    expect(() => parseCron('*/0 * * * *')).toThrow()
  })

  it('nonexistent DOM is skipped (Feb 31 -> Mar 31) with month wildcard', () => {
    const spec = parseCron('0 0 31 * *')
    const base = new Date('2025-02-01T00:00:00.000Z')
    const run = nextRuns(spec, base, 'UTC', 1)[0]
    expect(run!.toISOString()).toBe('2025-03-31T00:00:00.000Z')
  })

  it('dow out of range (7) is error', () => {
    expect(() => parseCron('* * * * 7')).toThrow()
  })
})
