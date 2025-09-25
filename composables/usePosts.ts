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

interface QueryChain<T> {
  where?(cond: Record<string, unknown>): QueryChain<T>
  sort?(sorter: Record<string, 1 | -1>): QueryChain<T>
  only?<K extends keyof T & string>(keys: K[]): QueryChain<Pick<T, K>>
  limit?(n: number): QueryChain<T>
  find?(): Promise<T[]>
}

type QueryContentFn = (path?: string) => QueryChain<any>

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

// Stable YYYY-MM-DD regardless of host timezone
export function formatDate(d?: string): string {
  if (!d) return ''
  // If already like YYYY-MM-DD..., trust and slice
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

export async function fetchPosts(opts?: { limit?: number }): Promise<PostListItem[]> {
  try {
    const qc: QueryContentFn | undefined = (globalThis as { queryContent?: QueryContentFn })
      .queryContent
    if (!qc) return []
    let chain: any = qc('/blog')
    if (!chain || !chain.where || !chain.find) return []
    if (chain.only)
      chain = chain.only(['_path', 'title', 'description', 'date', 'tags', 'draft', 'published'])
    if (chain.where) chain = chain.where({ draft: { $ne: true } })
    if (chain.where)
      chain = chain.where({ $or: [{ published: true }, { published: { $exists: false } }] })
    if (chain.sort) chain = chain.sort({ date: -1 })
    if (opts?.limit && chain.limit) chain = chain.limit(opts.limit)
    let list: any[]
    try {
      list = await chain.find()
    } catch {
      return []
    }
    if (!Array.isArray(list)) return []
    return list.map(p => ({ ...p, slug: p.slug ?? slugFromPath(p._path) }))
  } catch {
    return []
  }
}
