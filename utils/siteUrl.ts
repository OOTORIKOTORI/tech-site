import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

export function resolveSiteUrl(event?: H3Event): string {
  const ve = process.env.VERCEL_ENV
  const fromEnv = process.env.NUXT_PUBLIC_SITE_URL || ''
  const fromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

  if (ve === 'production') {
    return fromEnv || 'https://kotorilab.jp'
  }

  if (event) {
    try {
      const url = getRequestURL(event)
      if (url && url.origin && url.origin !== 'null') return url.origin
    } catch {
      // ignore
    }
  }

  return fromVercel || fromEnv || 'http://localhost:3000'
}
