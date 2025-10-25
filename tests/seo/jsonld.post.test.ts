/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, Suspense, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// Collect head calls made via useHead/useServerHead
const headCalls: any[] = []

const route = { params: { slug: 'first-cron-tz' }, path: '/blog/first-cron-tz' }

function makeDoc() {
  return {
    _path: '/blog/first-cron-tz',
    title: 'Sample Title',
    description: 'Desc',
    date: '2025-09-20T00:00:00.000Z',
    updated: '2025-09-21T00:00:00.000Z',
    canonical: 'https://migakiexplorer.jp/blog/first-cron-tz',
    body: { children: [] },
  }
}

beforeEach(() => {
  headCalls.length = 0
  // @ts-expect-error test shim
  globalThis.useHead = (input: any) => {
    const cfg = typeof input === 'function' ? input() : input
    headCalls.push(cfg)
  }
  // @ts-expect-error test shim
  globalThis.useServerHead = (input: any) => {
    const cfg = typeof input === 'function' ? input() : input
    headCalls.push(cfg)
  }
  // Stubs for page
  // @ts-expect-error test shim
  globalThis.useRoute = () => route
  // @ts-expect-error test shim
  globalThis.useAsyncData = (_k: string, fn: () => any) => ({ data: { value: fn() } })
  // @ts-expect-error test shim
  globalThis.createError = (err: any) => {
    throw err
  }
  // @ts-expect-error test shim
  globalThis.useSeoMeta = () => {}
  // @ts-expect-error test shim
  globalThis.useRuntimeConfig = () => ({
    public: { siteOrigin: 'https://migakiexplorer.jp', siteName: '磨きエクスプローラー' },
  })
  // expose queryContent on global
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
  // definePageMeta stub for Nuxt SFC
  // @ts-expect-error test stub
  globalThis.definePageMeta = () => {}
  // resolveSiteUrl used by page imports
  vi.resetModules()
})

describe('pages/blog/[slug].vue JSON-LD', () => {
  it(
    'injects BlogPosting JSON-LD via children with @type and headline',
    { timeout: 10000 },
    async () => {
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

      // Let async setup resolve
      await Promise.resolve()
      await nextTick()
      await new Promise(r => setTimeout(r, 0))

      const scripts = headCalls.flatMap((h: any) => h?.script ?? [])
      const ld = scripts.find((s: any) => s?.type === 'application/ld+json')
      expect(ld).toBeTruthy()
      const obj = JSON.parse(ld.children)
      expect(obj['@context']).toBe('https://schema.org')
      expect(obj['@type']).toBe('BlogPosting')
      expect(typeof obj.headline).toBe('string')
      expect(obj.headline.length).toBeGreaterThan(0)
    }
  )
})
