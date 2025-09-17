import { describe, it, expect } from 'vitest'
import { webcrypto } from 'node:crypto'
import { vi } from 'vitest'
if (!(globalThis.crypto as Crypto | undefined)?.subtle) {
  vi.stubGlobal('crypto', webcrypto as unknown as Crypto)
}
import { verifyJwt } from '../../utils/jwt'

// UTC固定時間ヘルパー
const fixedNow = Date.UTC(2024, 0, 1, 0, 0, 0) // 2024-01-01T00:00:00Z
const nowSec = Math.floor(fixedNow / 1000)

// HS256 署名用簡易実装 (HMAC SHA-256) - テスト限定
async function hs256Sign(header: object, payload: object, secret: string) {
  const enc = new TextEncoder()
  const base64url = (data: Uint8Array) => {
    const b64 = btoa(String.fromCharCode(...data))
    return b64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  const json = (o: object) => base64url(enc.encode(JSON.stringify(o)))
  const headerPart = json(header)
  const payloadPart = json(payload)
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${headerPart}.${payloadPart}`))
  const sig = base64url(new Uint8Array(sigBuf))
  return `${headerPart}.${payloadPart}.${sig}`
}

// 簡易RSA (固定鍵) PEM - 実運用しない (テスト専用)
const RSA_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----\nMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALezrHBpjz2uVH54camzatoNgtrENcaw\nMqGfwHTCqkfNNpJBWlAbIYW/W2PASi6DPd7OJbRRqtD9h5pz50jdKkcCAwEAAQ==\n-----END PUBLIC KEY-----`
const RSA_PRIVATE_PKCS8 =
  `-----BEGIN PRIVATE KEY-----\nMIIBVgIBADANBgkqhkiG9w0BAQEFAASCAUAwggE8AgEAAkEAt7Os cGmPPa5Ufnhx\nqbNq2g2C2sQ1xrAyoZ/AdMKqR800kkFaUBshhb9bY8BKL oM93s4ltFGq0P2HmnPn\nSN0qRwIDAQABAkAfz2oxEd4pqco3EQAOEj4mBI9YJrKMgVkpXBJgp7wa9u0edPFs\niEcNWef39/C4R2tQeM+c/fi91tIbp/BKxBAiEA9Fz6nxsVXni4eWh05rq6ArlTcid\n58LLJSUYkqt+1rMCIQDDGJEqn3Ejj6inUeJ8V+RaH//RUW2KIiMzFxLpy0X58wIhA\nKpvNqTJHb7VUOp5PHeTtQKgHdwNwp0UrEGouGZWlznAiEAkI0GhBSPYBQ2PBBkKS6\nGsDz3jAC5vVsQt1zAr72Xd1LSeUCIQC2cqB6f+GO6zkRgZNpmjQe7YQDdyCjTiMQu\nGexiLRNv2Q==\n-----END PRIVATE KEY-----`.replace(
    /\s+/g,
    ' '
  )

async function rs256Sign(header: any, payload: any) {
  const enc = new TextEncoder()
  const base64url = (data: Uint8Array) => {
    const b64 = btoa(String.fromCharCode(...data))
    return b64.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  const json = (o: object) => base64url(enc.encode(JSON.stringify(o)))
  const headerPart = json(header)
  const payloadPart = json(payload)
  // 簡易PEM->DER (PKCS8) 抜粋
  const pkcs8 = RSA_PRIVATE_PKCS8.replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(pkcs8), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    enc.encode(`${headerPart}.${payloadPart}`)
  )
  const sig = base64url(new Uint8Array(sigBuf))
  return `${headerPart}.${payloadPart}.${sig}`
}

describe('verifyJwt', () => {
  it('HS256 正常検証', async () => {
    const token = await hs256Sign(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'u1', iat: nowSec },
      'secret'
    )
    const res = await verifyJwt(token, {
      expectedAlg: 'HS256',
      key: 'secret',
      currentTimeSec: nowSec,
    })
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)
  })

  it('RS256 正常検証 (公開鍵指定)', async () => {
    const token = await rs256Sign({ alg: 'RS256', typ: 'JWT' }, { sub: 'u2', iat: nowSec })
    const res = await verifyJwt(token, {
      expectedAlg: 'RS256',
      key: RSA_PUBLIC_PEM,
      currentTimeSec: nowSec,
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
