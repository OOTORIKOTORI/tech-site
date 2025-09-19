import { defineEventHandler, setResponseHeader } from 'h3'
import { resolveSiteUrlInfo } from '../../utils/siteUrl'

export default defineEventHandler(event => {
  const method = event.node?.req?.method?.toUpperCase() || 'GET'
  const host = event.node?.req?.headers?.host || ''
  const info = resolveSiteUrlInfo(event)
  const payload = {
    ok: true,
    env: process.env.VERCEL_ENV,
    url: info.url,
    host,
    by: info.by,
  }
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  if (method === 'HEAD') {
    return null
  }
  return payload
})
