import { defineEventHandler, getRequestURL, setHeader, sendRedirect } from '#imports'

export const runtime = 'node'

export default defineEventHandler(event => {
  const origin = getRequestURL(event).origin
  const loc = `${origin}/og-default.png`
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-OG-Fallback', '1')
  return sendRedirect(event, loc, 302)
})
