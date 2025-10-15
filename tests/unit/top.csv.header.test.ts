import { describe, it, expect } from 'vitest'
import { snapshotsToCSV } from '@/utils/top/csv'
import type { TopSnapshot } from '@/types/top'

const sample: TopSnapshot[] = [{ ts: '2025-01-01 10:00:00' }]

describe('snapshotsToCSV header language', () => {
  it('emits English header by default', () => {
    const csv = snapshotsToCSV(sample)
    expect(csv.split(/\r?\n/)[0]).toBe(
      'ts,load1,load5,load15,cpu_us,cpu_sy,cpu_ni,cpu_id,cpu_wa,cpu_hi,cpu_si,cpu_st,mem_total_kib,mem_used_kib,mem_free_kib,mem_buff_kib,mem_cache_kib,swap_total_kib,swap_used_kib'
    )
  })
  it('emits Japanese header when lang=ja', () => {
    const csv = snapshotsToCSV(sample, 'ja')
    const firstLine = csv.split(/\r?\n/)[0] ?? ''
    expect(firstLine.startsWith('時刻,ロード平均(1分),ロード平均(5分)')).toBe(true)
  })
})
