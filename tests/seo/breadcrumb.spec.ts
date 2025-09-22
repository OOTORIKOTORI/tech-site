import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('buildBreadcrumbJsonLd', () => {
  beforeEach(() => {
    // ensure resolveSiteUrl uses env origin
    vi.stubEnv('NUXT_PUBLIC_SITE_ORIGIN', 'https://migakiexplorer.jp')
  })

  it('builds correct BreadcrumbList object', async () => {
    const { buildBreadcrumbJsonLd } = await import('@/composables/useBreadcrumbJsonLd')
    const obj: any = buildBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: 'Post', url: '/blog/hello' },
    ])

    expect(obj['@context']).toBe('https://schema.org')
    expect(obj['@type']).toBe('BreadcrumbList')
    const els = obj.itemListElement
    expect(Array.isArray(els)).toBe(true)
    expect(els).toHaveLength(3)
    expect(els[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://migakiexplorer.jp/',
    })
    expect(els[1]).toMatchObject({
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://migakiexplorer.jp/blog',
    })
    expect(els[2]).toMatchObject({
      '@type': 'ListItem',
      position: 3,
      name: 'Post',
      item: 'https://migakiexplorer.jp/blog/hello',
    })
  })
})
