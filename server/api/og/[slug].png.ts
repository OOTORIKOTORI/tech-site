import { defineEventHandler, getRequestURL, setHeader, sendRedirect, send } from 'h3'
import type { H3Event } from 'h3'
import { deflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'

export const runtime = 'node'

function crc32(buf: Uint8Array): number {
  let c = ~0 >>> 0
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i]!
    c ^= v
    for (let k = 0; k < 8; k++) {
      const mask = -(c & 1)
      c = (c >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return ~c >>> 0
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4)
  b[0] = (n >>> 24) & 0xff
  b[1] = (n >>> 16) & 0xff
  b[2] = (n >>> 8) & 0xff
  b[3] = n & 0xff
  return b
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const len = u32(data.length)
  const crcIn = new Uint8Array(typeBytes.length + data.length)
  crcIn.set(typeBytes, 0)
  crcIn.set(data, typeBytes.length)
  const crc = u32(crc32(crcIn))
  const out = new Uint8Array(4 + 4 + data.length + 4)
  out.set(len, 0)
  out.set(typeBytes, 4)
  out.set(data, 8)
  out.set(crc, 8 + data.length)
  return out
}

// Generate a tiny solid-color PNG; color derived from slug
function generatePng(slug: string, width = 400, height = 210): Buffer {
  const sig = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = new Uint8Array(13)
  ihdr.set(u32(width), 0)
  ihdr.set(u32(height), 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const hash = createHash('sha256').update(slug).digest()
  const r = hash[0] ?? 0
  const g = hash[1] ?? 0
  const b = hash[2] ?? 0
  const a = 255 as const

  const row = new Uint8Array(1 + width * 4)
  row[0] = 0 // filter type 0 (None)
  for (let x = 0; x < width; x++) {
    const off = 1 + x * 4
    row[off + 0] = r
    row[off + 1] = g
    row[off + 2] = b
    row[off + 3] = a
  }
  const raw = new Uint8Array(row.length * height)
  for (let y = 0; y < height; y++) {
    raw.set(row, y * row.length)
  }
  const idatData = deflateSync(raw)
  const iend = new Uint8Array(0)

  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', iend)]
  const total = parts.reduce((n, p) => n + p.length, 0)
  const png = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    png.set(p, o)
    o += p.length
  }
  return Buffer.from(png)
}

function redirectFallback(event: H3Event) {
  const origin = getRequestURL(event).origin
  const loc = `${origin}/og-default.png`
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'X-OG-Fallback', '1')
  return sendRedirect(event, loc, 302)
}

export default defineEventHandler(async (event: H3Event) => {
  const enabled = (process.env.ENABLE_DYNAMIC_OG || '').toLowerCase() === '1'
  // Always ensure no-store
  setHeader(event, 'Cache-Control', 'no-store')

  if (!enabled) {
    return redirectFallback(event)
  }

  try {
    // Optional: allow tests to force error path
    if ((process.env.ENABLE_DYNAMIC_OG_FORCE_ERROR || '').toLowerCase() === '1') {
      throw new Error('forced error')
    }
    const url = getRequestURL(event)
    const slug = (url.pathname.split('/').pop() || 'og').replace(/\.png$/i, '')
    const png = generatePng(slug)
    setHeader(event, 'Content-Type', 'image/png')
    setHeader(event, 'X-OG-Fallback', '0')
    return send(event, png)
  } catch {
    return redirectFallback(event)
  }
})
