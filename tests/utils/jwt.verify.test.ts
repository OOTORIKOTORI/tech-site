import { describe, it, expect } from 'vitest'
import { webcrypto } from 'node:crypto'
import { vi } from 'vitest'
if (!(globalThis.crypto as Crypto | undefined)?.subtle) {
  vi.stubGlobal('crypto', webcrypto as unknown as Crypto)
}
import { verifyJwt, encodeBase64Url } from '../../utils/jwt'
import crypto from 'node:crypto'

// UTC固定時間ヘルパー
const fixedNow = Date.UTC(2024, 0, 1, 0, 0, 0) // 2024-01-01T00:00:00Z
const nowSec = Math.floor(fixedNow / 1000)

// HS256 署名用簡易実装 (HMAC SHA-256) - テスト限定
async function hs256Sign(header: Record<string, unknown>, payload: Record<string, unknown>, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const headerPart = encodeBase64Url(enc.encode(JSON.stringify(header)))
  const payloadPart = encodeBase64Url(enc.encode(JSON.stringify(payload)))
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${headerPart}.${payloadPart}`))
  const sig = encodeBase64Url(new Uint8Array(sigBuf))
  return `${headerPart}.${payloadPart}.${sig}`
}

// 簡易RSA (固定鍵) PEM - 実運用しない (テスト専用)
const RSA_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----\nMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALezrHBpjz2uVH54camzatoNgtrENcaw\nMqGfwHTCqkfNNpJBWlAbIYW/W2PASi6DPd7OJbRRqtD9h5pz50jdKkcCAwEAAQ==\n-----END PUBLIC KEY-----`
// (旧: PRIVATE KEY 定数 / pemToDer は不要のため削除)

describe('verifyJwt', () => {
  it('HS256 正常検証', async () => {
    const token = await hs256Sign(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'u1', iat: nowSec },
      'secret'
    )
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: new TextEncoder().encode('secret'),
      currentTimeSec: nowSec,
    })
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)
  })

  it('RS256 正常検証 (公開鍵指定)', async () => {
    // 鍵ペア生成
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
      true, ['sign','verify']
    )
    // 公開鍵をSPKI DER→PEM化
    const spki = await crypto.subtle.exportKey('spki', publicKey)
    function derToPemSpki(der: ArrayBuffer): string {
      const b64 = Buffer.from(new Uint8Array(der)).toString('base64')
      const lines = b64.match(/.{1,64}/g) || []
      return '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----'
    }
    const publicPem = derToPemSpki(spki)
    // トークン作成（privateKeyで署名）
    const enc = new TextEncoder()
    const headerPart  = encodeBase64Url(enc.encode(JSON.stringify({ alg:'RS256', typ:'JWT' })))
    const payloadPart = encodeBase64Url(enc.encode(JSON.stringify({ sub:'123', iat: 1700000000 })))
    const data = enc.encode(`${headerPart}.${payloadPart}`)
    const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data)
    const token = `${headerPart}.${payloadPart}.${encodeBase64Url(new Uint8Array(sigBuf))}`
    // 検証
    const res = await verifyJwt(token, {
      expectedAlg: 'RS256',
      key: publicPem,
      currentTimeSec: 1700000000,
    })
    expect(res.valid).toBe(true)
  })

  it('alg=none 拒否', async () => {
    const header = btoa(JSON.stringify({ alg: 'none' }))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const payload = btoa(JSON.stringify({ sub: 'x' }))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const token = `${header}.${payload}.`
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: 'secret',
      currentTimeSec: nowSec,
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some(e => e.code === 'ERR_ALG_NONE')).toBe(true)
  })

  it('アルゴリズム不一致', async () => {
    const token = await hs256Sign(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'u3', iat: nowSec },
      'secret'
    )
    const res = await verifyJwt(token, {
      expectedAlg: 'RS256',
      key: RSA_PUBLIC_PEM,
      currentTimeSec: nowSec,
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some(e => e.code === 'ERR_ALG_MISMATCH')).toBe(true)
  })

  it('署名不一致', async () => {
    const token = await hs256Sign(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'u4', iat: nowSec },
      'secret'
    )
    // secret違い
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: 'other',
      currentTimeSec: nowSec,
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some(e => e.code === 'ERR_SIGNATURE')).toBe(true)
  })

  it('期限切れ (exp 過去)', async () => {
    const token = await hs256Sign(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'u5', iat: nowSec - 100, exp: nowSec - 10 },
      'secret'
    )
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: 'secret',
      currentTimeSec: nowSec,
      leewaySec: 0,
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some(e => e.code === 'ERR_EXPIRED')).toBe(true)
  })

  it('nbf 未来', async () => {
    const token = await hs256Sign(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'u6', nbf: nowSec + 120 },
      'secret'
    )
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: 'secret',
      currentTimeSec: nowSec,
      leewaySec: 0,
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some(e => e.code === 'ERR_NOT_BEFORE')).toBe(true)
  })

  it('JWE 誤投入 (4~5パート)', async () => {
    const token = 'a.b.c.d'
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: 'secret',
      currentTimeSec: nowSec,
    })
    expect(res.valid).toBe(false)
    expect(res.errors.some(e => e.code === 'ERR_JWE_UNSUPPORTED')).toBe(true)
  })
})
