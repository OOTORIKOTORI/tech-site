import { describe, it, expect } from 'vitest'
import { isVisiblePost } from '../../utils/isVisiblePost'

// 表示判定は "落とす条件だけ厳格": draft !== true && published !== false（'true'/'false'文字列含む）
describe('frontmatter visibility (strict drop-only rules)', () => {
  it('visible when no flags present', () => {
    expect(isVisiblePost({})).toBe(true)
  })

  it('drops when draft is true (boolean) or "true" (string)', () => {
    expect(isVisiblePost({ draft: true })).toBe(false)
    expect(isVisiblePost({ draft: 'true' })).toBe(false)
  })

  it('drops when published is false (boolean) or "false" (string)', () => {
    expect(isVisiblePost({ published: false })).toBe(false)
    expect(isVisiblePost({ published: 'false' })).toBe(false)
  })

  it('visible when explicitly non-dropping (draft=false, published=true; accepts strings)', () => {
    expect(isVisiblePost({ draft: false, published: true })).toBe(true)
    expect(isVisiblePost({ draft: 'false', published: 'true' })).toBe(true)
  })
})
