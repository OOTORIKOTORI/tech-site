import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('blog frontmatter', () => {
  it('every blog post starts with "---\n"', () => {
    const dir = join(process.cwd(), 'content', 'blog')
    const files = readdirSync(dir).filter(f => f.endsWith('.md'))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      const s = readFileSync(join(dir, f), 'utf8')
      expect(s.startsWith('---\n')).toBe(true)
    }
  })
})
