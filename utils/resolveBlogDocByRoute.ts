// /blog/[...slug] の記事解決ロジックを純粋関数化
export type BlogDoc = {
  _path: string
  _id?: string
  title?: string
  body?: unknown
  _type?: string
}

export function resolveBlogDoc(routePath: string, docs: BlogDoc[]): BlogDoc | null {
  const raw = decodeURI(routePath)
  const norm = raw.replace(/\/+$/, '')
  const candidates = Array.from(
    new Set([norm, norm + '/', norm.toLowerCase(), (norm + '/').toLowerCase()])
  )
  // 厳密一致
  let doc = docs.find(d => candidates.includes(d._path)) ?? null
  // 厳密一致でなければ、body有り最長_path優先
  if (!doc) {
    const filtered = docs.filter(d => d._type === 'markdown' || d.body)
    doc = filtered.sort((a, b) => (b._path?.length ?? 0) - (a._path?.length ?? 0))[0] ?? null
  }
  // bodyがなければnull
  if (!doc || typeof doc.body === 'undefined' || !doc.body) return null
  return doc
}
