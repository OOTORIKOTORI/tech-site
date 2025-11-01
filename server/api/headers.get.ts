import { defineEventHandler, getQuery, createError } from 'h3'

/**
 * API endpoint to fetch HTTP response headers
 *
 * Query params:
 *   url: Target URL
 *
 * Returns:
 *   - url: Target URL
 *   - headers: HTTP response headers
 *   - status: HTTP status code
 *   - error: Error message if any
 */

export default defineEventHandler(async event => {
  const q = getQuery(event) as Record<string, string | string[] | undefined>
  const raw = (q.url ?? '').toString().trim()

  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "url" query parameter' })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  // Fetch headers using HEAD request
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(targetUrl.toString(), {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Security-Header-Checker/1.0)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    // Convert Headers to plain object
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    return {
      url: targetUrl.toString(),
      status: response.status,
      headers,
      error: null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw createError({ statusCode: 408, statusMessage: 'Request timeout' })
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch headers: ${err.message}`,
    })
  }
})
