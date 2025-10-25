/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
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

interface Doc {
  _path: string
  title?: string
  description?: string
  date?: string
  type?: string
  visibility?: string
  robots?: string
}
function makeListStub(list: Doc[]) {
  return () => ({
    sort() {
      return this
    },
    only() {
      return this
    },
    async find() {
      return list
    },
  })
}

describe('pages/blog/index.vue filters to primers only', () => {
  beforeEach(() => {
    // @ts-expect-error test stub
    globalThis.useAsyncData = async (_key: string, fn: () => any) => ({
      data: { value: await fn() },
    })
    // Capture head but ignore
    // @ts-expect-error test stub
    globalThis.useHead = () => undefined
  })

  it('includes only visibility=primer', async () => {
    const fixtures: Doc[] = [
      {
        _path: '/blog/a',
        title: 'A (primer)',
        date: '2025-01-01',
        type: 'primer',
        robots: 'index,follow',
        visibility: 'primer',
      },
      {
        _path: '/blog/b',
        title: 'B (archive)',
        date: '2025-01-02',
        type: 'guide',
        robots: 'noindex,follow',
        visibility: 'archive',
      },
      {
        _path: '/blog/c',
        title: 'C (guide)',
        date: '2025-01-03',
        type: 'guide',
        robots: 'index,follow',
        visibility: 'primer',
      },
      {
        _path: '/blog/d',
        title: 'D (primer as archive)',
        date: '2025-01-04',
        type: 'primer',
        visibility: 'archive',
      },
      {
        _path: '/blog/e',
        title: 'E (primer)',
        date: '2025-01-05',
        type: 'primer',
        robots: 'index',
        visibility: 'primer',
      },
      {
        _path: '/blog/f',
        title: 'F (hidden)',
        date: '2025-01-06',
        type: 'primer',
        visibility: 'hidden',
      },
    ]
    // @ts-expect-error test stub
    globalThis.queryContent = makeListStub(fixtures)

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

    await new Promise(r => setTimeout(r, 0))

    const links = wrapper.findAll('ul[data-testid="blog-list"] a')
    const hrefs = links.map(a => a.attributes('href'))
    // Only visibility=primer should be included (a, c, e)
    expect(hrefs).toContain('/blog/a')
    expect(hrefs).toContain('/blog/c')
    expect(hrefs).toContain('/blog/e')
    // archive and hidden should be excluded
    expect(hrefs).not.toContain('/blog/b')
    expect(hrefs).not.toContain('/blog/d')
    expect(hrefs).not.toContain('/blog/f')
  })
})
