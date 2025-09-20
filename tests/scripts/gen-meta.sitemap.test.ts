import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const script = 'scripts/gen-meta.mjs'
const sitemapPath = 'public/sitemap.xml'

function runNode(args: string[]) {
  const res = spawnSync(process.execPath, args, {
    env: { ...process.env, NUXT_PUBLIC_SITE_URL: 'https://kotorilab.jp' },
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

  it('includes blog first-cron-tz route when content exists', () => {
    expect(existsSync(sitemapPath)).toBe(true)
    const xml = readFileSync(sitemapPath, 'utf8')
    expect(xml).toContain('<loc>https://kotorilab.jp/blog/first-cron-tz</loc>')
  })

  it('check-only still passes host validation', () => {
    // --check-only は生成済みのファイルに対して検証のみ行う
    const res = spawnSync(process.execPath, [script, '--check-only'], {
      env: { ...process.env, NUXT_PUBLIC_SITE_URL: 'https://kotorilab.jp' },
      encoding: 'utf8',
    })
    expect(res.status).toBe(0)
    expect(res.stdout).toMatch(/\[gen-meta] OK robots\/sitemap host = kotorilab.jp/)
  })
})
