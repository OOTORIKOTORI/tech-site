import { useStorage } from '#imports'
import { defineEventHandler, setHeader } from 'h3'

const STORAGE_PRIORITY = ['assets:server', 'assets:public'] as const
const FILE_NAME = 'feed.xml'

function fallbackFeed(): string {
  const origin = (process.env.NUXT_PUBLIC_SITE_ORIGIN || 'https://migakiexplorer.jp').replace(
    /\/?$/,
    ''
  )
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>磨きエクスプローラー Blog</title><link>${origin}/blog</link><description>Migaki Explorer Blog Feed</description></channel></rss>`
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

  return fallbackFeed()
})
