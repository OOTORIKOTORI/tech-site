// Blog v2 listing API: returns {id, path} arrays only; always 200; errors[] optional
import { defineEventHandler } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

// Resilient Blog v2 listing API
// - Per-collection safe select to avoid column mismatch (e.g. docs missing "updated")
// - Never throws: returns 200 with arrays and optional errors
// - Minimal, connector-agnostic: no $exists / $regex

// Return types (map DB columns → API shape)

export default defineEventHandler(async event => {
  const errors: Array<{ collection: 'blog' | 'docs'; message: string }> = []

  let blogRows: unknown[] = []
  let docsRows: unknown[] = []

  try {
    // BLOG: never SELECT optional columns (e.g., "updated").
    // Fetch all columns and map in JS to avoid SQLite "no such column" errors.
    blogRows = await queryCollection(event, 'blog').all()
  } catch (e: unknown) {
    const err =
      e && typeof e === 'object' && 'message' in e ? (e as { message?: unknown }).message : e
    errors.push({ collection: 'blog', message: String(err ?? e) })
    blogRows = []
  }

  try {
    // DOCS: query only if content/docs exists
    const docsDir = resolve(process.cwd(), 'content', 'docs')
    if (existsSync(docsDir)) {
      docsRows = await queryCollection(event, 'docs').all()
    } else {
      docsRows = []
    }
  } catch (e: unknown) {
    const err =
      e && typeof e === 'object' && 'message' in e ? (e as { message?: unknown }).message : e
    errors.push({ collection: 'docs', message: String(err ?? e) })
    docsRows = []
  }

  // Helpers: title/description/updated normalization
  const humanizeTitle = (p: string): string => {
    const seg = (p || '').split('/').filter(Boolean).pop() || ''
    const t = seg.replace(/[-_]+/g, ' ').trim()
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Untitled'
  }
  const extractTextFromBody = (body: unknown): string => {
    // Try to walk nuxt/content AST-like structure
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
    const target = 140 // 120-160 の中庸
    return txt ? txt.slice(0, Math.max(120, Math.min(160, target))) : ''
  }
  const tryGetMtimeIso = (pathStr: string): string | undefined => {
    try {
      const contentRoot = resolve(process.cwd(), 'content')
      const rel = String(pathStr || '').replace(/^\/+/, '') // e.g. blog/hello-world
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
  const normRow = (x: unknown) => {
    const obj = x && typeof x === 'object' ? (x as Record<string, unknown>) : {}
    const id = String(obj['_id'] ?? obj['id'] ?? '')
    const path = String(obj['_path'] ?? obj['path'] ?? '')
    const title =
      typeof obj['title'] === 'string' && (obj['title'] as string).trim().length > 0
        ? (obj['title'] as string)
        : humanizeTitle(path)
    const date = typeof obj['date'] === 'string' ? (obj['date'] as string) : null
    const updated =
      (typeof obj['updated'] === 'string' && (obj['updated'] as string)) ||
      (date ?? undefined) ||
      tryGetMtimeIso(path) ||
      null
    const description = normalizeDesc(obj) || title
    const tagsRaw = obj['tags']
    const tags = Array.isArray(tagsRaw) ? (tagsRaw as unknown[]).map(v => String(v)) : []
    const ogRaw = obj['ogImage']
    const ogImage = typeof ogRaw === 'string' && ogRaw ? String(ogRaw) : null
    // tools-first additional fields
    const type = typeof obj['type'] === 'string' ? String(obj['type']) : undefined
    const tool = typeof obj['tool'] === 'string' ? String(obj['tool']) : undefined
    const audience = typeof obj['audience'] === 'string' ? String(obj['audience']) : undefined
    const visibility = typeof obj['visibility'] === 'string' ? String(obj['visibility']) : undefined
    const robots = typeof obj['robots'] === 'string' ? String(obj['robots']) : undefined
    return {
      id,
      path,
      title,
      description,
      date,
      updated,
      tags,
      ogImage,
      type,
      tool,
      audience,
      visibility,
      robots,
    }
  }

  const blog = (Array.isArray(blogRows) ? blogRows : []).map(normRow)
  const docs = (Array.isArray(docsRows) ? docsRows : []).map(normRow)
  const res: {
    blog: {
      id: string
      path: string
      title: string
      description: string
      date: string | null
      updated: string | null
      tags: string[]
      ogImage: string | null
      type?: string
      tool?: string
      audience?: string
      visibility?: string
      robots?: string
    }[]
    docs: {
      id: string
      path: string
      title: string
      description: string
      date: string | null
      updated: string | null
      tags: string[]
      ogImage: string | null
    }[]
    errors?: { collection: string; message: string }[]
  } = { blog, docs }
  if (errors.length > 0) res.errors = errors
  return res
})
