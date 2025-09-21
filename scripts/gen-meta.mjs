import 'dotenv/config'
// scripts/gen-meta.mjs
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'

const CHECK_ONLY = process.argv.includes('--check-only')
const urlFromEnv = (
  process.env.NUXT_PUBLIC_SITE_ORIGIN ||
  process.env.NUXT_PUBLIC_SITE_URL ||
  ''
).trim()
const vercelEnv = process.env.VERCEL_ENV // 'production' | 'preview' | 'development'
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined

function resolveBaseUrl() {
  let base
  if (vercelEnv === 'production') {
    base = urlFromEnv || 'https://migakiexplorer.jp'
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

function readBlogRoutes() {
  const dir = 'content/blog'
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const slugs = entries
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => basename(e.name, '.md'))
  return slugs.map(s => `/blog/${s}`)
}

function extractYamlScalar(key, yamlBlock) {
  const re = new RegExp(`^${key}\\s*:\\s*(.*)$`, 'm')
  const m = yamlBlock.match(re)
  if (!m) return undefined
  let v = (m[1] || '').trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v
}

function readBlogFrontmatterDates() {
  const dir = 'content/blog'
  const map = Object.create(null)
  if (!existsSync(dir)) return map
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue
    const slug = basename(e.name, '.md')
    const raw = readFileSync(join(dir, e.name), 'utf8')
    // Find YAML frontmatter block delimited by --- ... --- at top
    const fmMatch = raw.match(/^---[\s\S]*?---/)
    if (!fmMatch) continue
    const yaml = fmMatch[0]
    const updated = extractYamlScalar('updated', yaml)
    const date = extractYamlScalar('date', yaml)
    const selected = updated || date
    if (!selected) continue
    const dt = new Date(selected)
    if (!isNaN(dt.getTime())) {
      map[slug] = dt.toISOString()
    }
  }
  return map
}

function readBlogFrontmatterMeta() {
  const dir = 'content/blog'
  const list = []
  if (!existsSync(dir)) return list
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue
    const slug = basename(e.name, '.md')
    const raw = readFileSync(join(dir, e.name), 'utf8')
    const fmMatch = raw.match(/^---[\s\S]*?---/)
    if (!fmMatch) continue
    const yaml = fmMatch[0]
    const title = extractYamlScalar('title', yaml)
    const description = extractYamlScalar('description', yaml)
    const dateStr = extractYamlScalar('date', yaml)
    let pubIso
    if (dateStr) {
      const dt = new Date(dateStr)
      if (!isNaN(dt.getTime())) pubIso = dt.toISOString()
    }
    if (title && pubIso) {
      list.push({ slug, title, description: description || '', pubIso })
    }
  }
  // sort by date desc
  list.sort((a, b) => (a.pubIso < b.pubIso ? 1 : a.pubIso > b.pubIso ? -1 : 0))
  return list
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const outDir = 'public'
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

function generate() {
  const now = new Date().toISOString()
  const blog = readBlogRoutes()
  const blogDates = readBlogFrontmatterDates()
  const blogMeta = readBlogFrontmatterMeta()
  const allRoutes = [...ROUTES, ...blog]
  const urls = allRoutes
    .map(p => {
      const loc = `${BASE_URL}${p.replace(/\/+$/, '') || '/'}`
      let lastmod = now
      if (p.startsWith('/blog/')) {
        const slug = p.slice('/blog/'.length)
        if (blogDates[slug]) lastmod = blogDates[slug]
      }
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    })
    .join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap, 'utf8')

  const robots = `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`
  writeFileSync(join(outDir, 'robots.txt'), robots, 'utf8')

  // Generate RSS feed for blog posts
  const channelTitle = '磨きエクスプローラー Blog'
  const channelLink = `${BASE_URL}/blog`
  const channelDesc = '磨きエクスプローラー Blog RSS'
  const items = blogMeta
    .map(({ slug, title, description, pubIso }) => {
      const link = `${BASE_URL}/blog/${slug}`
      const pubDate = new Date(pubIso).toUTCString()
      return `\n    <item><title>${xmlEscape(
        title
      )}</title><link>${link}</link><pubDate>${pubDate}</pubDate><description>${xmlEscape(
        description
      )}</description></item>`
    })
    .join('')
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${channelTitle}</title><link>${channelLink}</link><description>${channelDesc}</description>${items}\n</channel></rss>\n`
  writeFileSync(join(outDir, 'feed.xml'), rss, 'utf8')

  // success logging is only emitted at the end in checkHosts()
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

  console.log('[gen-meta] OK robots/sitemap host =', expectedHost)
}

if (CHECK_ONLY) {
  checkHosts()
} else {
  generate()
  checkHosts()
}
