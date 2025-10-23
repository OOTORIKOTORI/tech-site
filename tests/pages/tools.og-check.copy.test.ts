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

describe('tools/og-check copy additions', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({ public: { siteOrigin: 'https://example.com' } })
  })

  it('shows required/recommended tags line', async () => {
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

    const text = wrapper.text()
    expect(text).toContain('必須:')
    expect(text).toContain('og:title')
    expect(text).toContain('og:type')
    expect(text).toContain('og:image')
    expect(text).toContain('og:url')
    expect(text).toContain('推奨:')
    expect(text).toContain('og:description')
    expect(text).toContain('og:site_name')
    expect(text).toContain('og:image:alt')
  })
})
