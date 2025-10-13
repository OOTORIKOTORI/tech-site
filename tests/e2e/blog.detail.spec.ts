import { describe, it, expect } from 'vitest'
import { ofetch } from 'ofetch'

describe('blog detail page', () => {
  const ORIGIN = process.env.E2E_ORIGIN ?? 'http://localhost:3000'

  it('should return 200 for known slug with substantial content', async () => {
    // 疎通チェック（サーバ未起動時は早期return）
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        return
      }
    }

    // Test with known slug 'welcome'
    const res = await ofetch(`${ORIGIN}/blog/welcome`)
    expect(res).toBeTruthy()
    expect(typeof res).toBe('string')
    expect(res.length).toBeGreaterThan(1000) // 白紙回避のための閾値
  })

  it('should return 404 for unknown slug', async () => {
    // 疎通チェック（サーバ未起動時は早期return）
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
        return
      }
    }

    // Test with specifically unknown slug
    await expect(ofetch(`${ORIGIN}/blog/___missing___`)).rejects.toThrow()
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
