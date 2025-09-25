import { describe, it, expect, beforeAll } from 'vitest'
import { fetchPosts } from '../../composables/usePosts'

interface RawDoc {
  _path: string
  title?: string
  date?: string
  draft?: boolean
  published?: boolean
  slug?: string
}

// Minimal chainable stub supporting only()/where()/sort()/find()
function makeQueryStub(fixtures: RawDoc[]) {
  return function queryContent(path?: string) {
    let list = fixtures.filter(d => (path ? d._path.startsWith(path) : true))
    const api: any = {
      only(keys?: string[]) {
        if (Array.isArray(keys)) {
          list = list.map(d => {
            const picked: Partial<RawDoc> = {}
            for (const k of keys) if (k in d) (picked as any)[k] = (d as any)[k]
            // ensure _path is always retained for type expectations
            picked._path = d._path
            return picked as RawDoc
          })
        }
        return api
      },
      where(cond: Record<string, any>) {
        // Support draft != true & published OR condition only (spec specific)
        if (cond.draft && cond.draft.$ne === true) {
          list = list.filter(d => d.draft !== true)
        } else if (cond.$or) {
          const orConds = cond.$or as any[]
          list = list.filter(d => {
            return orConds.some(c => {
              if ('published' in c && c.published === true) return d.published === true
              if (c.published && c.published.$exists === false) return d.published === undefined
              return false
            })
          })
        }
        return api
      },
      sort(order: Record<string, 1 | -1>) {
        if (order.date) {
          const dir = order.date
          list = list.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '') * dir * -1)
        }
        return api
      },
      limit(n: number) {
        list = list.slice(0, n)
        return api
      },
      async find() {
        return list
      },
    }
    return api
  }
}

describe('blog listing filters (spec alignment)', () => {
  let result: Awaited<ReturnType<typeof fetchPosts>>
  beforeAll(async () => {
    const nowPlus =
      new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z'
    const fixtures: RawDoc[] = [
      { _path: '/blog/visible-no-published', title: 'Visible A' }, // published 未指定 → 表示
      { _path: '/blog/visible-published-true', title: 'Visible B', published: true },
      { _path: '/blog/draft-hidden', title: 'Draft', draft: true },
      { _path: '/blog/published-false-hidden', title: 'Hidden', published: false },
      { _path: '/blog/future-date-visible', title: 'Future', date: nowPlus, published: true }, // 未来日付も表示
    ]
    ;(globalThis as any).queryContent = makeQueryStub(fixtures)
    result = await fetchPosts()
  })

  it('excludes draft and published:false', () => {
    const slugs = result.map(r => r._path)
    expect(slugs).not.toContain('/blog/draft-hidden')
    expect(slugs).not.toContain('/blog/published-false-hidden')
  })

  it('includes published:true and published undefined', () => {
    const slugs = result.map(r => r._path)
    expect(slugs).toContain('/blog/visible-no-published')
    expect(slugs).toContain('/blog/visible-published-true')
  })

  it('includes future dated post (no date filter)', () => {
    expect(result.find(p => p._path === '/blog/future-date-visible')).toBeTruthy()
  })

  it('slug fallback derives from _path', () => {
    const item = result.find(p => p._path === '/blog/visible-no-published')
    expect(item?.slug).toBe('visible-no-published')
  })
})
