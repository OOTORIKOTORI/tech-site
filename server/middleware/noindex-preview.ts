// server/middleware/noindex-preview.ts
import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler(event => {
  const req = event.node?.req
  const rawHost = (req?.headers?.host ?? '').toString()
  const host = rawHost.toLowerCase()
  const isPreview = host.endsWith('.vercel.app')
  if (isPreview) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
  // Do not alter body or end response; applies to GET/HEAD safely
})
