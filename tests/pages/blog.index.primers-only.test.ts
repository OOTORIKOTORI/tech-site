/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, Suspense, nextTick } from 'vue'

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

describe('pages/blog/index.vue primers-only listing', () => {
  beforeEach(() => {
    // Stub useFetch used by page
    // @ts-expect-error test shim
    globalThis.useFetch = async () => ({
      data: {
        value: {
          blog: [
            {
              _path: '/blog/a-note',
              title: 'Note',
              date: '2025-01-01',
              tags: ['misc'],
              type: 'guide',
              visibility: 'archive',
            },
            {
              _path: '/blog/a-primer',
              title: 'Primer',
              date: '2025-01-02',
              tags: ['tool:cron-jst'],
              type: 'primer',
              visibility: 'primer',
            },
          ],
        },
      },
      error: { value: null },
    })
    // Stubs for SEO hooks (unused here)
    // @ts-expect-error test shim
    globalThis.useHead = () => undefined
    // @ts-expect-error test shim
    globalThis.useSeoMeta = () => undefined
  })

  it('renders only primers (visibility=primer)', async () => {
    const mod = await import('@/pages/blog/index.vue')
    const Comp = wrapperOf(mod.default)
    const wrapper = mount(Comp as any, {
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

    // Let suspense resolve
    await Promise.resolve()
    await nextTick()
    await new Promise(r => setTimeout(r, 0))

    const items = wrapper.findAll('li[role="listitem"]')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('Primer')
    expect(wrapper.html()).not.toContain('/blog/a-note')
  })
})
