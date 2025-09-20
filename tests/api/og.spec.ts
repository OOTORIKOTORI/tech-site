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

describe('OGP redirect API', () => {
  beforeAll(async () => {
    await startServer()
  })
  afterAll(async () => {
    await stopServer()
  })

  it('GET /api/og/hello.png returns 302 to /og-default.png (absolute)', async () => {
    const res = await agent.get('/api/og/hello.png').redirects(0)
    expect(res.status).toBe(302)
    const loc = res.header['location'] as string
    expect(loc).toMatch(/^https?:\/\//)
    expect(loc.endsWith('/og-default.png')).toBe(true)
  })

  it('HEAD /api/og/hello.png returns 302', async () => {
    const res = await agent.head('/api/og/hello.png').redirects(0)
    expect(res.status).toBe(302)
  })
})
