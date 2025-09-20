// Simple smoke check for dynamic OGP endpoint
// Method: GET; Accept 200 or 302
// Base URL: process.env.SMOKE_URL || 'https://kotorilab.jp'
// Retry: up to 6 retries (7 attempts total) every 30s

const BASE_URL = process.env.SMOKE_URL || 'https://kotorilab.jp'
const TARGET_URL = new URL('/api/og/hello.png', BASE_URL).toString()
const MAX_RETRIES = 6
const ATTEMPTS = MAX_RETRIES + 1
const INTERVAL_MS = 30_000

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function tryOnce(attempt) {
  try {
    const res = await fetch(TARGET_URL, { method: 'GET', redirect: 'manual' })
    const status = res.status
    const loc = res.headers.get('location') || ''
    const fallback = res.headers.get('x-og-fallback') || res.headers.get('X-OG-Fallback') || ''
    console.log(
      `[smoke-og] attempt ${attempt}/${ATTEMPTS} status=${status}` +
        `${loc ? ` location=${loc}` : ''}` +
        `${fallback ? ` x-og-fallback=${fallback}` : ''}`
    )

    if (status === 200 || status === 302) {
      console.log(`[smoke-og] OK: status=${status}`)
      return true
    }
    // Non-OK status: try to read small snippet for diagnostics (ignore errors)
    try {
      const text = await res.text()
      const snippet = (text || '').slice(0, 128).replace(/\s+/g, ' ')
      console.log(`[smoke-og] body-snippet: ${snippet}`)
    } catch {}
  } catch (e) {
    console.log(`[smoke-og] attempt ${attempt}/${ATTEMPTS} request error: ${(e && e.message) || e}`)
  }
  return false
}

async function main() {
  for (let i = 1; i <= ATTEMPTS; i++) {
    const ok = await tryOnce(i)
    if (ok) return
    if (i < ATTEMPTS) {
      await sleep(INTERVAL_MS)
    }
  }
  console.error(
    `[smoke-og] ERROR: did not reach 200/302 after ${ATTEMPTS} attempts for ${TARGET_URL}`
  )
  process.exit(1)
}

// Node 18+ has global fetch
main()
