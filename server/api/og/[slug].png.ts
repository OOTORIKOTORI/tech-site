import { defineEventHandler, getRequestURL, setHeader, sendRedirect } from 'h3'
import type { H3Event } from 'h3'

export const runtime = 'node'

export default defineEventHandler((event: H3Event) => {
  const origin = getRequestURL(event).origin
  const loc = `${origin}/og-default.png`
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-OG-Fallback', '1')
  return sendRedirect(event, loc, 302)
})
