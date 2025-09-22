/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, h, Suspense, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// Collect head calls
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
  // Content query
  // @ts-expect-error test shim
  globalThis.queryContent = () => ({
    where() {
      return this
    },
    findOne: () => makeDoc(),
  })
  vi.resetModules()
})

function getBlogJsonLd() {
  const scripts = headCalls.flatMap((h: any) => h?.script ?? [])
  const ld = scripts.find((s: any) => s?.type === 'application/ld+json')
  expect(ld).toBeTruthy()
  const obj = JSON.parse(ld.children)
  expect(obj['@type']).toBe('BlogPosting')
  return obj
}

describe('BlogPosting publisher.logo', () => {
  it('has absolute publisher.logo and correct name', async () => {
    const mod = await import('@/pages/blog/[slug].vue')
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

    const obj = getBlogJsonLd()
    expect(obj.publisher).toBeTruthy()
    expect(obj.publisher['@type']).toBe('Organization')
    expect(obj.publisher.name).toBe('Migaki Explorer')
    expect(obj.publisher.logo).toBeTruthy()
    expect(obj.publisher.logo['@type']).toBe('ImageObject')
    expect(obj.publisher.logo.url).toMatch(/^https:\/\/migakiexplorer\.jp\/logo\.png$/)
    expect(obj.publisher.logo.width).toBe(512)
    expect(obj.publisher.logo.height).toBe(512)
  })
})
