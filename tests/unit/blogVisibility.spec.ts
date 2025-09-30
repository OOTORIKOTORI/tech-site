import { describe, it, expect } from 'vitest'

// string-bool aware helpers（ページと同等のルール）
const truthy = (v: any) => v === true || v === 'true'
const falsy = (v: any) => v === false || v === 'false'
const visible = (it: any) => !truthy(it?.draft) && !falsy(it?.published)

describe('blog visibility rule', () => {
  it('hides when draft: true', () => {
    expect(visible({ draft: true })).toBe(false)
  })
  it('hides when draft: "true"', () => {
    expect(visible({ draft: 'true' })).toBe(false)
  })
  it('hides when published: false', () => {
    expect(visible({ published: false })).toBe(false)
  })
  it('hides when published: "false"', () => {
    expect(visible({ published: 'false' })).toBe(false)
  })
  it('shows when fields are unspecified', () => {
    expect(visible({})).toBe(true)
  })
  it('shows when draft: false and published: true', () => {
    expect(visible({ draft: false, published: true })).toBe(true)
  })
  it('draft takes precedence to hide', () => {
    expect(visible({ draft: true, published: true })).toBe(false)
  })
})
