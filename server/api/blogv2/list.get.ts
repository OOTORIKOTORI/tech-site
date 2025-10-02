// Blog v2 listing API: returns {id, path} arrays only; always 200; errors[] optional
import { defineEventHandler } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'
import { existsSync } from 'node:fs'
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

  // id/path のみ返す
  const mapBlog = (x: unknown) => {
    if (x && typeof x === 'object') {
      const obj = x as Record<string, unknown>
      return {
        id: String(obj._id ?? obj.id ?? ''),
        path: String(obj._path ?? obj.path ?? ''),
      }
    }
    return { id: '', path: '' }
  }
  const mapDocs = (x: unknown) => {
    if (x && typeof x === 'object') {
      const obj = x as Record<string, unknown>
      return {
        id: String(obj._id ?? obj.id ?? ''),
        path: String(obj._path ?? obj.path ?? ''),
      }
    }
    return { id: '', path: '' }
  }
  const blog = (Array.isArray(blogRows) ? blogRows : []).map(mapBlog)
  const docs = (Array.isArray(docsRows) ? docsRows : []).map(mapDocs)
  const res: {
    blog: { id: string; path: string }[]
    docs: { id: string; path: string }[]
    errors?: { collection: string; message: string }[]
  } = { blog, docs }
  if (errors.length > 0) res.errors = errors
  return res
})
