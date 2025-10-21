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

describe('/tools/jwt-decode: learn link', () => {
  it('shows link to jwt-decode basics article', async () => {
    if (!(await serverUp())) return
    const res = await ofetch.raw(`${ORIGIN}/tools/jwt-decode`, { responseType: 'text', retry: 0 })
    expect(res.status).toBe(200)
    const html = String((res as any)._data ?? '')
    // Check for the learn link to /blog/jwt-decode-basics
    expect(html).toMatch(/\/blog\/jwt-decode-basics/)
    expect(html).toMatch(/JWTデコード入門|基礎ガイド/)
  })
})
