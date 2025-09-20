import { describe, it, expect } from 'vitest'
import { encodeBase64Url } from '../../utils/jwt'
import { derToJoseB64Url, joseB64UrlToDer } from '../../utils/ecdsa'

function makeJoseSig(bytes: Partial<{ r: number[]; s: number[] }>): Uint8Array {
  const sig = new Uint8Array(64)
  if (bytes.r) sig.set(bytes.r, 0)
  if (bytes.s) sig.set(bytes.s, 32)
  return sig
}

describe('utils/ecdsa DER<->JOSE', () => {
  it('roundtrip JOSE -> DER -> JOSE (with msb and zeros)', () => {
    const jose = new Uint8Array(64)
    // r: leading zeros exist, then some bits, last < 0x80
    jose[1] = 1
    jose[2] = 0x80
    jose[31] = 0x7f
    // s: ensure MSB set to force 0x00 padding in DER
    jose[33] = 2
    jose[63] = 0x80
    const joseB64 = encodeBase64Url(jose)
    const der = joseB64UrlToDer(joseB64)
    const backB64 = derToJoseB64Url(der)
    expect(backB64).toBe(joseB64)
  })

  it('roundtrip DER -> JOSE -> DER', () => {
    const jose = makeJoseSig({ r: [1, 2, 3, 4], s: [5, 6, 7, 8] })
    const joseB64 = encodeBase64Url(jose)
    const der = joseB64UrlToDer(joseB64)
    const backJoseB64 = derToJoseB64Url(der)
    const der2 = joseB64UrlToDer(backJoseB64)
    expect(Buffer.from(der2)).toEqual(Buffer.from(der))
  })

  it('rejects invalid JOSE length', () => {
    const bad = encodeBase64Url(new Uint8Array(10))
    expect(() => joseB64UrlToDer(bad)).toThrow()
  })

  it('rejects invalid DER structure', () => {
    const badDer = new Uint8Array([0x30, 0x01, 0x00])
    expect(() => derToJoseB64Url(badDer)).toThrow()
  })
})
