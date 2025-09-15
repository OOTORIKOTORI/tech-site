import { parseCron, nextRuns } from '../utils/cron'

// 新年テスト
const spec = parseCron('0 0 1 1 *')
const base = new Date('2025-08-01T00:00:00.000Z')
const runs = nextRuns(spec, base, 'Asia/Tokyo', 2)

console.log('新年テスト:')
console.log('期待値: 2025-12-31T15:00:00.000Z (JST 2026-01-01 00:00)')
console.log('実際: ', runs[0]?.toISOString())
console.log('')

// UTC テスト
const spec2 = parseCron('0 24 * * *') // hour 24 -> clipped to 23
const base2 = new Date('2025-01-01T00:00:00.000Z')
const runs2 = nextRuns(spec2, base2, 'UTC', 2)

console.log('UTC テスト:')
console.log('期待値: 2025-01-01T23:00:00.000Z')
console.log('実際: ', runs2[0]?.toISOString())

// デバッグ
console.log('')
console.log('UTC 2025-12-31T15:00:00.000Z in JST:')
const utcDate = new Date('2025-12-31T15:00:00.000Z')
console.log('UTC時刻:', utcDate.toISOString())
console.log(
  'JST時刻:',
  new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(utcDate)
)
