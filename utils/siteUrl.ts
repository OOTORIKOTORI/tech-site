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

// Build absolute URL from a path or URL string.
// If `pathOrUrl` is already absolute, it is returned as-is.
// Otherwise, it is joined to the resolved site origin.
export function siteUrl(pathOrUrl?: string | null, event?: H3Event): string {
  const origin = resolveSiteUrl(event).replace(/\/$/, '')
  const input = (pathOrUrl ?? '').toString()
  try {
    // already absolute
    // eslint-disable-next-line no-new
    if (input) new URL(input)
    if (input) return input
  } catch {
    // fallthrough to join with origin
  }
  const p = input && input.trim().length ? (input.startsWith('/') ? input : `/${input}`) : '/'
  return `${origin}${p}`
}
