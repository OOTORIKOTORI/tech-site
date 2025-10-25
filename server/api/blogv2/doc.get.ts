import { defineEventHandler, getQuery, createError } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async event => {
  const { path } = getQuery(event) as { path?: string }
  if (!path || typeof path !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'path required' })
  }
  // path は '/blog/...' 形式
  const doc = await queryCollection(event, 'blog').path(path).first()
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }
  // Normalize frontmatter on API layer
  const humanizeTitle = (p: string): string => {
    const seg = (p || '').split('/').filter(Boolean).pop() || ''
    const t = seg.replace(/[-_]+/g, ' ').trim()
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Untitled'
  }
  const extractTextFromBody = (body: unknown): string => {
    const pieces: string[] = []
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return
      const n = node as { value?: unknown; text?: unknown; children?: unknown; body?: unknown }
      if (typeof n.value === 'string') pieces.push(n.value)
      if (typeof n.text === 'string') pieces.push(n.text)
      const children = Array.isArray(n.children)
        ? (n.children as unknown[])
        : Array.isArray(n.body)
        ? (n.body as unknown[])
        : []
      for (const c of children) walk(c)
    }
    if (typeof body === 'string') return body
    walk(body)
    return pieces.join(' ')
  }
  const normalizeDesc = (obj: Record<string, unknown>): string => {
    const descRaw = obj['description']
    const bodyRaw = (obj as Record<string, unknown>)['body']
    const excerptRaw = (obj as Record<string, unknown>)['excerpt']
    const init =
      (typeof descRaw === 'string' && descRaw) ||
      extractTextFromBody(bodyRaw) ||
      (typeof excerptRaw === 'string' && excerptRaw) ||
      ''
    const txt = String(init)
      .replace(/[^\p{L}\p{N}\s.,、。!！?？-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const target = 140
    return txt ? txt.slice(0, Math.max(120, Math.min(160, target))) : ''
  }
  const tryGetMtimeIso = (pathStr: string): string | undefined => {
    try {
      const contentRoot = resolve(process.cwd(), 'content')
      const rel = String(pathStr || '').replace(/^\/+/, '')
      const p1 = resolve(contentRoot, rel + '.md')
      const p2 = resolve(contentRoot, rel, 'index.md')
      const file = existsSync(p1) ? p1 : existsSync(p2) ? p2 : undefined
      if (!file) return undefined
      const stat = statSync(file)
      return new Date(stat.mtime).toISOString()
    } catch {
      return undefined
    }
  }

  const obj = doc as unknown as Record<string, unknown>
  const id = String(obj['_id'] ?? obj['id'] ?? '')
  const _path = String(obj['_path'] ?? obj['path'] ?? path)
  const title =
    typeof obj['title'] === 'string' && (obj['title'] as string).trim().length > 0
      ? (obj['title'] as string)
      : humanizeTitle(_path)
  const date = typeof obj['date'] === 'string' ? (obj['date'] as string) : null
  const updated =
    (typeof obj['updated'] === 'string' && (obj['updated'] as string)) ||
    (date ?? undefined) ||
    tryGetMtimeIso(_path) ||
    null
  const description = normalizeDesc(obj) || title
  const tagsRaw = obj['tags']
  const tags = Array.isArray(tagsRaw) ? (tagsRaw as unknown[]).map(v => String(v)) : []
  const ogRaw = obj['ogImage']
  const ogImage = typeof ogRaw === 'string' && ogRaw ? String(ogRaw) : null
  const robotsValue = typeof obj['robots'] === 'string' ? (obj['robots'] as string) : undefined
  // tools-first additional fields
  const type = typeof obj['type'] === 'string' ? String(obj['type']) : undefined
  const tool = typeof obj['tool'] === 'string' ? String(obj['tool']) : undefined
  const audience = typeof obj['audience'] === 'string' ? String(obj['audience']) : undefined
  const visibility = typeof obj['visibility'] === 'string' ? String(obj['visibility']) : undefined

  // Return unified shape along with original body for rendering
  return {
    id,
    path: _path,
    title,
    description,
    date,
    updated,
    tags,
    ogImage,
    robots: robotsValue,
    type,
    tool,
    audience,
    visibility,
    // keep rest for ContentRenderer compatibility
    body: (obj as Record<string, unknown>)['body'],
  }
})
