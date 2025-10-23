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

describe('tools/cron-jst copy additions', () => {
  beforeEach(() => {
    // no-op head
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // route stub
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ query: {} })
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
    await new Promise(r => setTimeout(r, 0))

    const text = wrapper.text()
    expect(text).toContain('秒付き6フィールド')
    expect(text).toContain('0 0 9 * * *')
    expect(text).toContain('@hourly')
  })
})
