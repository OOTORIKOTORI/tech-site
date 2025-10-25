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

describe('tools/cron-jst copy additions', () => {
  beforeAll(() => {
    // no-op head
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // route stub
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ query: {} })
    // @ts-expect-error stub
    globalThis.useFetch = () => Promise.resolve({ data: { value: { blog: [], items: [] } } })
  })

  it('shows 6-field and alias note near input', async () => {
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

    // wait suspense flush
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('秒付き6フィールド')
    expect(text).toContain('0 0 9 * * *')
    expect(text).toContain('@hourly')
  }, 20000)
})
