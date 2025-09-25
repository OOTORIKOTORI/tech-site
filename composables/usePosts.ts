// Lightweight content query wrapper WITHOUT importing from `#imports`.
// We resolve a globally exposed `queryContent` function at runtime if present.

export interface PostListItem {
  _path: string
  title?: string
  date?: string
  description?: string
  tags?: string[]
  draft?: boolean
  published?: boolean
  slug?: string
}

// Minimal chainable builder surface we rely on from Nuxt Content.
interface ContentQueryBuilder<T> {
  only(keys: string[]): ContentQueryBuilder<T>
  // Some test stubs omit where() so keep it optional.
  where?(condition: unknown): ContentQueryBuilder<T>
  sort(sort: Record<string, 1 | -1>): ContentQueryBuilder<T>
  limit(n: number): ContentQueryBuilder<T>
  find(): Promise<T[]>
}

type QueryContentFn = <T = unknown>(path?: string) => ContentQueryBuilder<T>

interface RawPost extends PostListItem {
  [k: string]: unknown
}

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

// Stable YYYY-MM-DD (UTC based)
export function formatDate(d?: string): string {
  if (!d) return ''
  const m = /^\d{4}-\d{2}-\d{2}/.exec(d)
  if (m) return m[0]
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

function slugFromPath(path: string): string {
  const seg = path.split('/').filter(Boolean)
  return seg[seg.length - 1] || path.replaceAll('/', '-')
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

function resolveQueryContent(): QueryContentFn | undefined {
  // Try to obtain from globalThis (SSR/CSR environments may differ).
  const g = globalThis as Record<string, unknown>
  const qc = g.queryContent as QueryContentFn | undefined
  return typeof qc === 'function' ? qc : undefined
}

export async function fetchPosts(opts?: { limit?: number }): Promise<PostListItem[]> {
  const qc = resolveQueryContent()
  if (!qc) return []
  try {
    let builder = qc<RawPost>('/blog').only([
      '_path',
      'title',
      'description',
      'date',
      'tags',
      'draft',
      'published',
      'slug',
    ])
    const maybeWhere = builder as { where?: (c: unknown) => typeof builder }
    if (typeof maybeWhere.where === 'function') {
      builder = maybeWhere.where({ draft: { $ne: true } })
      builder = maybeWhere.where({ $or: [{ published: true }, { published: { $exists: false } }] })
    }
    builder = builder.sort({ date: -1 })

    if (opts?.limit && Number.isFinite(opts.limit)) {
      builder = builder.limit(opts.limit)
    }

    let list: unknown
    try {
      list = await builder.find()
    } catch {
      return []
    }

    if (!Array.isArray(list)) return []
    const result: PostListItem[] = []
    for (const item of list) {
      if (!isObject(item)) continue
      const _path = typeof item._path === 'string' ? item._path : ''
      if (!_path) continue
      const post: PostListItem = {
        _path,
        title: typeof item.title === 'string' ? item.title : undefined,
        date: typeof item.date === 'string' ? item.date : undefined,
        description: typeof item.description === 'string' ? item.description : undefined,
        tags: Array.isArray(item.tags)
          ? (item.tags.filter(t => typeof t === 'string') as string[])
          : undefined,
        draft: typeof item.draft === 'boolean' ? item.draft : undefined,
        published: typeof item.published === 'boolean' ? item.published : undefined,
        slug: typeof item.slug === 'string' ? item.slug : undefined,
      }
      post.slug = post.slug || slugFromPath(post._path)
      result.push(post)
    }
    return result
  } catch {
    return []
  }
}
