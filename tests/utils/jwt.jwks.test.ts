import { describe, it, expect, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
if (!(globalThis.crypto as Crypto | undefined)?.subtle) {
  vi.stubGlobal('crypto', webcrypto as unknown as Crypto)
}
import {
  encodeBase64Url,
  findJwksRsaKeyByKid,
  buildRsaPemFromModExp,
  verifyJwt,
} from '../../utils/jwt'

// JWKS 経由の検証（ネットワーク無し）
describe('JWKS flow (kid -> n/e -> PEM -> verify)', () => {
  it('RS256: JWKS の n/e から PEM を組み立てて検証できる', async () => {
    // 1) RSA 鍵ペア生成
    const { publicKey, privateKey } = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    )

    // 2) 公開鍵を JWK でエクスポート（n,e 取得用）
    const jwk = (await crypto.subtle.exportKey('jwk', publicKey)) as JsonWebKey
    const n = jwk.n!
    const e = jwk.e!

    // 3) kid を仮定した JWKS を用意して検索
    const kid = 'kid-1'
    const jwks = { keys: [{ kty: 'RSA', kid, n, e }] }
    const found = findJwksRsaKeyByKid(jwks as any, kid)
    expect(found).not.toBeNull()

    // 4) JWKS の n/e から PEM を組み立て
    const pem = buildRsaPemFromModExp(found!.n, found!.e)
    expect(pem).toContain('BEGIN PUBLIC KEY')

    // 5) 署名付きトークン作成
    const enc = new TextEncoder()
    const header = { alg: 'RS256', typ: 'JWT', kid }
    const payload = { sub: 'jwks-user', iat: 1700000000 }
    const headerPart = encodeBase64Url(enc.encode(JSON.stringify(header)))
    const payloadPart = encodeBase64Url(enc.encode(JSON.stringify(payload)))
    const sigBuf = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      enc.encode(`${headerPart}.${payloadPart}`)
    )
    const token = `${headerPart}.${payloadPart}.${encodeBase64Url(new Uint8Array(sigBuf))}`

    // 6) PEM 経由で verifyJwt
    const res = await verifyJwt(token, {
      expectedAlg: 'RS256',
      key: pem,
      currentTimeSec: 1700000000,
    })
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)
  })
})
