/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineEventHandler } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Resilient Blog v2 listing API
// - Per-collection safe select to avoid column mismatch (e.g. docs missing "updated")
// - Never throws: returns 200 with arrays and optional errors
// - Minimal, connector-agnostic: no $exists / $regex

// Return types (map DB columns → API shape)
type BlogItem = {
  _path: string
  _id?: string
  title?: string
  description?: string
  date?: string
  updated?: string
  tags?: string[]
  draft?: boolean | string
  published?: boolean | string
}
type DocsItem = { _path: string; _id: string }

export type Blogv2ListResponse = {
  source: string
  blog: BlogItem[]
  docs: DocsItem[]
  errors?: Array<{ collection: 'blog' | 'docs'; message: string }>
}

export default defineEventHandler(async event => {
  const errors: Array<{ collection: 'blog' | 'docs'; message: string }> = []

  // truthy/falsy helpers (string-bool aware)
  const truthy = (v: any) => v === true || v === 'true'
  const falsy = (v: any) => v === false || v === 'false'

  let blogRows: any[] = []
  let docsRows: any[] = []

  try {
    // BLOG: never SELECT optional columns (e.g., "updated").
    // Fetch all columns and map in JS to avoid SQLite "no such column" errors.
    blogRows = await queryCollection(event, 'blog').all()
  } catch (e: any) {
    errors.push({ collection: 'blog', message: String(e?.message ?? e) })
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
  } catch (e: any) {
    errors.push({ collection: 'docs', message: String(e?.message ?? e) })
    docsRows = []
  }

  const mapBlog = (x: any): BlogItem => ({
    _path: x?.path,
    _id: x?.id,
    title: x?.title,
    description: x?.description,
    date: x?.date,
    updated: x?.updated,
    tags: Array.isArray(x?.tags) ? x.tags : undefined,
    draft: truthy(x?.draft) ? true : falsy(x?.draft) ? false : x?.draft,
    published: truthy(x?.published) ? true : falsy(x?.published) ? false : x?.published,
  })
  const mapDocs = (x: any): DocsItem => ({ _path: x?.path, _id: String(x?.id) })

  const res: Blogv2ListResponse = {
    source: 'content-nitro',
    blog: (Array.isArray(blogRows) ? blogRows : []).map(mapBlog),
    docs: (Array.isArray(docsRows) ? docsRows : []).map(mapDocs),
    ...(errors.length > 0 ? { errors } : {}),
  }

  return res
})
