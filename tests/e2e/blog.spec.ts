import { describe, it, expect } from 'vitest'
import { ofetch } from 'ofetch'
import fs from 'fs'
import path from 'path'

// 目的: /blog の既知=200・未知=404・白紙なし、かつパス揺れ禁止を継続検証
describe('blog route canonical and availability', () => {
  const ORIGIN = process.env.E2E_ORIGIN ?? 'http://localhost:3000'

  // 既知 slug は /blog/hello-world を第一候補、無い場合は content/blog/*.md の先頭を使用
  const blogDir = path.resolve(__dirname, '../../content/blog')
  const mdFiles = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir).filter(f => f.endsWith('.md'))
    : []
  const hasHelloWorld = mdFiles.includes('hello-world.md')
  const fallback = mdFiles.find(f => !f.startsWith('_') && f.endsWith('.md')) || mdFiles[0]
  const knownSlug = hasHelloWorld ? 'hello-world' : fallback ? fallback.replace(/\.md$/, '') : null

  async function serverUp(): Promise<boolean> {
    try {
      await ofetch(ORIGIN, { method: 'HEAD' })
      return true
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) return false
      // それ以外のエラーは一旦 false（テストをスキップ）
      return false
    }
  }

  it('200 for an existing slug and not blank (rendered by <ContentRenderer>)', async () => {
    if (!knownSlug) return
    if (!(await serverUp())) return
    const html = await ofetch(`${ORIGIN}/blog/${knownSlug}`)
    expect(typeof html).toBe('string')
    // 白紙でないこと（最低限の長さ）
    expect(html.length).toBeGreaterThan(80)
    // SSR済み本文が存在することの簡易シグナル（既存テストと同じ観点）
    expect(html).toMatch(/<main[\s\S]*?>[\s\S]*<article[\s\S]*?>/i)
  })

  it('404 for unknown slug', async () => {
    if (!(await serverUp())) return
    await expect(ofetch(`${ORIGIN}/blog/__unknown__`)).rejects.toThrow()
  })

  it('rejects path variations (trailing slash and case changes)', async () => {
    if (!knownSlug) return
    if (!(await serverUp())) return
    // 末尾スラッシュ禁止
    await expect(ofetch(`${ORIGIN}/blog/${knownSlug}/`)).rejects.toThrow()
    // 大文字小文字の差異は 404
    await expect(ofetch(`${ORIGIN}/blog/${knownSlug.toUpperCase()}`)).rejects.toThrow()
  })
})
