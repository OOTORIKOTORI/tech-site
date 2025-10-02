import { describe, it, expect } from 'vitest'
import { ofetch } from 'ofetch'
import fs from 'fs'
import path from 'path'

describe('blog detail page', () => {
  // 既知slugを自動検出（最初の1件）
  const blogDir = path.resolve(__dirname, '../../content/blog')
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'))
  const knownSlug = files.length && files[0] ? files[0].replace(/\.md$/, '') : null

  it('should return 200 for known slug', async () => {
    if (!knownSlug) return
    const res = await ofetch(`http://localhost:3000/blog/${knownSlug}`)
    expect(res).toBeTruthy()
  })

  it('should return 404 for unknown slug', async () => {
    // 厳密一致: 末尾スラッシュや大文字混在は404想定
    await expect(ofetch('http://localhost:3000/blog/__unknown-slug-404__')).rejects.toThrow()
    await expect(
      ofetch('http://localhost:3000/blog/' + (knownSlug ? knownSlug.toUpperCase() : 'UPPERCASE'))
    ).rejects.toThrow()
    await expect(
      ofetch('http://localhost:3000/blog/' + (knownSlug ? knownSlug + '/' : 'withslash/'))
    ).rejects.toThrow()
  })
})
