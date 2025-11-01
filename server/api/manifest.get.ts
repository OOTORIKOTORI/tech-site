import { defineEventHandler, getQuery, createError } from 'h3'

/**
 * API endpoint to fetch and parse PWA manifest.json
 *
 * Query params:
 *   url: Target URL (page URL, not manifest URL)
 *
 * Returns:
 *   - manifestUrl: Resolved manifest URL
 *   - manifest: Parsed manifest object
 *   - pageUrl: Original page URL
 *   - error: Error message if any
 */

export default defineEventHandler(async event => {
  const q = getQuery(event) as Record<string, string | string[] | undefined>
  const raw = (q.url ?? '').toString().trim()

  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "url" query parameter' })
  }

  let pageUrl: URL
  try {
    pageUrl = new URL(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  // 1. Fetch the HTML page to find <link rel="manifest">
  let htmlContent: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(pageUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PWA-Manifest-Checker/1.0)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch page: ${response.statusText}`,
      })
    }

    htmlContent = await response.text()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw createError({ statusCode: 408, statusMessage: 'Request timeout' })
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch page: ${err.message}`,
    })
  }

  // 2. Parse HTML to find manifest link
  const manifestLinkMatch = htmlContent.match(
    /<link[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["'][^>]*>/i
  )
  if (!manifestLinkMatch || !manifestLinkMatch[1]) {
    return {
      pageUrl: pageUrl.toString(),
      manifestUrl: null,
      manifest: null,
      error: 'No <link rel="manifest"> found in page',
    }
  }

  const manifestHref = manifestLinkMatch[1]
  const manifestUrl = new URL(manifestHref, pageUrl).toString()

  // 3. Fetch the manifest.json
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let manifest: any
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(manifestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/manifest+json,application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PWA-Manifest-Checker/1.0)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to fetch manifest: ${response.statusText}`,
      })
    }

    manifest = await response.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw createError({ statusCode: 408, statusMessage: 'Manifest fetch timeout' })
    }
    return {
      pageUrl: pageUrl.toString(),
      manifestUrl,
      manifest: null,
      error: `Failed to fetch or parse manifest: ${err.message}`,
    }
  }

  return {
    pageUrl: pageUrl.toString(),
    manifestUrl,
    manifest,
    error: null,
  }
})
