import { parseCron, nextRuns } from './utils/cron.ts'

// テスト1: clips out-of-range fields
console.log('=== Test 1: out-of-range fields ===')
const spec1 = parseCron('0 25 1 1 1')
console.log('Parsed spec1:', JSON.stringify(spec1, null, 2))
const base1 = new Date('2025-01-01T00:00:00.000Z')
const runs1 = nextRuns(spec1, base1, 'UTC', 2)
console.log('Runs1:', runs1)

// テスト2: DOW 0 and 7
console.log('\n=== Test 2: DOW 0 and 7 ===')
const spec2_0 = parseCron('0 9 * * 0')
const spec2_7 = parseCron('0 9 * * 7')
console.log('Parsed spec2_0:', JSON.stringify(spec2_0, null, 2))
console.log('Parsed spec2_7:', JSON.stringify(spec2_7, null, 2))
const base2 = new Date('2025-01-06T00:00:00.000Z')
const runs2_0 = nextRuns(spec2_0, base2, 'UTC', 1)
const runs2_7 = nextRuns(spec2_7, base2, 'UTC', 1)
console.log('Runs2_0:', runs2_0)
console.log('Runs2_7:', runs2_7)
