import { useStorage } from '#imports'
import { defineEventHandler, setHeader } from 'h3'

const STORAGE_PRIORITY = ['assets:server', 'assets:public'] as const
const FILE_NAME = 'sitemap.xml'

function fallbackSitemap(): string {
  const origin = (process.env.NUXT_PUBLIC_SITE_ORIGIN || 'https://migakiexplorer.jp').replace(
    /\/?$/,
    ''
  )
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc><changefreq>weekly</changefreq><priority>0.7</priority></url></urlset>`
}

export default defineEventHandler(async event => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  for (const name of STORAGE_PRIORITY) {
    const storage = useStorage(name)
    const buf = await storage?.getItemRaw?.(FILE_NAME)
    if (buf && buf.length) {
      return buf.toString('utf8')
    }
  }

  return fallbackSitemap()
})
