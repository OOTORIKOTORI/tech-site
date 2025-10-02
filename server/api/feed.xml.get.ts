import { defineEventHandler, setHeader, getRequestURL } from 'h3'
import { ofetch } from 'ofetch'
import { useRuntimeConfig } from '#imports'

type Item = {
  id?: string
  path?: string
  title?: string
  description?: string
  date?: string | null
  updated?: string | null
}

const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export default defineEventHandler(async event => {
  const cfg = useRuntimeConfig()
  const pub = (cfg as unknown as { public?: Record<string, unknown> }).public || {}
  const ORIGIN = typeof pub['siteOrigin'] === 'string' ? (pub['siteOrigin'] as string) : ''

  // Fetch blog list from existing API
  const base = getRequestURL(event).origin
  const list = await ofetch<unknown>('/api/blogv2/list', { baseURL: base })
  const asObj = list && typeof list === 'object' ? (list as Record<string, unknown>) : {}
  const blog = Array.isArray(asObj['blog']) ? (asObj['blog'] as unknown[]) : []
  const legacy = Array.isArray(asObj['items']) ? (asObj['items'] as unknown[]) : []
  const items: Item[] = (blog.length > 0 ? blog : legacy)
    .map(x => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {}))
    .map(o => ({
      id: typeof o['id'] === 'string' ? (o['id'] as string) : undefined,
      path: typeof o['path'] === 'string' ? (o['path'] as string) : undefined,
      title: typeof o['title'] === 'string' ? (o['title'] as string) : undefined,
      description: typeof o['description'] === 'string' ? (o['description'] as string) : undefined,
      date: typeof o['date'] === 'string' ? (o['date'] as string) : null,
      updated: typeof o['updated'] === 'string' ? (o['updated'] as string) : null,
    }))

  // Sort newest first by updated/date
  const sorted = items
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated || b.date || '').getTime() -
        new Date(a.updated || a.date || '').getTime()
    )
    .slice(0, 20)

  const now = new Date().toISOString()

  const feedTitle = 'Migaki Explorer - Blog'
  const feedId = ORIGIN + '/'
  const feedLink = ORIGIN + '/feed.xml'
  const siteLink = ORIGIN + '/blog'

  const entries = sorted
    .map(it => {
      const title = escapeXml(String(it.title || it.path || 'Untitled'))
      const summary = escapeXml(String(it.description || ''))
      const linkHref = ORIGIN + String(it.path || '')
      const updated = it.updated || it.date || now
      const id = ORIGIN + String(it.path || '/' + (it.id || ''))
      return (
        `<entry>` +
        `<title>${title}</title>` +
        `<link href="${escapeXml(linkHref)}"/>` +
        `<id>${escapeXml(id)}</id>` +
        `<updated>${escapeXml(updated)}</updated>` +
        (summary ? `<summary>${summary}</summary>` : '') +
        `</entry>`
      )
    })
    .join('')

  const xml =
    '<?xml version="1.0" encoding="utf-8"?>' +
    `<feed xmlns="http://www.w3.org/2005/Atom">` +
    `<title>${escapeXml(feedTitle)}</title>` +
    `<id>${escapeXml(feedId)}</id>` +
    `<updated>${escapeXml(sorted[0]?.updated || sorted[0]?.date || now)}</updated>` +
    `<link rel="self" href="${escapeXml(feedLink)}"/>` +
    `<link href="${escapeXml(siteLink)}"/>` +
    entries +
    `</feed>`

  setHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8')
  return xml
})
