/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Provide minimal #imports shims for the SFC under test
// We'll stub useRoute, useAsyncData, createError, useHead, useSeoMeta, computed
// using Vue's provide/inject mechanism compatible with Nuxt's auto-imports in tests.

// Simple reactivity shim using Vue computed is not necessary; we can emulate with getters
// but to keep type-safety, import from vue.
import { computed as vueComputed, defineComponent, h, Suspense, nextTick } from 'vue'
const route = { params: { slug: 'first-cron-tz' } }

function makeDoc() {
  return {
    _path: '/blog/first-cron-tz',
    title: 'Sample Title',
    description: 'Desc',
    date: '2025-09-20T00:00:00.000Z',
    canonical: expectedCanonical,
    body: { children: [] },
  }
}

function useAsyncData(_key: string, fn: () => any) {
  return { data: { value: fn() } }
}
function createError(err: unknown) {
  throw err
}
function useHead(): void {
  /* no-op */
}

// Canonical expected value from frontmatter
const expectedCanonical = 'https://kotorilab.jp/blog/first-cron-tz'

// Stubs shared across tests
let seoSpy: ReturnType<typeof vi.fn>

describe('pages/blog/[slug].vue SEO', () => {
  beforeEach(() => {
    seoSpy = vi.fn()
    // Install global stubs consumed by the alias module `#imports`
    // @ts-expect-error test shim
    globalThis.useRoute = () => route
    // @ts-expect-error test shim
    globalThis.useAsyncData = useAsyncData
    // @ts-expect-error test shim
    globalThis.createError = createError
    // @ts-expect-error test shim
    globalThis.useHead = useHead
    // @ts-expect-error test shim
    globalThis.useSeoMeta = (input: Record<string, unknown>) => seoSpy(input)
    // @ts-expect-error test shim
    globalThis.computed = vueComputed
    // expose queryContent on global since page reads from globalThis.queryContent
    // @ts-expect-error test shim
    globalThis.queryContent = () => ({
      where() {
        return this
      },
      sort() {
        return this
      },
      only() {
        return this
      },
      findOne: () => makeDoc(),
      findSurround: () => [null, null],
    })
  })

  it('passes canonical from frontmatter into useSeoMeta', async () => {
    // Dynamically import after mocks are in place
    const mod = await import('@/pages/blog/[slug].vue')
    const BlogPage = mod.default

    // Wrap in Suspense to support async setup (due to top-level await)
    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () => h(BlogPage as any),
            fallback: () => h('div', 'loading'),
          })
      },
    })

    const wrapper = mount(Wrapper as any, {
      global: {
        stubs: {
          // Avoid rendering heavy Nuxt components
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

    // Let Suspense resolve
    const flush = async () => {
      await Promise.resolve()
      await nextTick()
      await new Promise(r => setTimeout(r, 0))
    }
    await flush()

    // Assert our spy captured canonical via useSeoMeta
    expect(seoSpy).toHaveBeenCalled()
    const first = seoSpy.mock.calls[0] as [Record<string, unknown>]
    const arg = first[0]
    expect(arg.ogUrl).toBe(expectedCanonical)

    wrapper.unmount()
  })
})
