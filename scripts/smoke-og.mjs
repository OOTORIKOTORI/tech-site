// Simple smoke check for dynamic OGP endpoint
// Pass if GET /api/og/hello.png returns 200
// or 302 redirect to /og-default.png

const base = (process.env.NUXT_PUBLIC_SITE_URL || 'https://kotorilab.jp').replace(/\/$/, '')
const url = `${base}/api/og/${encodeURIComponent('hello')}.png`

async function main() {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' })
    const status = res.status
    const loc = res.headers.get('location') || ''

    if (status === 200) {
      console.log(`[smoke-og] OK: 200 ${url}`)
      return
    }
    if (status === 302 && /\/og-default\.png($|\?)/.test(loc)) {
      console.log(`[smoke-og] OK: 302 -> ${loc}`)
      return
    }
    console.error(`[smoke-og] ERROR: unexpected status/location: status=${status} location=${loc}`)
    process.exit(1)
  } catch (e) {
    console.error(`[smoke-og] ERROR: request failed: ${(e && e.message) || e}`)
    process.exit(1)
  }
}

// Node 18+ has global fetch
main()
