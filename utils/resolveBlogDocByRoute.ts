// /blog/[...slug] の記事解決ロジック（テスト用最小仕様）
export type MinimalDoc = { _path?: string; path?: string; body?: unknown; [key: string]: unknown }
export type BlogDoc = MinimalDoc

export function resolveBlogDoc(reqPath: string, docs: MinimalDoc[]): MinimalDoc | null {
  // クエリ/ハッシュだけ除去（他の正規化はしない）
  const base = String(reqPath ?? '')
  const hashSplit = base.split('#')
  const beforeHash = (hashSplit.length > 0 ? hashSplit[0] : '') ?? ''
  const querySplit = String(beforeHash).split('?')
  const pathOnly = querySplit.length > 0 ? querySplit[0] : beforeHash
  const hit = docs.find(d => d._path === pathOnly || d.path === pathOnly) || null
  if (!hit) return null
  // 本文がなければ null（空文字や falsy も未定義として扱う）
  if (!('body' in hit) || !hit.body) return null
  return hit
}

export default resolveBlogDoc
