import 'dotenv/config'
// scripts/gen-meta.mjs
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CHECK_ONLY = process.argv.includes('--check-only')
const urlFromEnv = process.env.NUXT_PUBLIC_SITE_URL && process.env.NUXT_PUBLIC_SITE_URL.trim()
const vercelEnv = process.env.VERCEL_ENV // 'production' | 'preview' | 'development'
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

function resolveBaseUrl() {
  let base
  if (vercelEnv === 'production') {
    base = urlFromEnv || 'https://kotorilab.jp'
  } else {
    base = vercelUrl || urlFromEnv || 'https://example.com'
  }
  try {
    const u = new URL(base)
    return u.origin
  } catch {
    return base
  }
}

const BASE_URL = resolveBaseUrl()
const ROUTES = ['/', '/tools/cron-jst', '/tools/jwt-decode']

const outDir = 'public'
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

function generate() {
  const now = new Date().toISOString()
  const urls = ROUTES.map(p => {
    const loc = `${BASE_URL}${p.replace(/\/+$/, '') || '/'}`
    return `<url><loc>${loc}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
  }).join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap, 'utf8')

  const robots = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`
  writeFileSync(join(outDir, 'robots.txt'), robots, 'utf8')

  console.log('[gen-meta] Wrote public/sitemap.xml and public/robots.txt for', BASE_URL)
}

function checkHosts() {
  let expectedHost
  try {
    expectedHost = new URL(BASE_URL).host
  } catch (err) {
    console.error(
      '[gen-meta] ERROR: Invalid base URL:',
      BASE_URL,
      err && err.message ? err.message : err
    )
    process.exit(1)
  }

  const robotsPath = join(outDir, 'robots.txt')
  const sitemapPath = join(outDir, 'sitemap.xml')
  if (!existsSync(robotsPath) || !existsSync(sitemapPath)) {
    console.error(
      '[gen-meta] ERROR: robots.txt or sitemap.xml not found. Expected at public/robots.txt and public/sitemap.xml'
    )
    process.exit(1)
  }

  const robotsTxt = readFileSync(robotsPath, 'utf8')
  const m = robotsTxt.match(/^Sitemap:\s*(\S+)/im)
  let robotsHost = '(not-found)'
  if (m && m[1]) {
    try {
      robotsHost = new URL(m[1]).host
    } catch {
      robotsHost = '(invalid-url)'
    }
  }

  const sitemapXml = readFileSync(sitemapPath, 'utf8')
  const locHosts = new Set()
  const re = /<loc>([^<]+)<\/loc>/g
  let match
  while ((match = re.exec(sitemapXml)) !== null) {
    try {
      const h = new URL(match[1]).host
      locHosts.add(h)
    } catch {
      locHosts.add('(invalid-url)')
    }
  }

  const uniqueLocHosts = Array.from(locHosts)
  const robotsOk = robotsHost === expectedHost
  const sitemapOk = uniqueLocHosts.length > 0 && uniqueLocHosts.every(h => h === expectedHost)

  if (!robotsOk || !sitemapOk) {
    if (!robotsOk) {
      console.error(
        '[gen-meta] ERROR: expected host =',
        expectedHost,
        'but got =',
        robotsHost,
        '(robots.txt Sitemap)'
      )
    }
    if (!sitemapOk) {
      console.error(
        '[gen-meta] ERROR: expected host =',
        expectedHost,
        'but got =',
        uniqueLocHosts.join(', '),
        '(sitemap.xml <loc>)'
      )
    }
    process.exit(1)
  }

  console.log('[gen-meta] OK: robots/sitemap host =', expectedHost)
}

if (CHECK_ONLY) {
  checkHosts()
} else {
  generate()
  checkHosts()
}
