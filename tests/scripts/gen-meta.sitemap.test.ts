import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const script = 'scripts/gen-meta.mjs'
const sitemapPath = 'public/sitemap.xml'

function runNode(args: string[]) {
  const res = spawnSync(process.execPath, args, {
    env: { ...process.env, NUXT_PUBLIC_SITE_ORIGIN: 'https://migakiexplorer.jp' },
    encoding: 'utf8',
  })
  if (res.status !== 0) {
    throw new Error(`gen-meta failed: ${res.stderr || res.stdout}`)
  }
}

describe('scripts/gen-meta.mjs sitemap', () => {
  beforeAll(() => {
    // 事前に生成を実行（check-onlyは出力が必要なので通常実行）
    runNode([script])
  })

  async function waitForSitemap(path: string, timeout = 2000) {
    const start = Date.now()
    for (;;) {
      if (existsSync(path)) {
        const xml = readFileSync(path, 'utf8')
        if (xml.includes('<urlset') && xml.length > 0) return xml
      }
      if (Date.now() - start > timeout) throw new Error('sitemap not ready')
      await new Promise(r => setTimeout(r, 50))
    }
  }

  it('includes blog welcome route after reset', async () => {
    const xml = await waitForSitemap(sitemapPath)
    expect(xml).toContain('<loc>https://migakiexplorer.jp/blog/welcome</loc>')
    const m = xml.match(
      /<url>\s*<loc>https:\/\/migakiexplorer\.jp\/blog\/welcome<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/
    )
    expect(m && typeof m[1] === 'string').toBeTruthy()
    const lastmod = m && m[1] ? m[1] : ''
    // ISO 8601 datetime check (rough)
    expect(new Date(lastmod).toString()).not.toBe('Invalid Date')
  })

  it('check-only still passes host validation', () => {
    // --check-only は生成済みのファイルに対して検証のみ行う
    const res = spawnSync(process.execPath, [script, '--check-only'], {
      env: { ...process.env, NUXT_PUBLIC_SITE_ORIGIN: 'https://migakiexplorer.jp' },
      encoding: 'utf8',
    })
    expect(res.status).toBe(0)
    expect(res.stdout).toMatch(/\[gen-meta] OK robots\/sitemap host = migakiexplorer.jp/)
  })
})
