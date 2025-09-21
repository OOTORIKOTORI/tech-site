import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

export type ResolveBy = 'env' | 'vercel' | 'request' | 'default'

export function resolveSiteUrlInfo(event?: H3Event): { url: string; by: ResolveBy } {
  const ve = process.env.VERCEL_ENV
  const envUrl = (
    process.env.NUXT_PUBLIC_SITE_ORIGIN ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    ''
  ).trim()
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

  if (ve === 'production') {
    if (envUrl) return { url: envUrl, by: 'env' }
    return { url: 'https://migakiexplorer.jp', by: 'default' }
  }

  if (event) {
    try {
      const url = getRequestURL(event)
      if (url && url.origin && url.origin !== 'null') return { url: url.origin, by: 'request' }
    } catch {
      // ignore
    }
  }

  if (vercelUrl) return { url: vercelUrl, by: 'vercel' }
  if (envUrl) return { url: envUrl, by: 'env' }
  return { url: 'http://localhost:3000', by: 'default' }
}

export function resolveSiteUrl(event?: H3Event): string {
  return resolveSiteUrlInfo(event).url
}
