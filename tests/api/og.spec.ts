import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createServer } from 'node:http'
import { createApp, toNodeListener } from 'h3'

let server: any
let agent: any

async function startServer() {
  const app = createApp()
  // Import the actual handler and mount it at the tested route
  // @ts-expect-error: importing a .ts file path in Vitest ESM test
  const handlerModule = await import('../../server/api/og/[slug].png.ts')
  const handler = handlerModule.default
  app.use('/api/og/hello.png', handler)

  const listener = toNodeListener(app)
  server = createServer(listener)
  await new Promise<void>(resolve => server.listen(0, resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? (address as any).port : 0
  agent = request(`http://127.0.0.1:${port}`)
}

async function stopServer() {
  if (server) {
    await new Promise<void>(resolve => server.close(() => resolve()))
    server = null
  }
}

describe('OGP API feature-flag behavior', () => {
  beforeAll(async () => {
    await startServer()
  })
  afterAll(async () => {
    await stopServer()
  })

  it('flag off: always 302 fallback', async () => {
    delete process.env.ENABLE_DYNAMIC_OG
    const res = await agent.get('/api/og/hello.png').redirects(0)
    expect(res.status).toBe(302)
    const loc = res.header['location'] as string
    expect(loc).toMatch(/^https?:\/\//)
    expect(loc.endsWith('/og-default.png')).toBe(true)
    expect(res.header['x-og-fallback']).toBe('1')
    expect(res.header['cache-control']).toContain('no-store')
  })

  it('flag on: happy path 200 with PNG', async () => {
    process.env.ENABLE_DYNAMIC_OG = '1'
    delete process.env.ENABLE_DYNAMIC_OG_FORCE_ERROR
    const res = await agent.get('/api/og/hello.png').redirects(0)
    expect(res.status).toBe(200)
    expect(res.header['content-type']).toMatch(/image\/png/)
    expect(res.header['x-og-fallback']).toBe('0')
    expect(res.header['cache-control']).toContain('no-store')
    expect(res.body).toBeInstanceOf(Buffer)
    // PNG signature check
    expect(res.body.slice(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  })

  it('flag on: error path 302 fallback', async () => {
    process.env.ENABLE_DYNAMIC_OG = '1'
    process.env.ENABLE_DYNAMIC_OG_FORCE_ERROR = '1'
    const res = await agent.get('/api/og/hello.png').redirects(0)
    expect(res.status).toBe(302)
    expect(res.header['x-og-fallback']).toBe('1')
    expect(res.header['cache-control']).toContain('no-store')
  })
})
