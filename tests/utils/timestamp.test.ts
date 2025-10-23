import { describe, it, expect } from 'vitest'
import {
  detectUnitByLength,
  epochToDate,
  dateToEpoch,
  formatInTZ,
  parseDateTimeLocal,
} from '@/utils/timestamp'

describe('utils/timestamp: unit detection', () => {
  it('detects seconds (10 digits) and milliseconds (13 digits)', () => {
    expect(detectUnitByLength('1700000000')).toBe('s')
    expect(detectUnitByLength('1700000000000')).toBe('ms')
  })
})

describe('utils/timestamp: epoch -> date (UTC/JST)', () => {
  it('epoch seconds -> correct UTC and JST representation', () => {
    const d = epochToDate(0, 's')!
    expect(d).toBeInstanceOf(Date)
    // UTCは1970-01-01 00:00:00
    expect(d.toISOString()).toBe('1970-01-01T00:00:00.000Z')
    // JST表示は+9h
    const jst = formatInTZ(d, 'Asia/Tokyo')
    // 1970/01/01 09:00:00 となる（0埋めあり）
    expect(jst).toMatch(/1970\/01\/01\s09:00:00/)
  })

  it('epoch milliseconds -> same instant', () => {
    const ms = 1700000000000
    const d = epochToDate(ms, 'ms')!
    expect(Math.floor(d.getTime() / 1000)).toBe(1700000000)
  })
})

describe('utils/timestamp: date -> epoch (UTC/JST input)', () => {
  it('parse datetime-local as JST and convert to epoch', () => {
    const d = parseDateTimeLocal('2025-01-01T00:00', 'Asia/Tokyo')!
    // JSTの 2025-01-01T00:00 は UTC の 2024-12-31T15:00
    expect(d.toISOString()).toBe('2024-12-31T15:00:00.000Z')
    expect(dateToEpoch(d, 's')).toBe(Math.floor(Date.UTC(2024, 11, 31, 15, 0, 0) / 1000))
  })

  it('parse datetime-local as UTC and convert to epoch', () => {
    const d = parseDateTimeLocal('2025-01-01T00:00', 'UTC')!
    expect(d.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    expect(dateToEpoch(d, 'ms')).toBe(Date.UTC(2025, 0, 1, 0, 0, 0))
  })
})
