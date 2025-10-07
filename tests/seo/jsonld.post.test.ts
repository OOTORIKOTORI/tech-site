/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, Suspense, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// Collect head calls made via useHead/useServerHead
const headCalls: any[] = []

// Ensure absolute URL assembly in tests
process.env.NUXT_PUBLIC_SITE_ORIGIN =
  process.env.NUXT_PUBLIC_SITE_ORIGIN || 'https://migakiexplorer.jp'

const route = { params: { slug: 'welcome' }, path: '/blog/welcome' }

function makeDoc() {
  return {
    _path: '/blog/welcome',
    title: 'Welcome',
    description:
      '小さく作って、少しずつ良くしていくためのメモと記事を公開。実践ノート・運用のコツ・小さなツール・トラブル事例を共有。',
    date: '2025-10-07T00:00:00.000Z',
    updated: '2025-10-07T00:00:00.000Z',
    canonical: 'https://migakiexplorer.jp/blog/welcome',
    body: { children: [] },
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
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
  globalThis.useAsyncData = async (_k: string, fn: () => any) => ({ data: { value: await fn() } })
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

  // Stub global fetch and $fetch to resolve /api/blogv2/doc?path=/blog/welcome
  const welcomeDoc = {
    _path: '/blog/welcome',
    title: 'Welcome',
    description: 'ブログ再始動。今後はこちらから更新していきます。',
    date: '2025-10-07',
    published: true,
    tags: [],
    robots: null,
    body: {
      type: 'root',
      children: [
        { type: 'element', tag: 'p', props: {}, children: [{ type: 'text', value: 'hello' }] },
      ],
    },
  }

  // Stub global fetch (used by useFetch/ohmyfetch under the hood)
  vi.stubGlobal('fetch', (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? ''
    if (url.includes('/api/blogv2/doc') && url.includes('path=%2Fblog%2Fwelcome')) {
      return Promise.resolve(
        new Response(JSON.stringify(welcomeDoc), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    return Promise.resolve(new Response('Not Found', { status: 404 }))
  })

  // Stub $fetch (when tests call it directly)
  vi.stubGlobal('$fetch', (url: string, opts?: any) => {
    if (String(url).includes('/api/blogv2/doc')) {
      return Promise.resolve(welcomeDoc)
    }
    return Promise.resolve(undefined)
  })
  // resolveSiteUrl used by page imports
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pages/blog/[slug].vue JSON-LD', () => {
  it('injects BlogPosting JSON-LD via children with @type and headline', async () => {
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
  })
})
