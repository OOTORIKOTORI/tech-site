import { parseCron, nextRuns } from './utils/cron.ts'

console.log('=== DOW 0/7 parse check ===')
const s0 = parseCron('0 9 * * 0')
const s7 = parseCron('0 9 * * 7')
console.log('s0.dow.values:', s0.dow.values)
console.log('s7.dow.values:', s7.dow.values)

const base = new Date('2025-01-06T00:00:00.000Z') // 2025-01-06(月)はMonday, 2025-01-05(日)はSunday
console.log('base.getUTCDay():', base.getUTCDay())
const prevSun = new Date('2025-01-05T09:00:00.000Z')
console.log('prevSun.getUTCDay():', prevSun.getUTCDay())

const r0 = nextRuns(s0, base, 'UTC', 1)
const r7 = nextRuns(s7, base, 'UTC', 1)
console.log('r0:', r0)
console.log('r7:', r7)
if (r0[0]) console.log('r0[0].getUTCDay():', r0[0].getUTCDay(), r0[0].toISOString())
if (r7[0]) console.log('r7[0].getUTCDay():', r7[0].getUTCDay(), r7[0].toISOString())
