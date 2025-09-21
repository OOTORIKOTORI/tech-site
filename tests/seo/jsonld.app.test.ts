import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense, nextTick } from 'vue'

// Collect head calls made via useHead/useServerHead
const headCalls: any[] = []

beforeEach(() => {
  headCalls.length = 0
  // @ts-expect-error test shim
  globalThis.useHead = (input: any) => {
    const cfg = typeof input === 'function' ? input() : input
    headCalls.push(cfg)
  }
  // app.vue may call useServerHead if available; map to same collector
  // @ts-expect-error test shim
  globalThis.useServerHead = (input: any) => {
    const cfg = typeof input === 'function' ? input() : input
    headCalls.push(cfg)
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
})

describe('app.vue JSON-LD', () => {
  it('injects Organization JSON-LD via children', async () => {
    const mod = await import('@/app.vue')
    const App = mod.default

    const Wrapper = defineComponent({
      setup() {
        return () => h(Suspense, null, { default: () => h(App as any) })
      },
    })

    mount(Wrapper as any)

    // allow async microtasks and Suspense resolve
    await Promise.resolve(); await nextTick(); await new Promise(r => setTimeout(r, 0))

    const scripts = headCalls.flatMap((h: any) => h?.script ?? [])
    const ld = scripts.find((s: any) => s?.type === 'application/ld+json')
    expect(ld).toBeTruthy()
    const obj = JSON.parse(ld.children)
    expect(obj['@context']).toBe('https://schema.org')
    expect(obj['@type']).toBe('Organization')
  })
})
