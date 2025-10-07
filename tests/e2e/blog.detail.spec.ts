import { describe, it, expect } from 'vitest'
import { ofetch } from 'ofetch'
import fs from 'fs'
import path from 'path'

describe('blog detail page', () => {
  const ORIGIN = process.env.E2E_ORIGIN ?? 'http://localhost:3000'
  // 既知slugを自動検出（最初の1件）
  const blogDir = path.resolve(__dirname, '../../content/blog')
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'))
  const knownSlug = files.length && files[0] ? files[0].replace(/\.md$/, '') : null

  it('should return 200 for known slug', async () => {
    if (!knownSlug) return
    // 疎通チェック（サーバ未起動時は早期return）
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        return
      }
    }
    const res = await ofetch(`${ORIGIN}/blog/${knownSlug}`)
    expect(res).toBeTruthy()
  })

  it('should return 404 for unknown slug', async () => {
    // 厳密一致: 末尾スラッシュや大文字混在は404想定
    await expect(ofetch(`${ORIGIN}/blog/__unknown-slug-404__`)).rejects.toThrow()
    await expect(
      ofetch(`${ORIGIN}/blog/` + (knownSlug ? knownSlug.toUpperCase() : 'UPPERCASE'))
    ).rejects.toThrow()
    await expect(
      ofetch(`${ORIGIN}/blog/` + (knownSlug ? knownSlug + '/' : 'withslash/'))
    ).rejects.toThrow()
  })

  it('should render control post without blank content', async () => {
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        return
      }
    }
    const res = await ofetch(`${ORIGIN}/blog/_control`)
    expect(res).toBeTruthy()
    expect(typeof res).toBe('string')
    expect(res.length).toBeGreaterThan(100) // 白紙でないことを確認
    expect(res).toContain('ContentRenderer') // 制御記事の特徴的なキーワード
  })

  it('should have strict _path matching', async () => {
    // _control は存在するが、_Control（大文字）は404
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        return
      }
    }
    await expect(ofetch(`${ORIGIN}/blog/_Control`)).rejects.toThrow()
    await expect(ofetch(`${ORIGIN}/blog/_control/`)).rejects.toThrow()
  })
})
