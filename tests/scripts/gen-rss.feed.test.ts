import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const script = 'scripts/gen-meta.mjs'
const feedPath = 'public/feed.xml'

function runNode(args: string[]) {
  const res = spawnSync(process.execPath, args, {
    env: { ...process.env, NUXT_PUBLIC_SITE_URL: 'https://kotorilab.jp' },
    encoding: 'utf8',
  })
  if (res.status !== 0) {
    throw new Error(`gen-meta failed: ${res.stderr || res.stdout}`)
  }
}

describe('RSS feed generation', () => {
  beforeAll(() => {
    runNode([script])
  })

  it('writes /public/feed.xml and contains first post', () => {
    expect(existsSync(feedPath)).toBe(true)
    const xml = readFileSync(feedPath, 'utf8')
    expect(xml).toContain('<title>Kotorilab Blog</title>')
    expect(xml).toContain('<link>https://kotorilab.jp/blog</link>')
    // first-cron-tz title existence
    expect(xml).toMatch(
      /<item>[^]*<title>[^<]*Cron[^<]*<\/title>[^]*<link>https:\/\/kotorilab\.jp\/blog\/first-cron-tz<\/link>/
    )
  })
})
