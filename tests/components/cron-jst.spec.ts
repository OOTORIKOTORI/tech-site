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

describe('cron-jst page copy smoke', () => {
  beforeEach(() => {
    // @ts-expect-error stub
    globalThis.useHead = () => undefined
    // @ts-expect-error stub
    globalThis.useRoute = () => ({ query: {} })
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

    await new Promise(r => setTimeout(r, 0))

    const txt = wrapper.text()
    expect(txt).toContain('秒付き6フィールド')
    expect(txt).toContain('@hourly')
  })
})
