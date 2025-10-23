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

describe('tools/site-check validator links', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({ public: { siteOrigin: 'https://example.com' } })
  })

  it('renders external validator buttons with correct href', async () => {
    const mod = await import('@/pages/tools/site-check.vue')
    const Comp = wrapperOf(mod.default)
    const wrapper = mount(Comp as any, {
      attachTo: document.body,
    })

    await new Promise(r => setTimeout(r, 0))

    const rich = wrapper.find('a[href="https://search.google.com/test/rich-results"]').exists()
    const schema = wrapper.find('a[href="https://validator.schema.org/"]').exists()
    expect(rich).toBe(true)
    expect(schema).toBe(true)
  })
})
