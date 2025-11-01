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
  const handlerModule = await import('../../server/api/manifest.get.ts')
  const handler = handlerModule.default
  app.use('/api/manifest', handler)

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

describe('api/manifest.get', () => {
  beforeAll(async () => {
    await startServer()
  })
  afterAll(async () => {
    await stopServer()
    if (originalFetch) globalThis.fetch = originalFetch
  })

  it('extracts manifest link and returns parsed JSON', async () => {
    const pageUrl = 'https://example.com/page'
    const manifestUrl = 'https://example.com/manifest.json'

    const html =
      '<html><head><link rel="manifest" href="/manifest.json"></head><body></body></html>'
    const manifest = { name: 'Demo', start_url: '/', icons: [] }

    vi.stubGlobal('fetch', async (input: any) => {
      const url = typeof input === 'string' ? input : input.url
      if (url === pageUrl) {
        return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })
      }
      if (url === manifestUrl) {
        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: { 'content-type': 'application/manifest+json' },
        })
      }
      return new Response('not found', { status: 404, statusText: 'Not Found' })
    })

    const res = await agent.get('/api/manifest').query({ url: pageUrl })
    expect(res.status).toBe(200)
    expect(res.body.pageUrl).toBe(pageUrl)
    expect(res.body.manifestUrl).toBe(manifestUrl)
    expect(res.body.error).toBeNull()
    expect(res.body.manifest.name).toBe('Demo')
  })

  it('returns error payload when link rel=manifest not found', async () => {
    const pageUrl = 'https://example.com/nomani'
    const html = '<html><head></head><body></body></html>'

    vi.stubGlobal('fetch', async (input: any) => {
      const url = typeof input === 'string' ? input : input.url
      if (url === pageUrl) {
        return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } })
      }
      return new Response('not found', { status: 404, statusText: 'Not Found' })
    })

    const res = await agent.get('/api/manifest').query({ url: pageUrl })
    expect(res.status).toBe(200)
    expect(res.body.manifestUrl).toBeNull()
    expect(res.body.manifest).toBeNull()
    expect(String(res.body.error)).toMatch(/No <link rel="manifest">/)
  })
})
