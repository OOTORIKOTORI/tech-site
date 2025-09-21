import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense, nextTick } from 'vue'

// Provide useHead shim to push link tags to document.head for assertion
beforeEach(() => {
  // @ts-expect-error test shim
  globalThis.useHead = (input: any) => {
    const cfg = typeof input === 'function' ? input() : input
    const links: Array<Record<string, string>> = cfg?.link || []
    for (const l of links) {
      const el = document.createElement('link')
      Object.entries(l).forEach(([k, v]) => el.setAttribute(k, String(v)))
      document.head.appendChild(el)
    }
  }
  // minimal stubs used by app.vue
  // @ts-expect-error test shim
  globalThis.useSeoMeta = () => {}
  // @ts-expect-error test shim
  globalThis.computed = (fn: any) => ({ value: fn() })
  // @ts-expect-error test shim
  globalThis.useAppConfig = () => ({ site: {} })
  // @ts-expect-error test shim
  globalThis.useRequestURL = () => ({ origin: 'http://localhost:3000' })
  // @ts-expect-error test shim
  globalThis.useRoute = () => ({ fullPath: '/' })
  // @ts-expect-error test shim
  globalThis.useRuntimeConfig = () => ({ public: { siteOrigin: 'https://migakiexplorer.jp', siteName: '磨きエクスプローラー' } })
})

describe('app.vue injects global RSS link', () => {
  it('adds <link rel="alternate" type="application/rss+xml" href="/feed.xml">', async () => {
    const mod = await import('@/app.vue')
    const App = mod.default

    const Wrapper = defineComponent({
      setup() {
        return () => h(Suspense, null, { default: () => h(App as any) })
      },
    })

    mount(Wrapper as any)

    // allow any microtasks
    await Promise.resolve()
    await nextTick()

    const link = document.head.querySelector(
      'link[rel="alternate"][type="application/rss+xml"][href="/feed.xml"]'
    ) as HTMLLinkElement | null

    expect(link).not.toBeNull()
    expect(link?.getAttribute('title')).toBe('磨きエクスプローラー Blog')
  })
})
