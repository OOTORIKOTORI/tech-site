import { describe, it, expect } from 'vitest'
import { analyzeSite } from '@/utils/site-check'

const headersOk = {
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer-when-downgrade',
  'Permissions-Policy': 'geolocation=()',
}

describe('analyzeSite (meta/canonical/json-ld & security headers)', () => {
  it('normal case: absolute canonical, matching og:url, absolute image, JSON-LD Article', () => {
    const finalUrl = 'https://example.com/post'
    const html = `<!doctype html><html><head>
      <title>Post title</title>
      <meta name="description" content="Desc" />
      <link rel="canonical" href="https://example.com/post" />
      <meta property="og:url" content="https://example.com/post" />
      <meta property="og:title" content="Post title" />
      <meta property="og:description" content="Desc" />
      <meta property="og:image" content="https://example.com/img.png" />
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"H","datePublished":"2024-01-01"}</script>
    </head><body></body></html>`
    const res = analyzeSite(html, finalUrl, headersOk)
    expect(res.meta.checks.hasTitle).toBe(true)
    expect(res.meta.checks.hasDescription).toBe(true)
    expect(res.meta.checks.hasCanonical).toBe(true)
    expect(res.meta.checks.canonicalIsAbsolute).toBe(true)
    expect(res.meta.checks.canonicalSelfRefOk).toBe(true)
    expect(res.meta.checks.ogUrlMatches).toBe(true)
    expect(res.meta.checks.ogImageAbsolute).toBe(true)
    expect(res.jsonld.count).toBe(1)
    expect(res.jsonld.types).toContain('Article')
    expect(res.security.headers['content-security-policy']).toBe(true)
  })

  it('missing case: no canonical and no description -> warnings', () => {
    const finalUrl = 'https://example.com/'
    const html = `<!doctype html><html><head>
      <title>Home</title>
      <meta property="og:image" content="https://example.com/og.png" />
    </head><body></body></html>`
    const res = analyzeSite(html, finalUrl, {})
    expect(res.meta.checks.hasTitle).toBe(true)
    expect(res.meta.checks.hasDescription).toBe(false)
    expect(res.meta.checks.hasCanonical).toBe(false)
    expect(res.meta.warnings.some(w => /canonical.*欠落/.test(w))).toBe(true)
    expect(res.meta.warnings.some(w => /description.*欠落/.test(w))).toBe(true)
  })

  it('relative case: canonical and og:image are relative -> flagged', () => {
    const finalUrl = 'https://example.com/page'
    const html = `<!doctype html><html><head>
      <title>Rel</title>
      <meta name="description" content="D" />
      <link rel="canonical" href="/page" />
      <meta property="og:url" content="https://example.com/page?utm=1" />
      <meta property="og:image" content="/img.png" />
    </head><body></body></html>`
    const res = analyzeSite(html, finalUrl, {})
    expect(res.meta.checks.hasCanonical).toBe(true)
    expect(res.meta.checks.canonicalIsAbsolute).toBe(false)
    expect(res.meta.warnings.some(w => /canonical.*相対URL/.test(w))).toBe(true)
    expect(res.meta.checks.ogImageAbsolute).toBe(false)
    expect(res.meta.warnings.some(w => /og:image.*相対URL/.test(w))).toBe(true)
    // og:url is different by query but normalized comparison should ignore query -> mismatch
    expect(res.meta.checks.ogUrlMatches).toBe(false)
  })
})
