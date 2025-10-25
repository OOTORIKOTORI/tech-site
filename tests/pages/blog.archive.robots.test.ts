/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense } from 'vue'

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

describe('pages/blog/archive.vue sets robots noindex,follow', () => {
  it('emits SSR head meta robots noindex,follow', async () => {
    const captured: any[] = []
    // @ts-expect-error test stub
    globalThis.useHead = (obj: any) => {
      captured.push(obj)
    }
    // @ts-expect-error test stub
    globalThis.useFetch = async () => ({
      data: { value: { blog: [], items: [] } },
      error: { value: null },
    })
    // Provide empty content
    // @ts-expect-error test stub
    globalThis.queryContent = () => ({
      sort() {
        return this
      },
      only() {
        return this
      },
      async find() {
        return []
      },
    })

    const mod = await import('@/pages/blog/archive.vue')
    const Comp = wrapperOf(mod.default)
    mount(Comp as any)

    await new Promise(r => setTimeout(r, 0))

    const meta = captured.find(x => Array.isArray(x?.meta))?.meta || []
    const robots = meta.find((m: any) => m?.name === 'robots')
    expect(robots?.content).toBe('noindex,follow')
  })
})
