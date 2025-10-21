import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

describe('ads SSR/Dev script injection', () => {
  const originalEnv = process.env
  beforeEach(() => {
    // @ts-expect-error: defineNuxtPlugin is injected for test stub in vitest
    globalThis.defineNuxtPlugin = (fn: any) => fn
    // @ts-expect-error: globalThis.useHead is injected for test stub in vitest
    globalThis.useHead = () => undefined
    // @ts-expect-error: globalThis.useSeoMeta is injected for test stub in vitest
    globalThis.useSeoMeta = () => undefined
    // @ts-expect-error: globalThis.useRequestURL is injected for test stub in vitest
    globalThis.useRequestURL = () => ({ origin: 'https://kotorilab.jp' })
    // @ts-expect-error: globalThis.useRoute is injected for test stub in vitest
    globalThis.useRoute = () => ({ fullPath: '/ads' })
    // @ts-expect-error: globalThis.useRuntimeConfig is injected for test stub in vitest
    globalThis.useRuntimeConfig = () => ({
      public: {
        siteOrigin: 'https://migakiexplorer.jp',
        siteName: '磨きエクスプローラー',
        enableAds: '1',
        adsenseClient: 'ca-pub-xxxx',
      },
    })
    process.env = { ...originalEnv }
    // モジュールキャッシュをクリアしてプラグインが毎回新しく実行されるようにする
    vi.resetModules()
  })

  it('SSR/Prod: injects adsbygoogle script', async () => {
    // @ts-expect-error: defineNuxtPlugin is not typed in this test context
    globalThis.import = { meta: { dev: false } }
    // Prod環境を模擬
    process.env.NODE_ENV = 'production'
    const mod = await import('../../plugins/ads')
    // useHeadが呼ばれるかを監視
    const spy = vi.fn()
    ;(globalThis as any).useHead = spy
    // 実行
    mod.default({
      hooks: {
        hook: (_ev: string, cb: () => void) => {
          cb()
          return undefined
        },
      },
    } as any)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        script: [
          expect.objectContaining({
            src: expect.stringContaining('adsbygoogle.js?client=ca-pub-xxxx'),
          }),
        ],
      })
    )
  })

  it('Dev: does not inject adsbygoogle script', async () => {
    // @ts-expect-error: useHead is not typed in this test context
    globalThis.import = { meta: { dev: true } }
    // Dev環境を模擬（デフォルトで非production）
    process.env.NODE_ENV = 'development'
    const mod = await import('../../plugins/ads')
    const spy = vi.fn()
    ;(globalThis as any).useHead = spy
    mod.default({
      hooks: {
        hook: (_ev: string, cb: () => void) => {
          cb()
          return undefined
        },
      },
    } as any)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('pages/ads.vue', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
    // @ts-expect-error test stub
    globalThis.useSeoMeta = () => undefined
    // @ts-expect-error test stub
    globalThis.useRequestURL = () => ({ origin: 'https://kotorilab.jp' })
    // @ts-expect-error test stub
    globalThis.useRoute = () => ({ fullPath: '/ads' })
    // @ts-expect-error test stub
    globalThis.useRuntimeConfig = () => ({
      public: { siteOrigin: 'https://migakiexplorer.jp', siteName: '磨きエクスプローラー' },
    })
  })

  it('renders h1 and required policy links', async () => {
    const mod = await import('@/pages/ads.vue')
    const wrapper = mount(mod.default as any, {
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

    const html = wrapper.html()

    // H1
    expect(html).toMatch(/<h1[^>]*>広告について<\/h1>/)

    // /ads.txt へのリンクが 1 件以上
    const adsTxtLinks = wrapper
      .findAll('a')
      .filter(a => (a.attributes('href') || '').includes('/ads.txt'))
    expect(adsTxtLinks.length).toBeGreaterThanOrEqual(1)

    // adssettings.google.com へのリンクが 1 件以上
    const settingsLinks = wrapper
      .findAll('a')
      .filter(a => (a.attributes('href') || '').includes('adssettings.google.com'))
    expect(settingsLinks.length).toBeGreaterThanOrEqual(1)

    // /privacy と /contact へのリンク
    expect(wrapper.find('a[href="/privacy"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/contact"]').exists()).toBe(true)
  })
})
