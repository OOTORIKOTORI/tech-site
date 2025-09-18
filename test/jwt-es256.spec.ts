/* eslint-disable */
/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'

/** Safe accessors (strict + noUncheckedIndexedAccess-friendly) */
function readByte(arr: Uint8Array, pos: number): number {
  const v = (arr as any)[pos] as number | undefined
  if (v === undefined) throw new Error('Out of range')
  return v
}
function readLen(arr: Uint8Array, pos: number): { len: number; next: number } {
  const f = readByte(arr, pos)
  if ((f & 0x80) === 0) return { len: f, next: pos + 1 }
  const n = f & 0x7f
  if (n <= 0) throw new Error('Invalid DER length')
  let len = 0
  for (let i = 0; i < n; i++) len = (len << 8) | readByte(arr, pos + 1 + i)
  return { len, next: pos + 1 + n }
}

/** DER -> JOSE (r||s) for P-256 */
function derToJose(der: Uint8Array): Uint8Array {
  let i = 0
  if (readByte(der, i++) !== 0x30) throw new Error('Invalid DER: no SEQUENCE')
  const { len: seqLen, next } = readLen(der, i)
  i = next
  const end = i + seqLen
  if (end > der.length) throw new Error('Invalid DER: truncated')

  if (readByte(der, i++) !== 0x02) throw new Error('Invalid DER: no INTEGER r')
  const rL = readLen(der, i)
  i = rL.next
  const r = der.slice(i, i + rL.len)
  i += rL.len

  if (readByte(der, i++) !== 0x02) throw new Error('Invalid DER: no INTEGER s')
  const sL = readLen(der, i)
  i = sL.next
  const s = der.slice(i, i + sL.len)
  i += sL.len

  if (i !== end) throw new Error('Invalid DER: length mismatch')

  const strip = (b: Uint8Array) => {
    let p = 0
    while (p < b.length - 1 && b[p] === 0) p++
    return b.slice(p)
  }
  const pad32 = (b: Uint8Array) => {
    const x = strip(b)
    if (x.length > 32) throw new Error('Component too long')
    const out = new Uint8Array(32)
    out.set(x, 32 - x.length)
    return out
  }

  const out = new Uint8Array(64)
  out.set(pad32(r), 0)
  out.set(pad32(s), 32)
  return out
}

/** JOSE (r||s) -> DER */
function joseToDer(jose: Uint8Array): Uint8Array {
  if (jose.length !== 64) throw new Error('JOSE must be 64 bytes')
  const r = jose.slice(0, 32),
    s = jose.slice(32)

  const dropLeadingZeros = (b: Uint8Array) => {
    let p = 0
    while (p < b.length - 1 && b[p] === 0) p++
    return b.slice(p)
  }
  const ensurePositive = (b: Uint8Array) => {
    // TS-safe: handle possibly-empty (shouldn't happen after dropLeadingZeros, but keep for type-safety)
    const head = b[0] ?? 0
    return head & 0x80 ? Uint8Array.from([0, ...b]) : b
  }
  const makeLen = (n: number) => {
    if (n < 0x80) return Uint8Array.of(n)
    const bytes: number[] = []
    let x = n
    while (x > 0) {
      bytes.unshift(x & 0xff)
      x >>= 8
    }
    return Uint8Array.of(0x80 | bytes.length, ...bytes)
  }

  const rC = ensurePositive(dropLeadingZeros(r))
  const sC = ensurePositive(dropLeadingZeros(s))
  const rPart = Uint8Array.of(0x02, ...makeLen(rC.length), ...Array.from(rC))
  const sPart = Uint8Array.of(0x02, ...makeLen(sC.length), ...Array.from(sC))
  const contentLen = rPart.length + sPart.length

  return Uint8Array.of(
    0x30,
    ...Array.from(makeLen(contentLen)),
    ...Array.from(rPart),
    ...Array.from(sPart)
  )
}

describe('ES256 DER<->JOSE conversion', () => {
  it('round-trips with edge bytes (leading zeros, msb set)', () => {
    const jose = new Uint8Array(64)
    jose[1] = 1
    jose[31] = 0x7f // r
    jose[33] = 2
    jose[63] = 0x80 // s (msb set -> DER must add 0x00)
    const der = joseToDer(jose)
    const back = derToJose(der)
    expect(back).toEqual(jose)
  })
  it('rejects invalid sizes', () => {
    expect(() => derToJose(new Uint8Array([0x01, 0x02]))).toThrow()
    expect(() => joseToDer(new Uint8Array(10))).toThrow()
  })
})
