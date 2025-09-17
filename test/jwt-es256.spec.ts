/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'

/**
 * Convert ECDSA signature from DER to JOSE (r||s 64 bytes for P-256)
 */
function derToJose(der: Uint8Array): Uint8Array {
  // Very small DER decoder for ECDSA-Sig-Value ::= SEQUENCE { r INTEGER, s INTEGER }
  // Format: 0x30 len 0x02 lenR r 0x02 lenS s
  if (der[0] !== 0x30) throw new Error('Invalid DER: no SEQUENCE')
  let idx = 2 // skip 0x30 and seq length
  if (der[1] & 0x80) {
    const lenBytes = der[1] & 0x7f
    idx = 2 + lenBytes // ignore long form length
  }
  if (der[idx] !== 0x02) throw new Error('Invalid DER: no INTEGER r')
  const lenR = der[idx + 1]
  let r = der.slice(idx + 2, idx + 2 + lenR)
  idx = idx + 2 + lenR
  if (der[idx] !== 0x02) throw new Error('Invalid DER: no INTEGER s')
  const lenS = der[idx + 1]
  let s = der.slice(idx + 2, idx + 2 + lenS)

  // Strip leading zeros; then left-pad to 32 bytes
  const strip = (b: Uint8Array) => {
    let i = 0
    while (i < b.length - 1 && b[i] === 0) i++
    return b.slice(i)
  }
  r = strip(r)
  s = strip(s)

  const pad = (b: Uint8Array) => {
    if (b.length > 32) throw new Error('Component too long')
    const out = new Uint8Array(32)
    out.set(b, 32 - b.length)
    return out
  }
  const out = new Uint8Array(64)
  out.set(pad(r), 0)
  out.set(pad(s), 32)
  return out
}

/**
 * Convert ECDSA signature from JOSE (r||s) to DER
 */
function joseToDer(jose: Uint8Array): Uint8Array {
  if (jose.length !== 64) throw new Error('JOSE must be 64 bytes for P-256')
  const r = jose.slice(0, 32)
  const s = jose.slice(32)

  const dropLeadingZeros = (b: Uint8Array) => {
    let i = 0
    while (i < b.length - 1 && b[i] === 0) i++
    return b.slice(i)
  }
  const ensurePositive = (b: Uint8Array) => {
    // If top bit is set, prepend 0x00 to keep it positive INTEGER
    return b[0] & 0x80 ? Uint8Array.from([0, ...b]) : b
  }

  let rClean = ensurePositive(dropLeadingZeros(r))
  let sClean = ensurePositive(dropLeadingZeros(s))

  const derLen = 2 + rClean.length + 2 + sClean.length
  const seq = new Uint8Array(2 + derLen)
  let p = 0
  seq[p++] = 0x30 // SEQUENCE
  seq[p++] = derLen // assume short form (len < 128)
  seq[p++] = 0x02
  seq[p++] = rClean.length
  seq.set(rClean, p)
  p += rClean.length
  seq[p++] = 0x02
  seq[p++] = sClean.length
  seq.set(sClean, p)
  p += sClean.length
  return seq
}

describe('ES256 DER<->JOSE conversion', () => {
  it('round-trips random-like signature', () => {
    // pseudo sample: r and s with leading zeros
    const jose = new Uint8Array(64)
    jose[0] = 0
    jose[1] = 1
    jose[31] = 0x7f // r
    jose[32] = 0
    jose[33] = 2
    jose[63] = 0x80 // s top bit set -> forces 0x00 prefix in DER
    const der = joseToDer(jose)
    const back = derToJose(der)
    expect(back).toEqual(jose)
  })

  it('rejects invalid sizes', () => {
    expect(() => derToJose(new Uint8Array([0x01, 0x02]))).toThrow()
    expect(() => joseToDer(new Uint8Array(10))).toThrow()
  })
})
