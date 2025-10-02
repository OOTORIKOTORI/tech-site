// /blog/[...slug] の記事解決ロジックを純粋関数化
export type BlogDoc = {
  _path: string
  _id?: string
  title?: string
  body?: unknown
  _type?: string
}

export function resolveBlogDoc(routePath: string, docs: BlogDoc[]): BlogDoc | null {
  // クエリ/ハッシュのみ除去
  const qidx = routePath.indexOf('?')
  const hidx = routePath.indexOf('#')
  const cut = (idx: number) => (idx >= 0 ? routePath.slice(0, idx) : routePath)
  const withoutQuery = cut(qidx)
  const reqPath = cut(hidx >= 0 ? hidx : -1 >= 0 ? hidx : -1).replace(/.*/, _ => withoutQuery)

  // 文字列完全一致のみ（大文字小文字や末尾スラの変更なし）
  const doc = docs.find(d => (d as any).path === reqPath || d._path === reqPath) || null
  // bodyが無ければ null
  if (!doc || !(doc as any).body) return null
  return doc
}
