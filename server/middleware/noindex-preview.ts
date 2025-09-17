// server/middleware/noindex-preview.ts
import { defineEventHandler, getRequestHeader, setResponseHeader } from 'h3'

export default defineEventHandler(event => {
  const host = (getRequestHeader(event, 'host') || '').toLowerCase()
  // Treat *.vercel.app as preview; production should be custom domain like kotorilab.jp
  const isPreview = host.endsWith('.vercel.app')
  if (isPreview) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})
