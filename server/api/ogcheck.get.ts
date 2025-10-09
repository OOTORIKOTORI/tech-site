import { defineEventHandler, getQuery, createError } from 'h3'

type Hop = {
  i: number
  url: string
  status: number
  location: string | null
  contentType: string | null
  contentLength: string | null
}

export default defineEventHandler(async event => {
  const q = getQuery(event) as Record<string, string | string[] | undefined>
  const raw = (q.url ?? '').toString().trim()
  if (!raw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "url" query' })
  }
  let current: URL
  try {
    current = new URL(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  const max = Math.max(1, Math.min(10, Number(q.max ?? 5) || 5))
  const hops: Hop[] = []
  let finalUrl = current.toString()
  let status = 0

  // HEAD → 405/denied時は最小GET（Range: bytes=0-0）にフォールバック
  const headOrLiteGet = async (url: string) => {
    const tryHead = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    if (tryHead.status !== 405) return tryHead
    return fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      redirect: 'manual',
    })
  }

  for (let i = 0; i < max; i++) {
    const res = await headOrLiteGet(finalUrl)
    status = res.status
    const loc = res.headers.get('location')
    const ct = res.headers.get('content-type')
    const cl = res.headers.get('content-length')
    hops.push({
      i,
      url: finalUrl,
      status,
      location: loc,
      contentType: ct,
      contentLength: cl,
    })
    if (loc && [301, 302, 303, 307, 308].includes(status)) {
      finalUrl = new URL(loc, finalUrl).toString()
      continue
    }
    break
  }

  return {
    ok: true,
    input: raw,
    finalUrl,
    status,
    hops: hops.length,
    chain: hops,
  }
})
