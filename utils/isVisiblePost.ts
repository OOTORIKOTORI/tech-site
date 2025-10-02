// 公開判定関数: draft !== true && published !== false（string型も解釈）
export function isVisiblePost(frontmatter: unknown): boolean {
  if (!frontmatter || typeof frontmatter !== 'object') return false
  const fm = frontmatter as { draft?: unknown; published?: unknown }
  const draft = fm.draft
  const published = fm.published
  const isDraft = draft === true || draft === 'true'
  const isUnpublished = published === false || published === 'false'
  return !isDraft && !isUnpublished
}
