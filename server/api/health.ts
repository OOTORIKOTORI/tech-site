import { defineEventHandler, setResponseHeader } from 'h3'
import { resolveSiteUrl } from '../../utils/siteUrl'

export default defineEventHandler(event => {
  const method = event.node?.req?.method?.toUpperCase() || 'GET'
  const payload = {
    ok: true,
    env: process.env.VERCEL_ENV,
    url: resolveSiteUrl(event),
  }
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  if (method === 'HEAD') {
    return null
  }
  return payload
})
