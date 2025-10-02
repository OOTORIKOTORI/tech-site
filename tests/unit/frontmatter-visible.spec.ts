import { describe, it, expect } from 'vitest'
import { isVisiblePost } from '../../utils/isVisiblePost'

describe('isVisiblePost', () => {
  it('returns true if neither draft nor published is set', () => {
    expect(isVisiblePost({})).toBe(true)
  })
  it('returns false if draft is true (boolean)', () => {
    expect(isVisiblePost({ draft: true })).toBe(false)
  })
  it('returns false if draft is "true" (string)', () => {
    expect(isVisiblePost({ draft: 'true' })).toBe(false)
  })
  it('returns false if published is false (boolean)', () => {
    expect(isVisiblePost({ published: false })).toBe(false)
  })
  it('returns false if published is "false" (string)', () => {
    expect(isVisiblePost({ published: 'false' })).toBe(false)
  })
  it('returns true if draft is false and published is true', () => {
    expect(isVisiblePost({ draft: false, published: true })).toBe(true)
  })
  it('returns true if draft is "false" and published is "true"', () => {
    expect(isVisiblePost({ draft: 'false', published: 'true' })).toBe(true)
  })
})
