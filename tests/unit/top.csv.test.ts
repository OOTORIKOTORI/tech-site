import { describe, it, expect } from 'vitest'
import { snapshotsToCSV } from '@/utils/top/csv'
import type { TopSnapshot } from '@/types/top'

describe('snapshotsToCSV', () => {
  it('emits header + rows and consistent columns', () => {
    const snaps: TopSnapshot[] = [
      {
        ts: '2025-01-01 10:00:00',
        load: { one: 0.1, five: 0.2, fifteen: 0.3 },
        cpu: { us: 1, sy: 2, ni: 0, id: 97, wa: 0, hi: 0, si: 0, st: 0 },
        mem: {
          total: 1000,
          used: 200,
          free: 800,
          buff: 10,
          cache: 20,
          swapTotal: 500,
          swapUsed: 0,
        },
      },
      {
        ts: '2025-01-01 10:00:05',
        load: { one: 0.2, five: 0.2, fifteen: 0.3 },
        cpu: { us: 3, sy: 4, ni: 0, id: 93 },
        mem: { total: 1000, used: 250, free: 750 },
      },
    ]
    const csv = snapshotsToCSV(snaps)
    const lines = csv.trim().split(/\r?\n/)
    expect(lines.length).toBe(1 + snaps.length)
    const widths = lines.map(l => l.split(',').length)
    expect(new Set(widths).size).toBe(1) // all same columns
    expect(lines[0]).toMatch(/^ts,load1,load5,load15/)
  })
})
