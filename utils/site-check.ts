export type SecurityHeaderName =
  | 'content-security-policy'
  | 'strict-transport-security'
  | 'x-content-type-options'
  | 'x-frame-options'
  | 'referrer-policy'
  | 'permissions-policy'
  | 'cross-origin-opener-policy'
  | 'cross-origin-resource-policy'
  | 'cross-origin-embedder-policy'
  | 'x-xss-protection'

export interface SiteMetaAnalysis {
  finalUrl: string
  meta: {
    title?: string
    description?: string
    canonical?: string
    og: {
      url?: string
      title?: string
      description?: string
      image?: string
    }
    twitter: {
      card?: string
    }
    checks: {
      hasTitle: boolean
      hasDescription: boolean
      hasCanonical: boolean
      canonicalIsAbsolute: boolean | null
      canonicalSelfRefOk: boolean | null
      ogImageAbsolute: boolean | null
      ogUrlMatches: boolean | null
    }
    warnings: string[]
  }
  jsonld: {
    count: number
    types: string[]
    // Picked key properties only (no full dump)
    samples: Array<{ type: string; props: Record<string, unknown> }>
  }
  security: {
    headers: Record<SecurityHeaderName, boolean>
  }
}

function toHeadersMap(headers: Headers | Record<string, string> | undefined) {
  const map = new Map<string, string>()
  if (!headers) return map
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    headers.forEach((v, k) => map.set(k.toLowerCase(), v))
  } else {
    for (const [k, v] of Object.entries(headers)) map.set(k.toLowerCase(), String(v))
  }
  return map
}

function isAbsoluteUrl(u: string | undefined | null) {
  if (!u) return false
  try {
    const url = new URL(u)
    return !!url.protocol && !!url.host
  } catch {
    return false
  }
}

function normalizeForSelfRef(u: string) {
  const url = new URL(u)
  url.hash = ''
  url.search = ''
  // normalize trailing slash: keep only for root
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
  }
  return url.toString()
}

function normalizeForCompareKeepSearch(u: string) {
  const url = new URL(u)
  url.hash = ''
  // keep search as-is
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
  }
  return url.toString()
}

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

function pickPropsByType(obj: Record<string, JSONValue>): Record<string, unknown> {
  const tRaw = (obj['@type'] as unknown) ?? (obj['type'] as unknown)
  const type = Array.isArray(tRaw) ? String(tRaw[0]) : tRaw ? String(tRaw) : ''
  const safe = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? v : undefined)
  if (type === 'Article' || type === 'BlogPosting') {
    const authorVal = obj['author'] as unknown
    const publisherVal = obj['publisher'] as unknown
    const authorName =
      authorVal && typeof authorVal === 'object' && !Array.isArray(authorVal)
        ? safe((authorVal as Record<string, unknown>)['name'])
        : safe(authorVal)
    const publisherName =
      publisherVal && typeof publisherVal === 'object' && !Array.isArray(publisherVal)
        ? safe((publisherVal as Record<string, unknown>)['name'])
        : safe(publisherVal)
    return {
      headline: safe(obj['headline']),
      datePublished: safe(obj['datePublished']),
      author: authorName,
      publisher: publisherName,
    }
  }
  if (type === 'Organization' || type === 'WebSite') {
    return { name: safe(obj['name']) }
  }
  if (type === 'BreadcrumbList') {
    const ile = obj['itemListElement'] as unknown
    const len = Array.isArray(ile) ? ile.length : undefined
    return { itemListLength: len }
  }
  return {}
}

