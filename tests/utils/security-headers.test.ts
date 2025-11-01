import { describe, it, expect } from 'vitest'
import { validateSecurityHeaders, calculateSecurityScore } from '@/utils/security-headers'

describe('utils/security-headers: validateSecurityHeaders', () => {
  it('empty headers -> many issues and score 0', () => {
    const checks = validateSecurityHeaders({})
    const score = calculateSecurityScore(checks)
    // Should include critical issues for CSP and HSTS
    expect(checks.some(c => c.header === 'Content-Security-Policy' && c.status === 'danger')).toBe(
      true
    )
    expect(
      checks.some(c => c.header === 'Strict-Transport-Security' && c.status === 'danger')
    ).toBe(true)
    expect(score).toBe(0)
  })

  it('all best-practice headers -> score 100', () => {
    const headers: Record<string, string> = {
      'Content-Security-Policy': "default-src 'self'; script-src 'self'", // basic CSP
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
    const checks = validateSecurityHeaders(headers)
    expect(checks.every(c => c.status === 'ok')).toBe(true)
    const score = calculateSecurityScore(checks)
    expect(score).toBe(100)
  })
})
