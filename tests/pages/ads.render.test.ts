import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

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
  })

  it('SSR/Prod: injects adsbygoogle script', async () => {
    // @ts-expect-error: defineNuxtPlugin is not typed in this test context
    globalThis.import = { meta: { dev: false } }
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
