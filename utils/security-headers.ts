/**
 * Security header validation utilities
 */

export interface SecurityHeaderCheck {
  header: string
  status: 'ok' | 'warning' | 'danger'
  message: string
  value?: string
  recommendation?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

/**
 * Validate security headers
 */
export function validateSecurityHeaders(headers: Record<string, string>): SecurityHeaderCheck[] {
  const checks: SecurityHeaderCheck[] = []

  // Normalize header keys to lowercase
  const normalizedHeaders: Record<string, string> = {}
  Object.keys(headers).forEach(key => {
    const value = headers[key]
    if (value) {
      normalizedHeaders[key.toLowerCase()] = value
    }
  })

  // 1. Content-Security-Policy
  const csp = normalizedHeaders['content-security-policy']
  if (!csp) {
    checks.push({
      header: 'Content-Security-Policy',
      status: 'danger',
      message: 'CSPヘッダが設定されていません',
      recommendation: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
      severity: 'critical',
    })
  } else {
    checks.push({
      header: 'Content-Security-Policy',
      status: 'ok',
      message: 'CSPヘッダが設定されています',
      value: csp.substring(0, 100) + (csp.length > 100 ? '...' : ''),
      severity: 'low',
    })
  }

  // 2. Strict-Transport-Security (HSTS)
  const hsts = normalizedHeaders['strict-transport-security']
  if (!hsts) {
    checks.push({
      header: 'Strict-Transport-Security',
      status: 'danger',
      message: 'HSTSヘッダが設定されていません（HTTPS必須）',
      recommendation: 'max-age=31536000; includeSubDomains',
      severity: 'critical',
    })
  } else {
    const maxAge = hsts.match(/max-age=(\d+)/)
    const age = maxAge && maxAge[1] ? parseInt(maxAge[1], 10) : 0
    if (age < 31536000) {
      checks.push({
        header: 'Strict-Transport-Security',
        status: 'warning',
        message: `HSTSのmax-ageが短すぎます（${age}秒）`,
        value: hsts,
        recommendation: 'max-age=31536000 (1年) 以上を推奨',
        severity: 'medium',
      })
    } else {
      checks.push({
        header: 'Strict-Transport-Security',
        status: 'ok',
        message: 'HSTSが適切に設定されています',
        value: hsts,
        severity: 'low',
      })
    }
  }

  // 3. X-Frame-Options
  const xfo = normalizedHeaders['x-frame-options']
  if (!xfo) {
    checks.push({
      header: 'X-Frame-Options',
      status: 'warning',
      message: 'X-Frame-Optionsが設定されていません（クリックジャッキング対策）',
      recommendation: 'DENY または SAMEORIGIN',
      severity: 'high',
    })
  } else if (!['DENY', 'SAMEORIGIN'].includes(xfo.toUpperCase())) {
    checks.push({
      header: 'X-Frame-Options',
      status: 'warning',
      message: `X-Frame-Optionsの値が推奨値ではありません: ${xfo}`,
      value: xfo,
      recommendation: 'DENY または SAMEORIGIN',
      severity: 'medium',
    })
  } else {
    checks.push({
      header: 'X-Frame-Options',
      status: 'ok',
      message: 'X-Frame-Optionsが適切に設定されています',
      value: xfo,
      severity: 'low',
    })
  }

  // 4. X-Content-Type-Options
  const xcto = normalizedHeaders['x-content-type-options']
  if (!xcto) {
    checks.push({
      header: 'X-Content-Type-Options',
      status: 'warning',
      message: 'X-Content-Type-Optionsが設定されていません（MIME sniffing対策）',
      recommendation: 'nosniff',
      severity: 'medium',
    })
  } else if (xcto.toLowerCase() !== 'nosniff') {
    checks.push({
      header: 'X-Content-Type-Options',
      status: 'warning',
      message: `X-Content-Type-Optionsの値が不正です: ${xcto}`,
      value: xcto,
      recommendation: 'nosniff',
      severity: 'medium',
    })
  } else {
    checks.push({
      header: 'X-Content-Type-Options',
      status: 'ok',
      message: 'X-Content-Type-Optionsが適切に設定されています',
      value: xcto,
      severity: 'low',
    })
  }

  // 5. Referrer-Policy
  const rp = normalizedHeaders['referrer-policy']
  const recommendedPolicies = [
    'no-referrer',
    'no-referrer-when-downgrade',
    'strict-origin',
    'strict-origin-when-cross-origin',
  ]
  if (!rp) {
    checks.push({
      header: 'Referrer-Policy',
      status: 'warning',
      message: 'Referrer-Policyが設定されていません',
      recommendation: 'strict-origin-when-cross-origin または no-referrer',
      severity: 'medium',
    })
  } else if (!recommendedPolicies.includes(rp.toLowerCase())) {
    checks.push({
      header: 'Referrer-Policy',
      status: 'warning',
      message: `Referrer-Policyが推奨値ではありません: ${rp}`,
      value: rp,
      recommendation: 'strict-origin-when-cross-origin',
      severity: 'low',
    })
  } else {
    checks.push({
      header: 'Referrer-Policy',
      status: 'ok',
      message: 'Referrer-Policyが適切に設定されています',
      value: rp,
      severity: 'low',
    })
  }

  // 6. Permissions-Policy
  const pp = normalizedHeaders['permissions-policy']
  if (!pp) {
    checks.push({
      header: 'Permissions-Policy',
      status: 'warning',
      message: 'Permissions-Policyが設定されていません（機能制限）',
      recommendation: 'geolocation=(), microphone=(), camera=()',
      severity: 'low',
    })
  } else {
    checks.push({
      header: 'Permissions-Policy',
      status: 'ok',
      message: 'Permissions-Policyが設定されています',
      value: pp.substring(0, 100) + (pp.length > 100 ? '...' : ''),
      severity: 'low',
    })
  }

  // 7. Cross-Origin-Opener-Policy
  const coop = normalizedHeaders['cross-origin-opener-policy']
  if (!coop) {
    checks.push({
      header: 'Cross-Origin-Opener-Policy',
      status: 'warning',
      message: 'Cross-Origin-Opener-Policyが設定されていません',
      recommendation: 'same-origin',
      severity: 'low',
    })
  } else {
    checks.push({
      header: 'Cross-Origin-Opener-Policy',
      status: 'ok',
      message: 'Cross-Origin-Opener-Policyが設定されています',
      value: coop,
      severity: 'low',
    })
  }

  // 8. Cross-Origin-Embedder-Policy
  const coep = normalizedHeaders['cross-origin-embedder-policy']
  if (!coep) {
    checks.push({
      header: 'Cross-Origin-Embedder-Policy',
      status: 'warning',
      message: 'Cross-Origin-Embedder-Policyが設定されていません',
      recommendation: 'require-corp',
      severity: 'low',
    })
  } else {
    checks.push({
      header: 'Cross-Origin-Embedder-Policy',
      status: 'ok',
      message: 'Cross-Origin-Embedder-Policyが設定されています',
      value: coep,
      severity: 'low',
    })
  }

  return checks
}

/**
 * Calculate security score (0-100)
 */
export function calculateSecurityScore(checks: SecurityHeaderCheck[]): number {
  let score = 100
  const criticalIssues = checks.filter(c => c.status !== 'ok' && c.severity === 'critical').length
  const highIssues = checks.filter(c => c.status !== 'ok' && c.severity === 'high').length
  const mediumIssues = checks.filter(c => c.status !== 'ok' && c.severity === 'medium').length
  const lowIssues = checks.filter(c => c.status !== 'ok' && c.severity === 'low').length

  score -= criticalIssues * 25
  score -= highIssues * 15
  score -= mediumIssues * 10
  score -= lowIssues * 5

  return Math.max(0, score)
}
