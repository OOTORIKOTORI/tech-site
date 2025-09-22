import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Minimal unit test to ensure legal links exist in footer

describe('AppFooter legal links', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({ public: {} })
  })

  it('has /privacy, /terms, /ads links', async () => {
    const mod = await import('@/components/AppFooter.vue')
    const Comp = mod.default
    const wrapper = mount(Comp as any, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const html = wrapper.html()
    expect(html).toContain('aria-label="Footer"')
    expect(wrapper.find('a[href="/privacy"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/terms"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/ads"]').exists()).toBe(true)
  })
})
