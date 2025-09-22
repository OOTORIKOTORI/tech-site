import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

describe('components/AppHeader.vue', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ path: '/' })
  })

  it('renders skip link and primary nav with 3 items', async () => {
    const mod = await import('@/components/AppHeader.vue')
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

    expect(wrapper.find('a[href="#main"]').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label="Primary"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/tools"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/blog"]').exists()).toBe(true)
  })
})
