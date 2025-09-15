import { describe, it, expect } from 'vitest'
import { parseCron, nextRuns } from '../../utils/cron'

describe('cron utils', () => {
  it('generates 5-min weekday runs in JST', () => {
    const spec = parseCron('*/5 9-18 * * 1-5')
    const base = new Date('2025-09-15T00:00:00.000Z') // Mon 9:00 JST
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 5)
    const iso = runs.map(d => d.toISOString())
    expect(iso).toEqual([
      '2025-09-15T00:00:00.000Z',
      '2025-09-15T00:05:00.000Z',
      '2025-09-15T00:10:00.000Z',
      '2025-09-15T00:15:00.000Z',
      '2025-09-15T00:20:00.000Z',
    ])
  })

  it('handles yearly new year 00:00 JST', () => {
    const spec = parseCron('0 0 1 1 *')
    const base = new Date('2025-08-01T00:00:00.000Z')
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 2)
    expect(runs[0]!).toBeInstanceOf(Date)
    expect(runs[0]!.toISOString()).toBe('2025-12-31T15:00:00.000Z')
    expect(runs[1]!.toISOString()).toBe('2026-12-31T15:00:00.000Z')
  })

  it('clips out-of-range fields instead of throwing', () => {
    const spec = parseCron('0 24 * * *') // hour 24 -> clipped to 23
    const base = new Date('2025-01-01T00:00:00.000Z')
    const runs = nextRuns(spec, base, 'UTC', 2)
    expect(runs[0]!.toISOString()).toBe('2025-01-01T23:00:00.000Z')
    expect(runs[1]!.toISOString()).toBe('2025-01-02T23:00:00.000Z')
  })

  // 1) from が分ちょうど → 包括開始
  it('includes from when exactly on tick', () => {
    const spec = parseCron('*/5 9-18 * * 1-5')
    const base = new Date('2025-09-15T09:00:00+09:00') // JST 9:00:00
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 3).map(d => d.toISOString())
    expect(runs[0]).toBe('2025-09-15T00:00:00.000Z') // 9:00 JST
    expect(runs[1]).toBe('2025-09-15T00:05:00.000Z')
    expect(runs[2]).toBe('2025-09-15T00:10:00.000Z')
  })

  // 2) from が秒付き → 切り上げ
  it('rounds up when from has seconds', () => {
    const spec = parseCron('*/5 * * * *')
    const base = new Date('2025-09-15T09:00:30+09:00') // 9:00:30 JST
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 1).map(d => d.toISOString())
    expect(runs[0]).toBe('2025-09-15T00:05:00.000Z') // 9:05 JST (*/5)
  })

  // 3) DOW: 0/7 日曜等価
  it('treats 0 and 7 as Sunday (DOW)', () => {
    const s0 = parseCron('0 0 * * 0')
    const s7 = parseCron('0 0 * * 7')
    const base = new Date('2025-09-15T00:00:00Z') // 月曜 UTC
    const r0 = nextRuns(s0, base, 'UTC', 1)[0]!
    const r7 = nextRuns(s7, base, 'UTC', 1)[0]!
    expect(r0.getDay()).toBe(0)
    expect(r7.getDay()).toBe(0)
  })

  // 4) 不可能スペックは空配列（または上限内で空）
  it('returns [] for impossible spec within search cap', () => {
    const spec = parseCron('0 0 31 4 *') // 4月31日は存在しない
    const base = new Date('2025-04-01T00:00:00Z')
    const runs = nextRuns(spec, base, 'UTC', 1)
    expect(Array.isArray(runs)).toBe(true)
    expect(runs.length).toBe(0)
  })

  it('treats DOW 0 and 7 equivalently with comma list', () => {
    const spec = parseCron('* * * * 0,7')
    const base = new Date('2025-09-14T14:59:00.000Z') // JST 23:59 (Sun)
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 3)
    const iso = runs.map(d => d.toISOString())
    expect(iso[0]).toBe('2025-09-14T14:59:00.000Z') // Sun 23:59 JST
    expect(iso[1]).toBe('2025-09-20T15:00:00.000Z') // Next Sun 00:00 JST
    expect(iso[2]).toBe('2025-09-20T15:01:00.000Z') // Next Sun 00:01 JST
  })

  it('accepts name ranges and is case-insensitive (JAN-MAR/2, MON-FRI)', () => {
    const spec = parseCron('* * * JAN-MAR/2 MON-FRI')
    expect(spec.month.values).toEqual([1, 3])
    expect(spec.dow.values).toEqual([1, 2, 3, 4, 5])
  })

  it('handles step-based minutes (*/5) from seconds-inclusive base per existing spec', () => {
    const spec = parseCron('*/5 * * * *')
    const base = new Date('2025-09-15T00:00:30.000Z') // JST 09:00:30
    const runs = nextRuns(spec, base, 'Asia/Tokyo', 2).map(d => d.toISOString())
    expect(runs[0]).toBe('2025-09-15T00:05:00.000Z')
    expect(runs[1]).toBe('2025-09-15T00:10:00.000Z')
  })

  it('starts DOM */5 from day 1 (1,6,11,...)', () => {
    const spec = parseCron('0 0 */5 * *')
    const base = new Date('2025-09-01T00:00:00.000Z')
    const runs = nextRuns(spec, base, 'UTC', 5).map(d => d.toISOString())
    expect(runs).toEqual([
      '2025-09-01T00:00:00.000Z',
      '2025-09-06T00:00:00.000Z',
      '2025-09-11T00:00:00.000Z',
      '2025-09-16T00:00:00.000Z',
      '2025-09-21T00:00:00.000Z',
    ])
  })

  it('dedupes mixed name and numeric DOW tokens (MON,1)', () => {
    const spec = parseCron('* * * * MON,1')
    expect(spec.dow.values).toEqual([1])
  })
})
