import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { createServer } from 'node:http'
import { createApp, toNodeListener } from 'h3'

let server: any
let agent: any
const originalFetch = globalThis.fetch

async function startServer() {
  const app = createApp()
  // @ts-expect-error ESM path import in Vitest
  const handlerModule = await import('../../server/api/headers.get.ts')
  const handler = handlerModule.default
  app.use('/api/headers', handler)

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

describe('api/headers.get', () => {
  beforeAll(async () => {
    await startServer()
  })
  afterAll(async () => {
    await stopServer()
    if (originalFetch) globalThis.fetch = originalFetch
  })

  it('returns response headers via HEAD request', async () => {
    const targetUrl = 'https://sec.example.com/'

    vi.stubGlobal('fetch', async (input: any) => {
      const url = typeof input === 'string' ? input : input.url
      if (url === targetUrl) {
        return new Response('', {
          status: 200,
          headers: {
            'Content-Security-Policy': "default-src 'self'",
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Frame-Options': 'DENY',
          },
        })
      }
      return new Response('not found', { status: 404, statusText: 'Not Found' })
    })

    const res = await agent.get('/api/headers').query({ url: targetUrl })
    expect(res.status).toBe(200)
    expect(res.body.url).toBe(targetUrl)
    expect(res.body.status).toBe(200)
    const headers = res.body.headers as Record<string, string>
    // Headers keys are normalized to lowercase in undici
    expect(headers['content-security-policy']).toBeDefined()
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['x-frame-options']).toBe('DENY')
  })
})
