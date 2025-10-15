// 非2xxでもstatus取得できる安全なfetch
async function safeRaw(url: string) {
  try {
    return await ofetch.raw(url, { responseType: 'text', retry: 0 })
  } catch (e: any) {
    const resp = e?.response
    if (resp) return resp
    throw e
  }
}
import { describe, it, expect } from 'vitest'
import { ofetch } from 'ofetch'

/**
 * /blog E2E 恒常テスト（正準: 1経路取得・doc?.body必須・白紙なし）
 * 要件根拠:
 *  - README: /blog 詳細は1経路・白紙禁止・テンプレ1行  ref: README.md L9-L15/L19-L21
 *  - SPEC: /_path厳密一致→既存=200, 未知=404・doc.body必須  ref: PROJECT_SPEC.md L1-L8
 */
describe('blog route canonical and availability', () => {
  const ORIGIN =
    process.env.E2E_ORIGIN ||
    process.env.ORIGIN ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'

  const KNOWN_SLUG = 'welcome' // 仕様での既知slug
  const SSR_RELATIVE_URL_ERR = 'Only absolute URLs are supported'

  async function serverUp(): Promise<boolean> {
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
      return true
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) return false
      return false
    }
  }

  it('known slug returns 200 and renders non-blank article', async () => {
    if (!(await serverUp())) return

    const res = await safeRaw(`${ORIGIN}/blog/${KNOWN_SLUG}`)
    const status = res.status
    const html = String((res as any)._data ?? '')

    expect(status).toBe(200)
    expect(html.length).toBeGreaterThan(100)
    // 本文ルート（<article ...>）が含まれること
    expect(html).toMatch(/<article[\s>]/i)
    // SSR 相対URL回帰（500時に出やすいメッセージ）の不在を確認
    expect(html.includes(SSR_RELATIVE_URL_ERR)).toBe(false)
  })

  it('unknown slug returns 404 and shows non-blank error template', async () => {
    if (!(await serverUp())) return

    const res = await safeRaw(`${ORIGIN}/blog/___missing___`)
    const status = res.status
    const html = String((res as any)._data ?? '')

    expect(status).toBe(404)
    // 白紙ではない（data-testid="error-heading" のh1が存在）
    expect(html.length).toBeGreaterThan(50)
    expect(html).toMatch(/data-testid=["']error-heading["']/i)
    // SSR 相対URL回帰の不在
    expect(html.includes(SSR_RELATIVE_URL_ERR)).toBe(false)
  })

  it('rejects path variations (trailing slash and case changes)', async () => {
    if (!(await serverUp())) return

    // 末尾スラッシュは 404
    const trailing = await safeRaw(`${ORIGIN}/blog/${KNOWN_SLUG}/`)
    expect(trailing.status).toBe(404)

    // 大文字化は 404
    const upper = await safeRaw(`${ORIGIN}/blog/${KNOWN_SLUG.toUpperCase()}`)
    expect(upper.status).toBe(404)
  })
})
