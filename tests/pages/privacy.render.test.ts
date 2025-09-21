import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

describe('pages/privacy.vue', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = () => undefined
    // @ts-expect-error test stub
    globalThis.useRequestURL = () => ({ origin: 'https://kotorilab.jp' })
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ fullPath: '/privacy' })
  })

  it('renders h1 and partial body text', async () => {
    const mod = await import('@/pages/privacy.vue')
    const wrapper = mount(mod.default as any)
    const html = wrapper.html()
    expect(html).toContain('<h1>Privacy Policy</h1>')
    expect(html).toContain('個人情報を適切に取り扱い')
  })
})
