/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense, nextTick } from 'vue'

const expectedCanonical = 'https://migakiexplorer.jp/blog/example'
const expectedTitle = 'Example Post'

function makeDoc() {
  return {
    _path: '/blog/example',
    title: expectedTitle,
    description: 'Example description',
    date: '2025-09-20T00:00:00.000Z',
    canonical: expectedCanonical,
    body: { children: [] },
  }
}

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

describe('pages/blog/[slug].vue render + SEO', () => {
  let seoSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    seoSpy = vi.fn()
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ params: { slug: 'example' } })
    // @ts-expect-error test stub
    globalThis.useAsyncData = async (_key: string, fn: () => any) => ({
      data: { value: await fn() },
    })
    // @ts-expect-error test stub
    globalThis.createError = (e: unknown) => e
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = (arg: Record<string, unknown>) => seoSpy(arg)
    // @ts-expect-error test stub
    globalThis.queryContent = () => ({
      where() {
        return this
      },
      async findOne() {
        return makeDoc()
      },
    })
  })

  it('calls useSeoMeta with title and canonical from frontmatter', async () => {
    const mod = await import('@/pages/blog/[slug].vue')
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
          ContentRenderer: defineComponent({
            props: { value: { type: Object, required: false } },
            setup: () => () => h('div'),
          }),
        },
      },
    })

    // Let suspense/async settle
    await Promise.resolve()
    await nextTick()
    await new Promise(r => setTimeout(r, 0))

    expect(seoSpy).toHaveBeenCalled()
    const first = seoSpy.mock.calls[0]![0] as Record<string, unknown>
    expect(first.title).toBe(expectedTitle)
    expect(first.ogUrl).toBe(expectedCanonical)

    wrapper.unmount()
  })
})
