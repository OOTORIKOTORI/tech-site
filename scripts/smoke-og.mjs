// Simple smoke check for dynamic OGP endpoint
// Method: GET; Accept 200 or 302
// Origin: process.env.NUXT_PUBLIC_SITE_ORIGIN || 'https://migakiexplorer.jp'
// Retry: up to 6 retries (7 attempts total) every 30s

const ORIGIN = process.env.NUXT_PUBLIC_SITE_ORIGIN || 'https://migakiexplorer.jp'
const TARGET_URL = new URL('/api/og/hello.png', ORIGIN).href
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

    // 308/301 の場合、Location を正規化して1回だけ再試行
    if ((status === 308 || status === 301) && loc) {
      const redirectUrl = new URL(loc, ORIGIN).href
      console.log(`[smoke-og] following redirect to ${redirectUrl}`)
      const res2 = await fetch(redirectUrl, { method: 'GET', redirect: 'manual' })
      const status2 = res2.status
      const loc2 = res2.headers.get('location') || ''
      const fallback2 = res2.headers.get('x-og-fallback') || res2.headers.get('X-OG-Fallback') || ''
      console.log(
        `[smoke-og] redirect result status=${status2}` +
          `${loc2 ? ` location=${loc2}` : ''}` +
          `${fallback2 ? ` x-og-fallback=${fallback2}` : ''}`
      )
      if (status2 === 200 || status2 === 302) {
        console.log(`[smoke-og] OK: status=${status2} (after redirect)`)
        return true
      }
    }

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
  console.log(`[smoke-og] target=${TARGET_URL} origin=${ORIGIN}`)
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
