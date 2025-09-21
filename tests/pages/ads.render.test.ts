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
  })

  it('renders h1 and partial body text', async () => {
    const mod = await import('@/pages/ads.vue')
    const wrapper = mount(mod.default as any)
    const html = wrapper.html()
    expect(html).toContain('<h1>広告に関する表示</h1>')
    expect(html).toContain('Cookie')
  })
})
