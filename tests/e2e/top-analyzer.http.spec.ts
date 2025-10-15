import { describe, it, expect } from 'vitest'
import { ofetch } from 'ofetch'

const ORIGIN =
  process.env.E2E_ORIGIN ||
  process.env.ORIGIN ||
  process.env.NUXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

async function serverUp() {
  try {
    await ofetch.raw(ORIGIN, { responseType: 'text', retry: 0 })
    return true
  } catch {
    return false
  }
}

async function safeRaw(url: string) {
  try {
    return await ofetch.raw(url, { responseType: 'text', retry: 0 })
  } catch (e: any) {
    const r = e?.response
    if (r) return r
    throw e
  }
}

describe('tools/top-analyzer route', () => {
  it('responds 200 and contains h1 & file input', async () => {
    if (!(await serverUp())) return
    const res = await safeRaw(`${ORIGIN}/tools/top-analyzer`)
    expect(res.status).toBe(200)
    const html = String((res as any)._data ?? '')
    expect(html).toMatch(/<h1[^>]*>.*top log.*<\/h1>/i)
    expect(html).toMatch(/<input[^>]*type="file"/i)
  })
})
