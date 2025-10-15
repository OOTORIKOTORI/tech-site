import type { TopSnapshot } from '@/types/top'

export const TOP_COLUMNS = [
  { key: 'ts', ja: '時刻', note: 'スナップショットの収集時刻', unit: '' },
  { key: 'load1', ja: 'ロード平均(1分)', note: '同時実行の目安', unit: '' },
  { key: 'load5', ja: 'ロード平均(5分)', note: '', unit: '' },
  { key: 'load15', ja: 'ロード平均(15分)', note: '', unit: '' },
  { key: 'cpu_us', ja: 'CPU(ユーザー)', note: 'ユーザ空間', unit: '%' },
  { key: 'cpu_sy', ja: 'CPU(システム)', note: 'カーネル', unit: '%' },
  { key: 'cpu_ni', ja: 'CPU(nice)', note: '低優先度', unit: '%' },
  { key: 'cpu_id', ja: 'CPU(アイドル)', note: '未使用', unit: '%' },
  { key: 'cpu_wa', ja: 'CPU(IO待ち)', note: 'I/O wait', unit: '%' },
  { key: 'cpu_hi', ja: 'CPU(ハード割込)', note: 'hardware irq', unit: '%' },
  { key: 'cpu_si', ja: 'CPU(ソフト割込)', note: 'software irq', unit: '%' },
  { key: 'cpu_st', ja: 'CPU(steal)', note: '仮想化で奪取', unit: '%' },
  { key: 'mem_total_kib', ja: 'メモリ合計(KiB)', note: '', unit: 'KiB' },
  { key: 'mem_used_kib', ja: 'メモリ使用中(KiB)', note: '', unit: 'KiB' },
  { key: 'mem_free_kib', ja: 'メモリ空き(KiB)', note: '', unit: 'KiB' },
  { key: 'mem_buff_kib', ja: 'バッファ(KiB)', note: 'buffer', unit: 'KiB' },
  { key: 'mem_cache_kib', ja: 'ページキャッシュ(KiB)', note: 'cache', unit: 'KiB' },
  { key: 'swap_total_kib', ja: 'スワップ合計(KiB)', note: '', unit: 'KiB' },
  { key: 'swap_used_kib', ja: 'スワップ使用中(KiB)', note: '', unit: 'KiB' },
] as const

export type HeaderLang = 'en' | 'ja'

function headerBy(lang: HeaderLang) {
  return TOP_COLUMNS.map(c => (lang === 'ja' ? c.ja : c.key)).join(',')
}

function rowFromSnapshot(s: TopSnapshot) {
  return [
    s.ts ?? '',
    s.load?.one ?? '',
    s.load?.five ?? '',
    s.load?.fifteen ?? '',
    s.cpu?.us ?? '',
    s.cpu?.sy ?? '',
    s.cpu?.ni ?? '',
    s.cpu?.id ?? '',
    s.cpu?.wa ?? '',
    s.cpu?.hi ?? '',
    s.cpu?.si ?? '',
    s.cpu?.st ?? '',
    s.mem?.total ?? '',
    s.mem?.used ?? '',
    s.mem?.free ?? '',
    s.mem?.buff ?? '',
    s.mem?.cache ?? '',
    s.mem?.swapTotal ?? '',
    s.mem?.swapUsed ?? '',
  ]
}

export function snapshotsToCSV(snaps: TopSnapshot[], lang: HeaderLang = 'en'): string {
  const body = snaps.map(rowFromSnapshot)
  const all = [headerBy(lang), ...body.map(cols => cols.map(String).join(','))]
  return all.join('\n')
}

export function downloadCSV(
  snaps: TopSnapshot[],
  filename = 'top_parsed.csv',
  lang: HeaderLang = 'en'
) {
  const csv = snapshotsToCSV(snaps, lang)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
