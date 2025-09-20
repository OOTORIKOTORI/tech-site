// utils/ecdsa.ts
// ES256 (P-256) ECDSA signature conversion between DER and JOSE (base64url of 64-byte R||S)

function encodeBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    // eslint-disable-next-line no-undef
    const b64 = Buffer.from(bytes).toString('base64')
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  if (typeof btoa !== 'function') throw new Error('btoa is not available')
  const b64 = btoa(bin)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4)
  if (typeof Buffer !== 'undefined') {
    // eslint-disable-next-line no-undef
    return new Uint8Array(Buffer.from(b64, 'base64'))
  }
  if (typeof atob !== 'function') throw new Error('atob is not available')
  const bin: string = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function trimLeadingZeros(buf: Uint8Array): Uint8Array {
  let i = 0
  while (i < buf.length && buf[i] === 0) i++
  return buf.slice(i)
}

function leftPad32(raw: Uint8Array): Uint8Array {
  if (raw.length > 32) throw new Error('Integer too large for P-256')
  const out = new Uint8Array(32)
  out.set(raw, 32 - raw.length)
  return out
}

function readLen(buf: Uint8Array, offset: number): { len: number; next: number } {
  if (offset >= buf.length) throw new Error('Invalid DER: truncated length')
  const first = buf[offset]
  if (first === undefined) throw new Error('Invalid DER: truncated length')
  offset += 1
  let len = first
  if (len < 0x80) {
    return { len, next: offset }
  }
  const numBytes = len & 0x7f
  if (numBytes === 0 || numBytes > 4) throw new Error('Invalid DER: length long form')
  if (offset + numBytes > buf.length) throw new Error('Invalid DER: truncated long length')
  len = 0
  for (let i = 0; i < numBytes; i++) {
    const v = buf[offset + i]
    if (v === undefined) throw new Error('Invalid DER: truncated long length')
    len = (len << 8) | v
  }
  return { len, next: offset + numBytes }
}

function writeLen(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len])
  const tmp: number[] = []
  let n = len
  while (n > 0) {
    tmp.push(n & 0xff)
    n >>= 8
  }
  tmp.reverse()
  return new Uint8Array([0x80 | tmp.length, ...tmp])
}

export function derToJoseB64Url(der: Uint8Array): string {
  if (der.length < 8) throw new Error('Invalid DER: too short')
  let off = 0
  if (der[off++] !== 0x30) throw new Error('Invalid DER: not a SEQUENCE')
  const seqLenInfo = readLen(der, off)
  const seqEnd = seqLenInfo.next + seqLenInfo.len
  off = seqLenInfo.next
  if (seqEnd !== der.length) {
    // Accept extra wrapping but usually should match
  }

  if (der[off++] !== 0x02) throw new Error('Invalid DER: expected INTEGER (r)')
  const rLenInfo = readLen(der, off)
  off = rLenInfo.next
  const rBytesFull = der.slice(off, off + rLenInfo.len)
  off += rLenInfo.len

  if (der[off++] !== 0x02) throw new Error('Invalid DER: expected INTEGER (s)')
  const sLenInfo = readLen(der, off)
  off = sLenInfo.next
  const sBytesFull = der.slice(off, off + sLenInfo.len)
  off += sLenInfo.len
  if (off !== seqEnd) {
    // trailing ignored but suspicious
  }

  const r = trimLeadingZeros(rBytesFull)
  const s = trimLeadingZeros(sBytesFull)
  if (r.length > 32 || s.length > 32) throw new Error('Invalid DER: integer too large')
  const r32 = leftPad32(r)
  const s32 = leftPad32(s)
  const jose = new Uint8Array(64)
  jose.set(r32, 0)
  jose.set(s32, 32)
  return encodeBase64Url(jose)
}

export function joseB64UrlToDer(joseSigB64Url: string): Uint8Array {
  const sig = decodeBase64UrlToBytes(joseSigB64Url)
  if (sig.length !== 64) throw new Error('Invalid JOSE signature: must be 64 bytes')
  const r = sig.slice(0, 32)
  const s = sig.slice(32, 64)
  const rTrim = trimLeadingZeros(r)
  const sTrim = trimLeadingZeros(s)

  const r0 = rTrim[0] ?? 0
  const s0 = sTrim[0] ?? 0
  const rNeedPad = rTrim.length > 0 && (r0 & 0x80) !== 0
  const sNeedPad = sTrim.length > 0 && (s0 & 0x80) !== 0
  const rDer = new Uint8Array((rNeedPad ? 1 : 0) + (rTrim.length || 1))
  const sDer = new Uint8Array((sNeedPad ? 1 : 0) + (sTrim.length || 1))
  if (rNeedPad) rDer[0] = 0x00
  if (sNeedPad) sDer[0] = 0x00
  if (rTrim.length === 0) rDer[rNeedPad ? 1 : 0] = 0
  else rDer.set(rTrim, rNeedPad ? 1 : 0)
  if (sTrim.length === 0) sDer[sNeedPad ? 1 : 0] = 0
  else sDer.set(sTrim, sNeedPad ? 1 : 0)

  const rHdr = new Uint8Array([0x02, ...Array.from(writeLen(rDer.length))])
  const sHdr = new Uint8Array([0x02, ...Array.from(writeLen(sDer.length))])
  const contentLen = rHdr.length + rDer.length + sHdr.length + sDer.length
  const seqHdr = new Uint8Array([0x30, ...Array.from(writeLen(contentLen))])

  const out = new Uint8Array(seqHdr.length + contentLen)
  let o = 0
  out.set(seqHdr, o)
  o += seqHdr.length
  out.set(rHdr, o)
  o += rHdr.length
  out.set(rDer, o)
  o += rDer.length
  out.set(sHdr, o)
  o += sHdr.length
  out.set(sDer, o)
  return out
}
