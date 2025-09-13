import { describe, it, expect } from 'vitest'
import { parseCron, nextRuns } from '../../utils/cron'

describe('parseCron', () => {
  it('正常: */15 9-18 * * 1-5', () => {
    const spec = parseCron('*/15 9-18 * * 1-5')
    expect(spec.minute).toEqual([0, 15, 30, 45])
    expect(spec.hour).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(spec.dom).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
    expect(spec.month).toEqual(Array.from({ length: 12 }, (_, i) => i + 1))
    expect(spec.dow).toEqual([1, 2, 3, 4, 5])
  })
  it('異常: フィールド数不足', () => {
    expect(() => parseCron('0 0 * *')).toThrow('フィールド数が5つではありません')
  })
  it('異常: 範囲外', () => {
    expect(() => parseCron('0 25 * * *')).toThrow('フィールド2の範囲「25」が不正です')
  })
})

describe('nextRuns', () => {
  it('正常: 0 0 1 1 * (元日0時)', () => {
    const spec = parseCron('0 0 1 1 *')
    const runs = nextRuns(spec, new Date('2025-01-01T00:00:00+09:00'), 'Asia/Tokyo', 2)
    expect(runs[0].toISOString()).toBe('2025-12-31T15:00:00.000Z') // 2026-01-01 00:00 JST
    expect(runs[1].toISOString()).toBe('2026-12-31T15:00:00.000Z') // 2027-01-01 00:00 JST
  })
  it('正常: */30 23 * * 0 (日曜23時)', () => {
    const spec = parseCron('*/30 23 * * 0')
    const runs = nextRuns(spec, new Date('2025-09-14T22:59:00+09:00'), 'Asia/Tokyo', 2)
    expect(runs[0].toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false })).toContain(
      '2025/9/14 23:00:00'
    )
    expect(runs[1].toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false })).toContain(
      '2025/9/14 23:30:00'
    )
  })
  it('異常: tz不正', () => {
    const spec = parseCron('0 0 * * *')
    expect(() => nextRuns(spec, new Date(), 'UTC')).toThrow('Asia/Tokyoのみ対応')
  })
})
