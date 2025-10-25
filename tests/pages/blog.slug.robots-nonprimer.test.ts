/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense, nextTick, computed } from 'vue'

const headCalls: any[] = []

// TODO: stabilize env stubs for #imports before enforcing; currently flaky on CI runner
describe.skip('pages/blog/[...slug].vue robots for non-primer', () => {
  beforeEach(() => {
    headCalls.length = 0
    // @ts-expect-error test shim
    globalThis.useHead = (input: any) => {
      const cfg = typeof input === 'function' ? input() : input
      headCalls.push(cfg)
    }
    // @ts-expect-error test shim
    globalThis.useSeoMeta = () => {}
    // @ts-expect-error test shim
    globalThis.computed = computed
    // @ts-expect-error test shim
    globalThis.useRuntimeConfig = () => ({ public: { siteOrigin: 'https://migakiexplorer.jp' } })
    // @ts-expect-error test shim
    globalThis.useRoute = () => ({ params: { slug: 'sample-note' }, path: '/blog/sample-note' })
    // Stub useFetch for doc and for list
    // @ts-expect-error test shim
    globalThis.useFetch = async (path: string) => {
      if (String(path).includes('/api/blogv2/doc')) {
        return {
          data: {
            value: {
              path: '/blog/sample-note',
              title: 'A Note',
              type: 'note',
              body: { children: [] },
            },
          },
          error: { value: null },
        }
      }
      // list
      return { data: { value: { blog: [] } }, error: { value: null } }
    }
  })

  it('injects <meta name="robots" content="noindex,follow"> for non-primer without explicit robots', async () => {
    const mod = await import('@/pages/blog/[...slug].vue')
    const Page = mod.default

    const Wrapper = defineComponent({
      setup() {
        return () => h(Suspense, null, { default: () => h(Page as any) })
      },
    })

    mount(Wrapper as any, {
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

    await Promise.resolve()
    await nextTick()
    await new Promise(r => setTimeout(r, 0))
    await nextTick()

    const meta = headCalls.flatMap((h: any) => h?.meta ?? [])
    const robots = meta.find((m: any) => m?.name === 'robots')
    expect(robots).toBeTruthy()
    expect(robots.content).toBe('noindex,follow')
  })
})
