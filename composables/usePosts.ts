// NOTE: 必要時に動的 import で '#content' を解決

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

type SortOrder = 1 | -1
interface QueryChain<T> {
  only?(keys: string[]): QueryChain<T>
  where?(cond: Record<string, unknown>): QueryChain<T>
  sort?(sorter: Record<string, SortOrder>): QueryChain<T>
  limit?(n: number): QueryChain<T>
  find?(): Promise<T[]>
}

function slugFromPath(p: string) {
  const seg = p.split('/').filter(Boolean)
  return seg[seg.length - 1] || p.replaceAll('/', '-')
}

export async function fetchPosts(opts?: { limit?: number }): Promise<PostListItem[]> {
  // prefer global stub in tests; otherwise dynamic import
  let qc: unknown = (globalThis as unknown as { queryContent?: unknown }).queryContent
  if (typeof qc !== 'function') {
    // eslint-disable-next-line no-new-func
    const dynImport = new Function('s', 'return import(s)') as (s: string) => Promise<unknown>
    const mod = (await dynImport('#content')) as { queryContent?: (path?: string) => unknown }
    qc = mod.queryContent
  }
  if (typeof qc !== 'function') return []
  const qInit = (qc as (path?: string) => unknown)('/blog')
  let q = qInit as QueryChain<PostListItem>

  // フィールド最小に絞る
  q =
    ((q as QueryChain<PostListItem>)?.only?.([
      '_path',
      'title',
      'description',
      'date',
      'tags',
      'draft',
      'published',
      'slug',
    ]) as QueryChain<PostListItem>) ?? (q as QueryChain<PostListItem>)

  // 下書きだけ除外、published未指定も表示
  // Spec: draft != true AND (published == true OR published 未指定) / 未来日付は除外しない
  q = q?.where?.({ draft: { $ne: true } }) ?? q
  q = q?.where?.({ $or: [{ published: true }, { published: { $exists: false } }] }) ?? q
  q = q?.sort?.({ date: -1 }) ?? q
  if (opts?.limit) q = q?.limit?.(opts.limit) ?? q

  const list = await q?.find?.()
  if (!Array.isArray(list)) return []
  return list.map(p => ({ ...p, slug: p.slug ?? slugFromPath(p._path) }))
}
