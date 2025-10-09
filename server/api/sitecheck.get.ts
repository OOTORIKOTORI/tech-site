import { defineEventHandler, getQuery, createError } from 'h3'

const textSafe = (s: string, max = 200_000) => s.slice(0, max)

export default defineEventHandler(async event => {
  const q = getQuery(event) as Record<string, string | string[] | undefined>
  const raw = (q.origin ?? q.url ?? '').toString().trim()
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Missing "origin"' })
  let origin: string
  try {
    origin = new URL(raw).origin
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid origin' })
  }

  const robotsUrl = `${origin}/robots.txt`
  const sitemapUrl = `${origin}/sitemap.xml`

  const robotsRes = await fetch(robotsUrl, { redirect: 'manual' })
  const robotsText = robotsRes.ok ? await robotsRes.text() : ''
  const robots = summarizeRobots(robotsText)

  const sitemapRes = await fetch(sitemapUrl, { redirect: 'manual' })
  const sitemapText = sitemapRes.ok ? await sitemapRes.text() : ''
  const { locs, hosts, hostOk } = summarizeSitemap(sitemapText, origin)

  return {
    ok: true,
    origin,
    robots: {
      url: robotsUrl,
      status: robotsRes.status,
      location: robotsRes.headers.get('location'),
      ...robots,
      raw: textSafe(robotsText, 50_000),
    },
    sitemap: {
      url: sitemapUrl,
      status: sitemapRes.status,
      location: sitemapRes.headers.get('location'),
      count: locs.length,
      hosts,
      hostOk,
      sample: locs.slice(0, 10),
      raw: textSafe(sitemapText, 50_000),
    },
  }
})

function summarizeRobots(txt: string) {
  const lines = txt.split(/\r?\n/).map(l => l.trim())
  // User-agent: * のセクションだけ見る（単純実装）
  let inStar = false
  let disallowAll = false
  let allowAll = false
  const sitemaps: string[] = []
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const [kRaw, vRaw] = line.split(':', 2)
    if (!kRaw || vRaw === undefined) continue
    const k = kRaw.trim().toLowerCase()
    const v = vRaw.trim()
    if (k === 'user-agent') {
      inStar = v === '*'
    } else if (k === 'disallow' && inStar) {
      if (v === '' || v === '/') disallowAll = v === '/'
      if (v === '') allowAll = true
    } else if (k === 'sitemap') {
      sitemaps.push(v)
    }
  }
  return { hasUserAgentAll: inStar, disallowAll, allowAll, sitemapsInRobots: sitemaps }
}

function summarizeSitemap(xml: string, origin: string) {
  const locs = Array.from(xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi))
    .map(m => m[1])
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
  const hosts = Array.from(
    new Set(
      locs
        .map(s => {
          try {
            return new URL(s).origin
          } catch {
            return ''
          }
        })
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
    )
  )
  const hostOk = hosts.length ? hosts.every(h => h === origin) : null
  return { locs, hosts, hostOk }
}
