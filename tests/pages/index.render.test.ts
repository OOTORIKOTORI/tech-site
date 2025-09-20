import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense } from 'vue'

interface Doc {
  _path: string
  title?: string
  description?: string
  date?: string
}

function wrapperOf(component: any) {
  return defineComponent({
    setup() {
      return () => h(Suspense, null, { default: () => h(component), fallback: () => h('div') })
    },
  })
}

function makeListStub(list: Doc[]) {
  return () => ({
    sort() {
      return this
    },
    only() {
      return this
    },
    limit() {
      return this
    },
    async find() {
      return list
    },
  })
}

describe('pages/index.vue home', () => {
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

  it('renders CTA links and latest posts when present', async () => {
    const fixtures: Doc[] = [
      {
        _path: '/blog/first-cron-tz',
        title: 'Cron JST',
        description: 'desc',
        date: '2025-09-20T00:00:00.000Z',
      },
    ]
    // @ts-expect-error test stub
    globalThis.queryContent = makeListStub(fixtures)

    const mod = await import('@/pages/index.vue')
    const Comp = wrapperOf(mod.default)
    const wrapper = mount(Comp as any, {
      global: {
        stubs: {
          NuxtLink: defineComponent({
            props: {
              to: { type: String, required: false },
              ariaLabel: { type: String, required: false },
            },
            setup:
              (p, { slots }) =>
              () =>
                h('a', { href: (p as any).to }, slots.default?.()),
          }),
        },
      },
    })

    await new Promise(r => setTimeout(r, 0))

    // CTA links
    expect(wrapper.find('a[href="/tools/cron-jst"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/blog"]').exists()).toBe(true)

    // Latest posts contains at least the blog link
    const links = wrapper.findAll('a[href="/blog/first-cron-tz"]')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })
})
