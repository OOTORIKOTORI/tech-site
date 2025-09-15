import { parseCron, nextRuns } from './utils/cron'

const spec = parseCron('*/5 9-18 * * 1-5')
const base = new Date('2025-09-15T00:00:00.000Z') // Mon 9:00 JST
console.log('Starting test...')
const start = Date.now()
const runs = nextRuns(spec, base, 'Asia/Tokyo', 2)
const end = Date.now()
console.log(`Completed in ${end - start}ms`)
console.log(
  'Results:',
  runs.map(d => d.toISOString())
)