export function analyzeSite(
  html: string,
  finalUrl: string,
  headers?: Headers | Record<string, string>
): SiteMetaAnalysis {
  const h = toHeadersMap(headers)
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const title = (doc.querySelector('title')?.textContent || '').trim() || undefined
  const description =
    (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim() ||
    undefined
  const canonical =
    (doc.querySelector('link[rel~="canonical"]')?.getAttribute('href') || '').trim() || undefined
  const ogUrl =
    (doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || '').trim() ||
    undefined
  const ogTitle =
    (doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '').trim() ||
    undefined
  const ogDesc =
    (doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '').trim() ||
    undefined
  const ogImage =
    (doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '').trim() ||
    undefined
  const twitterCard =
    (doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '').trim() ||
    undefined

  const warnings: string[] = []
  const hasCanonical = !!canonical
  const canonicalIsAbs = hasCanonical ? isAbsoluteUrl(canonical) : null
  let canonicalSelfRefOk: boolean | null = null
  if (hasCanonical && canonicalIsAbs) {
    try {
      const n1 = normalizeForSelfRef(finalUrl)
      const n2 = normalizeForSelfRef(new URL(canonical!).toString())
      canonicalSelfRefOk = n1 === n2
    } catch {
      canonicalSelfRefOk = null
    }
  } else if (hasCanonical && !canonicalIsAbs) {
    warnings.push('canonical が相対URLです')
  } else {
    warnings.push('canonical が欠落しています')
  }

  const ogImageAbsolute = ogImage ? isAbsoluteUrl(ogImage) : null
  if (ogImage && ogImageAbsolute === false) warnings.push('og:image が相対URLです')

  let ogUrlMatches: boolean | null = null
  if (ogUrl) {
    try {
      // For og:url, query parameters are significant; compare with search kept
      ogUrlMatches =
        normalizeForCompareKeepSearch(ogUrl) === normalizeForCompareKeepSearch(finalUrl)
      if (!ogUrlMatches) warnings.push('og:url が最終URLと一致しません')
    } catch {
      ogUrlMatches = null
    }
  }

  if (!title) warnings.push('title が欠落しています')
  if (!description) warnings.push('meta description が欠落しています')
  // OGP 必須/推奨
  if (!ogTitle) warnings.push('og:title が欠落しています（必須）')
  if (!ogDesc) warnings.push('og:description が欠落しています（必須）')
  if (!ogImage) warnings.push('og:image が欠落しています（必須）')
  if (!ogUrl) warnings.push('og:url が欠落しています（推奨）')
  if (!twitterCard) warnings.push('twitter:card が欠落しています（推奨）')

  // JSON-LD
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  const items: Record<string, JSONValue>[] = []
  for (const s of scripts) {
    const txt = s.textContent?.trim()
    if (!txt) continue
    try {
      const parsed = JSON.parse(txt)
      if (Array.isArray(parsed)) items.push(...(parsed as Record<string, JSONValue>[]))
      else items.push(parsed as Record<string, JSONValue>)
    } catch {
      // ignore invalid JSON-LD
    }
  }
  const types: string[] = Array.from(
    new Set(
      items
        .map(o => (o && ((o['@type'] as unknown) ?? (o['type'] as unknown))) as unknown)
        .flatMap(t => (Array.isArray(t) ? [t[0]] : t ? [t] : []))
        .map(t => String(t))
    )
  )
  const samples = items.slice(0, 3).map(o => {
    const t = o && ((o['@type'] as unknown) ?? (o['type'] as unknown))
    const type = Array.isArray(t) ? String(t[0]) : t ? String(t) : ''
    return { type, props: pickPropsByType(o) }
  })

  // Security headers
  const needed: SecurityHeaderName[] = [
    'content-security-policy',
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'permissions-policy',
    'cross-origin-opener-policy',
    'cross-origin-resource-policy',
    'cross-origin-embedder-policy',
    'x-xss-protection',
  ]
  const sec = {} as Record<SecurityHeaderName, boolean>
  for (const k of needed) {
    sec[k] = h.has(k) || (k === 'permissions-policy' && h.has('permission-policy'))
  }

  return {
    finalUrl,
    meta: {
      title,
      description,
      canonical,
      og: { url: ogUrl, title: ogTitle, description: ogDesc, image: ogImage },
      twitter: { card: twitterCard },
      checks: {
        hasTitle: !!title,
        hasDescription: !!description,
        hasCanonical,
        canonicalIsAbsolute: canonicalIsAbs,
        canonicalSelfRefOk,
        ogImageAbsolute,
        ogUrlMatches,
      },
      warnings,
    },
    jsonld: {
      count: items.length,
      types,
      samples,
    },
    security: {
      headers: sec,
    },
  }
}
