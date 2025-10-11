import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

describe('pages/ads.vue', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = () => undefined
    // @ts-expect-error test stub
    globalThis.useRequestURL = () => ({ origin: 'https://kotorilab.jp' })
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ fullPath: '/ads' })
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({
      public: { siteOrigin: 'https://migakiexplorer.jp', siteName: '磨きエクスプローラー' },
    })
  })

  it('renders h1 and partial body text', async () => {
    const mod = await import('@/pages/ads.vue')
    const wrapper = mount(mod.default as any)
    const html = wrapper.html()
    expect(html).toContain('<h1>広告について（Ads Policy）</h1>')
    expect(html).toContain('Cookie')
  })
})
