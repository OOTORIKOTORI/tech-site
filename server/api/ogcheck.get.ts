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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const tryHead = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (tryHead.status !== 405) return tryHead
    } catch {
      // fallthrough to lite GET
      clearTimeout(timeout)
    }
    const controller2 = new AbortController()
    const timeout2 = setTimeout(() => controller2.abort(), 8000)
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        redirect: 'manual',
        signal: controller2.signal,
      })
      return resp
    } finally {
      clearTimeout(timeout2)
    }
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

  // 最終URLのHTMLを最小取得（text/htmlのみ、最大 ~200KB、失敗は非ブロッキング）
  let html = ''
  const headers: Record<string, string> = {}
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(finalUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    })
    const ct = res.headers.get('content-type') || ''
    // ヘッダーを収集
    res.headers.forEach((v, k) => (headers[k] = v))
    if (/text\/html/i.test(ct)) {
      // 200KBに制限
      const reader = res.body?.getReader()
      if (reader) {
        const chunks: Uint8Array[] = []
        let received = 0
        const cap = 200 * 1024
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            const next = Math.min(value.byteLength, Math.max(0, cap - received))
            if (next > 0) chunks.push(value.subarray(0, next))
            received += next
            if (received >= cap) break
          }
        }
        html = Buffer.concat(chunks).toString('utf8')
      } else {
        // フォールバック: 全文（環境によっては small）
        html = await res.text()
      }
    }
    clearTimeout(timeout)
  } catch {
    // ignore
  }

  return {
    ok: true,
    input: raw,
    finalUrl,
    status,
    hops: hops.length,
    chain: hops,
    html,
    headers,
  }
})
