import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'node:http'
import request from 'supertest'
import { createApp, toNodeListener } from 'h3'

type StorageMap = Map<string, Buffer>

const serverAssets: StorageMap = new Map()
const publicAssets: StorageMap = new Map()

let server: ReturnType<typeof createServer> | null = null
let baseUrl = ''
const originalUseStorage = (globalThis as any).useStorage

function loadAsset(map: StorageMap, baseDir: string, fileName: string) {
  const filePath = resolve(baseDir, fileName)
  if (existsSync(filePath)) {
    map.set(fileName, readFileSync(filePath))
  }
}

async function startServer() {
  const app = createApp()
  // @ts-expect-error Nuxt server route filenames include resource hints (sitemap.xml.ts)
  const sitemapModule = await import('../../server/routes/sitemap.xml.ts')
  // @ts-expect-error same as above
  const feedModule = await import('../../server/routes/feed.xml.ts')
  app.use('/sitemap.xml', sitemapModule.default)
  app.use('/feed.xml', feedModule.default)

  const listener = toNodeListener(app)
  server = createServer(listener)
  await new Promise<void>(resolveDone => server!.listen(0, resolveDone))
  const address = server!.address()
  const port = typeof address === 'object' && address ? address.port : 0
  baseUrl = `http://127.0.0.1:${port}`
}

async function stopServer() {
  if (!server) return
  await new Promise<void>(resolveDone => server!.close(() => resolveDone()))
  server = null
}

describe('static XML routes', () => {
  // CI で import/初期化が遅延することがあるため余裕を持たせる
  beforeAll(async () => {
    const serverDir = resolve(process.cwd(), 'server/assets')
    const publicDir = resolve(process.cwd(), 'public')
    loadAsset(serverAssets, serverDir, 'sitemap.xml')
    loadAsset(serverAssets, serverDir, 'feed.xml')
    loadAsset(publicAssets, publicDir, 'sitemap.xml')
    loadAsset(publicAssets, publicDir, 'feed.xml')
    ;(globalThis as any).useStorage = (name: string) => {
      const map =
        name === 'assets:server' ? serverAssets : name === 'assets:public' ? publicAssets : null
      return {
        async getItemRaw(key: string) {
          return map?.get(key) ?? null
        },
      }
    }

    process.env.NUXT_PUBLIC_SITE_ORIGIN = 'https://migakiexplorer.jp'
    await startServer()
  }, 30000)

  afterAll(async () => {
    await stopServer()
    ;(globalThis as any).useStorage = originalUseStorage
  })

  it('GET /sitemap.xml responds with XML and absolute URLs', async () => {
    const res = await request(baseUrl).get('/sitemap.xml')
    expect(res.status).toBe(200)
    expect(res.header['content-type']).toMatch(/application\/xml/i)
    expect(res.text.startsWith('<?xml')).toBe(true)
    expect(res.text).toContain('<urlset')
    expect(res.text).toContain('https://migakiexplorer.jp/')
  })

  it('GET /feed.xml responds with XML and channel metadata', async () => {
    const res = await request(baseUrl).get('/feed.xml')
    expect(res.status).toBe(200)
    expect(res.header['content-type']).toMatch(/application\/xml/i)
    expect(res.text.startsWith('<?xml')).toBe(true)
    expect(/<rss[^>]*>/.test(res.text)).toBe(true)
    expect(res.text).toContain('https://migakiexplorer.jp/blog')
  })
})
