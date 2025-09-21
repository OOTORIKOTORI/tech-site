import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

describe('pages/terms.vue', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = () => undefined
    // @ts-expect-error test stub
    globalThis.useRequestURL = () => ({ origin: 'https://kotorilab.jp' })
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ fullPath: '/terms' })
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({
      public: { siteOrigin: 'https://migakiexplorer.jp', siteName: '磨きエクスプローラー' },
    })
  })

  it('renders h1 and partial body text', async () => {
    const mod = await import('@/pages/terms.vue')
    const wrapper = mount(mod.default as any)
    const html = wrapper.html()
    expect(html).toContain('<h1>利用規約</h1>')
    expect(html).toContain('禁止事項')
  })
})
