// 公開判定関数: draft !== true && published !== false && internalタグを含まない（string型も解釈）
export function isVisiblePost(frontmatter: unknown): boolean {
  if (!frontmatter || typeof frontmatter !== 'object') return false
  const fm = frontmatter as {
    draft?: unknown
    published?: unknown
    tags?: unknown[] | string[]
  }
  const draft = fm.draft
  const published = fm.published
  const tags = Array.isArray(fm.tags) ? fm.tags : []

  const isDraft = draft === true || draft === 'true'
  const isUnpublished = published === false || published === 'false'
  const hasInternalTag = tags.some(tag => String(tag) === 'internal')

  return !isDraft && !isUnpublished && !hasInternalTag
}
