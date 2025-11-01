/// <reference types="vitest/globals" />
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), 'content', 'blog')
const H = ['導入', '基本', '実例', '落とし穴', '手を動かす', 'クイズ', 'まとめ'] as const

type Heading = (typeof H)[number]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []
  })
}

function splitFrontmatter(s: string) {
  const m = s.match(/^---\n[\s\S]*?\n---\n?/)
  return m ? s.slice(m[0].length) : s
}

describe('blog structure guard', () => {
  const SEVERITY: 'fail' | 'warn' =
    (process.env.BLOG_GUARD_MODE as any) === 'fail' || process.env.CI ? 'fail' : 'warn'
  const CTA_MAX = Number(process.env.BLOG_GUARD_CTA_MAX ?? 3)
  const files = walk(ROOT)
  test.each(files)('%s has canonical structure (no dup, sane CTA)', (fp: string) => {
    const raw = readFileSync(fp, 'utf8')
    const body = splitFrontmatter(raw)

    // コードブロックは一旦プレースホルダへ
    const codeBlocks: string[] = []
    const ph = (m: string) => {
      codeBlocks.push(m)
      return `§§CODE${codeBlocks.length - 1}§§`
    }
    const tmp = body.replace(/```[\s\S]*?```/g, ph)

    // 各見出しの出現回数（重複なし）
    const counts: Record<Heading, number> = Object.fromEntries(H.map(h => [h, 0])) as Record<
      Heading,
      number
    >
    for (const h of H) {
      const re = new RegExp(`^##\\s+${h}\\s*$`, 'm')
      const occur = tmp.match(new RegExp(re, 'gm')) ?? []
      counts[h] = occur.length
      expect(counts[h]).toBeLessThanOrEqual(1)
    }

    // CTA（/tools/）は最大2（冒頭＆末尾）を想定：緩めに3超で赤
    const ctas = (tmp.match(/\/tools\/[^\s)\]]+/g) ?? []).length
    if (ctas > CTA_MAX) {
      if (SEVERITY === 'fail') {
        expect(ctas).toBeLessThanOrEqual(CTA_MAX)
      } else {
        // warn only (local dev)
        // eslint-disable-next-line no-console
        console.warn(`[blog-guard] CTA links too many (${ctas} > ${CTA_MAX}) in: ${fp}`)
      }
    }

    // 末尾の空行や3連以上の空行を軽く牽制
    const tooManyTrailing = /\n{4,}$/.test(tmp)
    if (tooManyTrailing) {
      if (SEVERITY === 'fail') {
        expect(tooManyTrailing).toBeFalsy()
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[blog-guard] trailing blank lines 4+ at end: ${fp}`)
      }
    }
  })
})
