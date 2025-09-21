import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

describe('components/AppFooter.vue', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({ public: {} })
  })

  it('renders 3 legal links and copyright', async () => {
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

    expect(wrapper.find('footer[aria-label="Site footer"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/privacy"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/terms"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/ads"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('© KOTORI Lab')
    // appVersion not shown by default
    expect(wrapper.text()).not.toMatch(/v\d+/)
  })

  it('shows appVersion when provided', async () => {
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({ public: { appVersion: '1.2.3' } })
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
    expect(wrapper.text()).toContain('v1.2.3')
  })
})
