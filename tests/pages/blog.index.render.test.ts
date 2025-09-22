/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense } from 'vue'

// Helpers to mount SFC with async setup
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

// Minimal query stub supporting list fetch
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

describe('pages/blog/index.vue listing', () => {
  beforeEach(() => {
    // Reset globals for each test
    // @ts-expect-error test stub
    globalThis.useAsyncData = async (_key: string, fn: () => any) => ({
      data: { value: await fn() },
    })
    // Provide SEO hooks no-op
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = () => undefined
  })

  it('renders list role and cards with link and date', async () => {
    const fixtures: Doc[] = [
      {
        _path: '/blog/first-cron-tz',
        title: 'Cron in JST',
        description: 'desc',
        date: '2025-09-20T00:00:00.000Z',
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

    // Let suspense resolve
    await new Promise(r => setTimeout(r, 0))

    const list = wrapper.find('ul[role="list"]')
    expect(list.exists()).toBe(true)
    const items = wrapper.findAll('li[role="listitem"]')
    expect(items.length).toBeGreaterThanOrEqual(1)
    const first = items[0]!
    const a = first.find('a[href="/blog/first-cron-tz"]')
    expect(a.exists()).toBe(true)
    // Check date format is YYYY-MM-DD
    expect(first.text()).toContain('2025-09-20')
  })

  it('shows "No posts yet" when list is empty', async () => {
    // @ts-expect-error test stub
    globalThis.queryContent = makeListStub([])

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

    expect(wrapper.text()).toContain('No posts yet')
  })
})
