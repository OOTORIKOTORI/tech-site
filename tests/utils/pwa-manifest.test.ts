import { describe, it, expect } from 'vitest'
import { validateManifest, validateIcons, calculateManifestScore } from '@/utils/pwa-manifest'

describe('utils/pwa-manifest: validateManifest', () => {
  it('reports errors and warnings for empty manifest', () => {
    const results = validateManifest({})
    const errors = results.filter(r => r.status === 'error')
    const warnings = results.filter(r => r.status === 'warning')
    expect(errors.length).toBe(2) // name/short_name missing, icons missing
    expect(warnings.length).toBeGreaterThanOrEqual(4) // start_url, display, theme/background

    const score = calculateManifestScore(results)
    expect(score).toBe(40) // 100 - 2*20 - 4*5 = 40
  })

  it('accepts a well-formed manifest', () => {
    const manifest = {
      name: 'Demo App',
      start_url: '/',
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#ffffff',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }
    const results = validateManifest(manifest)
    // well-formed manifest should have all checks OK
    expect(results.every(r => r.status === 'ok')).toBe(true)
    // There should be no errors when required fields are present
    expect(results.some(r => r.status === 'error')).toBe(false)
    const score = calculateManifestScore(results)
    expect(score).toBe(100)
  })
})

describe('utils/pwa-manifest: validateIcons', () => {
  it('checks for recommended and optional sizes', () => {
    const manifest = {
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }
    const icons = validateIcons(manifest)
    const recommendedOk = icons
      .filter(i => i.size === '192x192' || i.size === '512x512')
      .every(i => i.status === 'ok')
    expect(recommendedOk).toBe(true)
    // Optional sizes may be warning (missing)
    expect(icons.some(i => i.status === 'warning')).toBe(true)
  })
})
