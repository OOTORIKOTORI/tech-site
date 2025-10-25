import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { createServer } from 'node:http'
import { createApp, toNodeListener } from 'h3'
let BLOG_ROWS: any[] = []
let DOCS_ROWS: any[] = []

// Ensure content/docs is treated as existing in this test
vi.mock('node:fs', async importOriginal => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    existsSync: () => true,
    // also provide default export if consumer expects it
    default: {
      ...(actual.default || {}),
      existsSync: () => true,
    },
  }
})

vi.mock('@nuxt/content/nitro', () => {
  return {
    queryCollection: (_event: any, name: string) => ({
      // our handler calls .all() directly (no .select())
      all: async () => (name === 'blog' ? BLOG_ROWS : DOCS_ROWS),
      // keep select chaining for compatibility if used elsewhere
      select: (..._: any[]) => ({
        all: async () => (name === 'blog' ? BLOG_ROWS : DOCS_ROWS),
      }),
    }),
  }
})

describe('Blog v2 list API resilience', () => {
  it('returns 200 with arrays; maps id/path only; errors optional', async () => {
    BLOG_ROWS = [
      {
        path: '/blog/hello-world',
        id: 'blog:1',
        title: 'Hello',
        description: 'desc',
        date: '2025-01-01T00:00:00.000Z',
        // updated intentionally missing to ensure tolerance
        tags: ['a'],
        draft: false,
        published: true,
      },
      {
        path: '/blog/draft-post',
        id: 'blog:2',
        title: 'Draft',
        draft: 'true',
      },
    ]
    DOCS_ROWS = [
      { path: '/docs/guide', id: 'docs:1' },
      { path: '/docs/api', id: 2 }, // numeric id tolerated
    ]

    // Import handler after mock is in place
    // @ts-expect-error: importing a .ts file path in Vitest ESM test
    const handlerModule = await import('../../server/api/blogv2/list.get.ts')
    const handler = handlerModule.default

    const app = createApp()
    app.use('/api/blogv2/list', handler)
    const server = createServer(toNodeListener(app))

    try {
      await new Promise<void>((resolve, reject) => {
        server.listen(0, (err?: Error) => {
          if (err) reject(err)
          else resolve()
        })
      })

      const address = server.address()
      const port = typeof address === 'object' && address ? (address as any).port : 0
      const agent = request(`http://127.0.0.1:${port}`)

      const res = await agent.get('/api/blogv2/list')
      expect(res.status).toBe(200)
      expect(res.type).toMatch(/json/)
      expect(res.body).toBeTruthy()
      // sourceは返却されない仕様に変更
      // expect(res.body.source).toBeDefined()
      expect(Array.isArray(res.body.blog)).toBe(true)
      expect(Array.isArray(res.body.docs)).toBe(true)
      // errorsは任意
      if (res.body.errors) {
        expect(Array.isArray(res.body.errors)).toBe(true)
      }
      // Mapping check (id/path のみ)
      expect(res.body.blog[0].path).toBe('/blog/hello-world')
      expect(res.body.blog[0].id).toBe('blog:1')
      expect(res.body.docs[0].path).toBe('/docs/guide')
      expect(res.body.docs[0].id).toBe('docs:1')
      expect(res.body.docs[1].id).toBe('2')
    } finally {
      // Ensure server closes even if test fails
      await new Promise<void>(resolve => {
        server.closeAllConnections?.()
        server.close(() => resolve())
      })
    }
  }, 10000) // 10秒のタイムアウトに延長
})
