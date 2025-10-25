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

  it('excludes blog welcome route (primer+tools only)', async () => {
    const xml = await waitForSitemap(sitemapPath)
    // ensure welcome is not listed in sitemap
    expect(xml).not.toContain('<loc>https://migakiexplorer.jp/blog/welcome</loc>')
    // sanity: sitemap xml is valid-ish and contains at least one tools or blog route
    expect(xml).toContain('<urlset')
    expect(/<loc>https:\/\/migakiexplorer\.jp\/(tools|blog)\//.test(xml)).toBe(true)
  })

  it('check-only still passes host validation', () => {
    // --check-only は生成済みのファイルに対して検証のみ行う
    const res = spawnSync(process.execPath, [script, '--check-only'], {
      env: { ...process.env, NUXT_PUBLIC_SITE_ORIGIN: 'https://migakiexplorer.jp' },
      encoding: 'utf8',
    })
    expect(res.status).toBe(0)
    expect(res.stdout).toMatch(
      /\[gen-meta] OK (robots\/sitemap|sitemap\/feed(?:\/robots)?) host = migakiexplorer\.jp/
    )
  })
})
