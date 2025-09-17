// scripts/gen-meta.mjs
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BASE_URL =
  (process.env.NUXT_PUBLIC_SITE_URL && process.env.NUXT_PUBLIC_SITE_URL.trim()) ||
  'https://example.com'
const ROUTES = ['/', '/tools/cron-jst', '/tools/jwt-decode']

const outDir = 'public'
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

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
