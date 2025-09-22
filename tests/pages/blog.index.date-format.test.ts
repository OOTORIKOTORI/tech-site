/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach } from 'vitest'
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

interface Doc {
  _path: string
  title?: string
  description?: string
  date?: string
}
function makeListStub(list: Doc[]) {
  return () => ({
    sort() {
      return this
    },
    only() {
      return this
    },
    async find() {
      return list
    },
  })
}

describe('pages/blog/index.vue date format', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useAsyncData = async (_key: string, fn: () => any) => ({
      data: { value: await fn() },
    })
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = () => undefined
  })

  it('shows YYYY-MM-DD format', async () => {
    const fixtures: Doc[] = [
      {
        _path: '/blog/sample',
        title: 'Sample',
        date: '2025-01-02T12:34:56.000Z',
      },
    ]
    // @ts-expect-error test stub
    globalThis.queryContent = makeListStub(fixtures)

    const mod = await import('@/pages/blog/index.vue')
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

    const dateEl = wrapper.find('li p')
    expect(dateEl.exists()).toBe(true)
    const dateText = dateEl.text().trim()
    expect(/^\d{4}-\d{2}-\d{2}$/.test(dateText)).toBe(true)
  })
})
