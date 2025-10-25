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

describe('tools page shows related Primer cards (0-3)', () => {
  beforeEach(() => {
    // Reset head hooks
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
  })

  it('renders up to 3 primer links for tool:jwt-decode', { timeout: 10000 }, async () => {
    // Stub useFetch to return mixed blog items
    // @ts-expect-error test stub
    globalThis.useFetch = async () => ({
      data: {
        value: {
          blog: [
            {
              _path: '/blog/jwt-decode-basics',
              title: 'JWT入門',
              type: 'primer',
              tool: 'jwt-decode',
              visibility: 'default',
              robots: 'index,follow',
            },
            {
              _path: '/blog/jwt-verify-basics',
              title: 'JWT Verify入門',
              type: 'primer',
              tool: 'jwt-decode',
              robots: 'index',
            },
            { _path: '/blog/other-note', title: 'その他', type: 'note' },
            {
              _path: '/blog/hidden',
              title: '非表示',
              type: 'primer',
              tool: 'jwt-decode',
              visibility: 'hidden',
            },
          ],
        },
      },
    })

    const mod = await import('@/pages/tools/jwt-decode.vue')
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

    await new Promise(r => setTimeout(r, 0))

    const aTags = wrapper.findAll('a[href^="/blog/"]')
    const hrefs = aTags.map(a => a.attributes('href'))
    expect(hrefs).toContain('/blog/jwt-decode-basics')
    expect(hrefs).toContain('/blog/jwt-verify-basics')
    expect(hrefs).not.toContain('/blog/hidden')
  })
})
