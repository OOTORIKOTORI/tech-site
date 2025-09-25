// NOTE: '#content' 直 import を避け、globalThis.queryContent (tests でスタブ) に依存。
// ビルド時型エラー回避のため最低限の any 利用。

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qc: any = (globalThis as any).queryContent
  if (typeof qc !== 'function') return []
  let q = qc('/blog') as QueryChain<PostListItem>

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
