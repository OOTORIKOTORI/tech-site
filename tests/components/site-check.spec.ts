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

describe('site-check page link smoke', () => {
  beforeEach(() => {
    // @ts-expect-error stub
    globalThis.useHead = () => undefined
    // @ts-expect-error stub
    globalThis.useRuntimeConfig = () => ({ public: { siteOrigin: 'https://example.com' } })
  })

  it('has Rich Results Test and Schema Markup Validator links', async () => {
    const mod = await import('@/pages/tools/site-check.vue')
    const Comp = wrapperOf(mod.default)
    const wrapper = mount(Comp as any)

    await new Promise(r => setTimeout(r, 0))

    const rich = wrapper.find('a[href="https://search.google.com/test/rich-results"]')
    const schema = wrapper.find('a[href="https://validator.schema.org/"]')
    expect(rich.exists()).toBe(true)
    expect(schema.exists()).toBe(true)
    expect(rich.text()).toMatch(/Rich Results Test/i)
    expect(schema.text()).toMatch(/Schema Markup Validator/i)
  })
})
