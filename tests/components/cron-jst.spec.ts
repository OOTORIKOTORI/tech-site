import { describe, it, beforeAll, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

describe('cron-jst page copy smoke', () => {
  beforeAll(() => {
    // @ts-expect-error stub
    globalThis.useHead = () => undefined
    // @ts-expect-error stub
    globalThis.useRoute = () => ({ query: {} })
    // @ts-expect-error stub
    globalThis.useFetch = () => Promise.resolve({ data: { value: { blog: [], items: [] } } })
  })

  it('renders 6-field/alias note statically', async () => {
    const mod = await import('@/pages/tools/cron-jst.vue')
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

    await flushPromises()

    const txt = wrapper.text()
    expect(txt).toContain('秒付き6フィールド')
    expect(txt).toContain('@hourly')
  }, 20000)
})
