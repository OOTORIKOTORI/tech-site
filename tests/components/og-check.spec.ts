import { describe, it, beforeEach, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense } from 'vue'

function wrapperOf(component: any) {
  return defineComponent({
    setup() {
      return () =>
        h(Suspense, null, {
          default: () => h(component),
          fallback: () => h('div', 'loading'),
        })
    },
  })
}

describe('og-check page copy smoke', () => {
  beforeEach(() => {
    // @ts-expect-error stub
    globalThis.useHead = () => undefined
    // @ts-expect-error stub
    globalThis.useRuntimeConfig = () => ({ public: { siteOrigin: 'https://example.com' } })
    // @ts-expect-error stub
    globalThis.useFetch = () => Promise.resolve({ data: { value: { blog: [], items: [] } } })
  })

  it('shows required/recommended tags one-liner', async () => {
    const mod = await import('@/pages/tools/og-check.vue')
    const Comp = wrapperOf(mod.default)
    const wrapper = mount(Comp as any, {
      global: {
        stubs: {
          NuxtLink: defineComponent({
            props: { to: { type: String, required: false } },
            setup:
              (p, { slots }) =>
              () =>
                h('a', { href: (p as any).to }, slots.default?.()),
          }),
        },
      },
    })

    await new Promise(r => setTimeout(r, 0))

    const txt = wrapper.text()
    expect(txt).toContain('必須:')
    expect(txt).toContain('og:title')
    expect(txt).toContain('og:type')
    expect(txt).toContain('og:image')
    expect(txt).toContain('og:url')
  })
})
