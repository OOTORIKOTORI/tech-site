export interface PostListItem {
  _path: string
  title?: string
  description?: string
  date?: string
  slug: string
}

interface QueryChain<T> {
  where?(cond: Record<string, unknown>): QueryChain<T>
  sort(sorter: Record<string, 1 | -1>): QueryChain<T>
  only<K extends keyof T & string>(keys: K[]): QueryChain<Pick<T, K>>
  limit?(n: number): QueryChain<T>
  find(): Promise<T[]>
}

type QueryContentFn = (path?: string) => QueryChain<Omit<PostListItem, 'slug'>>

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

export async function fetchPosts(options: { limit?: number } = {}): Promise<PostListItem[]> {
  const qc: QueryContentFn | undefined = (globalThis as { queryContent?: QueryContentFn })
    .queryContent
  if (!qc) return []
  let chain = qc('/blog').only(['_path', 'title', 'description', 'date'])
  if (chain.where) {
    chain = chain.where({ draft: { $ne: true } })
    if (chain.where)
      chain = chain.where({ $or: [{ published: true }, { published: { $exists: false } }] })
  }
  chain = chain.sort({ date: -1 })
  if (options.limit && chain.limit) chain = chain.limit(options.limit)
  const list = await chain.find()
  if (!Array.isArray(list)) return []
  return list.map(p => ({ ...p, slug: slugFromPath(p._path) }))
}
