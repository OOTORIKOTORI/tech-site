import { describe, it, expect, vi } from 'vitest'
import { tryHeadReachable, recommendOgImageSize } from '@/utils/og'

describe('OG image helpers', () => {
  it('tryHeadReachable returns ok=false on network error (non-throw)', async () => {
    const origFetch = (global as any).fetch
    ;(global as any).fetch = vi.fn().mockRejectedValue(new Error('network down'))
    const res = await tryHeadReachable('https://example.com/img.png', 10)
    expect(res.ok).toBe(false)
    ;(global as any).fetch = origFetch
  })

  it('recommendOgImageSize warns for small or bad aspect', () => {
    const w1 = recommendOgImageSize(400, 200)
    expect(w1).toBeTruthy()
    const w2 = recommendOgImageSize(1200, 630)
    expect(w2).toBeNull()
    const w3 = recommendOgImageSize(800, 800)
    expect(w3).toBeTruthy()
  })
})
