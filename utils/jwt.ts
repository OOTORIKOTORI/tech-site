// Rebuilt clean JWT utilities (signature-first verification)
// Minimal implementation focusing on current test requirements.

export interface ParsedJwt<THeader = any, TPayload = any> {
  header: THeader
  payload: TPayload
}

export interface JwtVerifyOptions {
  expectedAlg?: 'HS256' | 'RS256' | 'ES256'
  key?: string | Uint8Array
  currentTimeSec?: number
  leewaySec?: number
  expectedIss?: string | string[]
  expectedAud?: string | string[]
}

export interface JwtVerifyError {
  code: string
  message: string
  hint?: string
}

export interface JwtVerifyResult {
  header: any | null
  payload: any | null
  valid: boolean
  errors: JwtVerifyError[]
}

// ---------------- Base64URL ----------------
export function decodeBase64Url(input: string): Uint8Array {
  if (typeof input !== 'string' || input.length === 0) {
    throw new Error('入力が無効です。Base64URL形式の文字列を入力してください。')
  }
  if (!/^[A-Za-z0-9\-_]+$/.test(input)) {
    throw new Error('Base64URL形式が正しくありません')
  }
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : ''
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export function parseJwt(token: string): ParsedJwt {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('JWTの形式が正しくありません')
  const [hB64, pB64] = parts as [string, string, string?]
  const headerBytes = decodeBase64Url(hB64 as string)
  const payloadBytes = decodeBase64Url(pB64 as string)
  const headerJson = new TextDecoder().decode(headerBytes)
  const payloadJson = new TextDecoder().decode(payloadBytes)
  let header: any
  let payload: any
  try {
    header = JSON.parse(headerJson)
  } catch {
    throw new Error('有効なJSON形式ではありません')
  }
  try {
    payload = JSON.parse(payloadJson)
  } catch {
    throw new Error('有効なJSON形式ではありません')
  }
  return { header, payload }
}

export function isProbablyJwt(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  return parts.every(p => /^[A-Za-z0-9\-_]+$/.test(p))
}

// ---------------- Verification ----------------
function addError(arr: JwtVerifyError[], code: string, message: string, hint?: string) {
  arr.push({ code, message, hint })
}

function matchExpected(val: any, expected?: string | string[]) {
  if (!expected) return true
  return Array.isArray(expected) ? expected.includes(val) : val === expected
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}

function stripPem(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importHmacSha256(secret: string | Uint8Array): Promise<CryptoKey> {
  const raw = typeof secret === 'string' ? new TextEncoder().encode(secret) : new Uint8Array(secret)
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

async function importRsaSha256Spki(pem: string): Promise<CryptoKey> {
  let b64 = stripPem(pem).trim()
  // base64url 変換されている可能性を補正
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/')
  const mod = b64.length % 4
  if (mod === 2) b64 += '=='
  else if (mod === 3) b64 += '='
  else if (mod === 1) throw new Error('Invalid base64 length')
  const der = b64ToBytes(b64)
  const buf = new ArrayBuffer(der.length)
  const copy = new Uint8Array(buf)
  copy.set(der)
  return crypto.subtle.importKey(
    'spki',
    buf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

export async function verifyJwt(
  token: string,
  opts: JwtVerifyOptions = {}
): Promise<JwtVerifyResult> {
  const errors: JwtVerifyError[] = []
  const result: JwtVerifyResult = { header: null, payload: null, valid: false, errors }

  if (!(globalThis as any).crypto?.subtle) {
    addError(errors, 'ERR_NO_CRYPTO', 'Web Crypto API が利用できません')
    return result
  }
  if (typeof token !== 'string') {
    addError(errors, 'ERR_INPUT', 'トークンは文字列である必要があります')
    return result
  }
  const parts = token.split('.')
  if (parts.length === 4 || parts.length === 5) {
    addError(errors, 'ERR_JWE_UNSUPPORTED', 'JWE (暗号化JWT) は未対応です')
    return result
  }
  if (parts.length !== 3) {
    addError(errors, 'ERR_FORMAT', 'JWTの形式が正しくありません (3区切りではありません)')
    return result
  }
  const [hB64, pB64, sigB64] = parts

  let header: any
  let payload: any
  try {
    const hBytes = decodeBase64Url(hB64 as string)
    const pBytes = decodeBase64Url(pB64 as string)
    header = JSON.parse(new TextDecoder().decode(hBytes))
    payload = JSON.parse(new TextDecoder().decode(pBytes))
    result.header = header
    result.payload = payload
  } catch (e) {
    addError(errors, 'ERR_DECODE', 'デコードに失敗しました', (e as Error).message)
    return result
  }

  if (header.alg === 'none') {
    addError(errors, 'ERR_ALG_NONE', 'alg=none は許可されていません')
    return result
  }
  if (opts.expectedAlg && header.alg !== opts.expectedAlg) {
    addError(
      errors,
      'ERR_ALG_MISMATCH',
      'algヘッダが期待値と一致しません',
      `${header.alg} != ${opts.expectedAlg}`
    )
  }

  const signingInput = `${hB64}.${pB64}`
  let signatureVerified = false
  let signatureAttempted = false
  if (!sigB64 && header.alg) {
    addError(errors, 'ERR_SIGNATURE_ABSENT', '署名部分が存在しません')
  } else if (sigB64) {
    try {
      if (header.alg === 'HS256') {
        if (!opts.key) {
          addError(errors, 'ERR_KEY_REQUIRED', 'HS256 検証にはシークレットが必要です')
        } else {
          signatureAttempted = true
          const key = await importHmacSha256(opts.key)
          const sig = decodeBase64Url(sigB64)
          const ok = await crypto.subtle.verify(
            'HMAC',
            key,
            sig.buffer as ArrayBuffer,
            new TextEncoder().encode(signingInput)
          )
          if (ok) signatureVerified = true
          else addError(errors, 'ERR_SIGNATURE', '署名検証に失敗しました')
        }
      } else if (header.alg === 'RS256') {
        if (!opts.key || typeof opts.key !== 'string') {
          addError(errors, 'ERR_KEY_REQUIRED', 'RS256 検証には公開鍵(PEM)が必要です')
        } else {
          try {
            signatureAttempted = true
            const key = await importRsaSha256Spki(opts.key)
            const sig = decodeBase64Url(sigB64)
            const ok = await crypto.subtle.verify(
              'RSASSA-PKCS1-v1_5',
              key,
              sig.buffer as ArrayBuffer,
              new TextEncoder().encode(signingInput)
            )
            if (ok) signatureVerified = true
            else addError(errors, 'ERR_SIGNATURE', '署名検証に失敗しました')
          } catch (e) {
            addError(
              errors,
              'ERR_KEY_IMPORT',
              '公開鍵の読み込みに失敗しました',
              (e as Error).message
            )
          }
        }
      } else if (header.alg === 'ES256') {
        addError(errors, 'ERR_UNSUPPORTED_ALG', '未対応アルゴリズム: ES256')
      } else {
        addError(errors, 'ERR_UNSUPPORTED_ALG', `未対応アルゴリズム: ${header.alg}`)
      }
    } catch (e) {
      addError(
        errors,
        'ERR_VERIFY_EXCEPTION',
        '署名検証中に例外が発生しました',
        (e as Error).message
      )
    }
  }

  if (!signatureVerified && signatureAttempted && !errors.some(e => e.code === 'ERR_SIGNATURE')) {
    addError(errors, 'ERR_SIGNATURE', '署名検証に失敗しました')
  }

  const nowSec = Math.floor(opts.currentTimeSec ?? Date.now() / 1000)
  const leeway = opts.leewaySec ?? 60
  if (typeof payload.exp === 'number' && nowSec - leeway >= payload.exp) {
    addError(errors, 'ERR_EXPIRED', 'トークンは期限切れです', `exp=${payload.exp}, now=${nowSec}`)
  }
  if (typeof payload.nbf === 'number' && nowSec + leeway < payload.nbf) {
    addError(
      errors,
      'ERR_NOT_BEFORE',
      'nbf(有効開始) に達していません',
      `nbf=${payload.nbf}, now=${nowSec}`
    )
  }
  if (typeof payload.iat === 'number' && payload.iat - leeway > nowSec) {
    addError(errors, 'ERR_IAT_FUTURE', 'iat が未来時刻です', `iat=${payload.iat}, now=${nowSec}`)
  }
  if (!matchExpected(payload.iss, opts.expectedIss)) {
    addError(errors, 'ERR_ISS_MISMATCH', 'iss が期待値と一致しません')
  }
  if (!matchExpected(payload.aud, opts.expectedAud)) {
    addError(errors, 'ERR_AUD_MISMATCH', 'aud が期待値と一致しません')
  }

  result.valid = errors.length === 0
  return result
}

/**
 * 文字列がJWTトークンの可能性があるかチェックします
 * @param token チェックする文字列
 * @returns JWTの可能性がある場合true
 */
// isProbablyJwt is redefined above with clean implementation.

// ---------------- JWKS Helpers ----------------
interface FetchJwksOptions {
  forceRefresh?: boolean
}
interface JwksResponse {
  keys: any[]
}

const jwksCache = new Map<string, { ts: number; data: JwksResponse }>()
const JWKS_TTL_MS = 5 * 60 * 1000

export async function fetchJwks(url: string, opts: FetchJwksOptions = {}): Promise<JwksResponse> {
  if (!opts.forceRefresh) {
    const cached = jwksCache.get(url)
    if (cached && Date.now() - cached.ts < JWKS_TTL_MS) return cached.data
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as JwksResponse
  if (!json || !Array.isArray(json.keys)) throw new Error('JWKS形式不正')
  jwksCache.set(url, { ts: Date.now(), data: json })
  return json
}

export function findJwksRsaKeyByKid(jwks: { keys: any[] }, kid: string, alg?: string) {
  return (jwks.keys || []).find(
    k => k && k.kty === 'RSA' && k.kid === kid && k.n && k.e && (!alg || !k.alg || k.alg === alg)
  )
}

// Build PEM public key from modulus & exponent (base64url) for RSA
export function buildRsaPemFromModExp(nB64Url: string, eB64Url: string): string | null {
  try {
    const n = decodeBase64Url(nB64Url)
    const e = decodeBase64Url(eB64Url)
    const derInt = (buf: Uint8Array) => {
      // Ensure positive INTEGER (prepend 0x00 if high bit set)
      let bytes = buf[0]! & 0x80 ? concatBytes(new Uint8Array([0]), buf) : buf
      return concatBytes(new Uint8Array([0x02, ...encodeDerLength(bytes.length)]), bytes)
    }
    const seq = (content: Uint8Array) =>
      concatBytes(new Uint8Array([0x30, ...encodeDerLength(content.length)]), content)
    const bitString = (content: Uint8Array) => {
      // Prepend 0x00 for no unused bits
      const withUnused = concatBytes(new Uint8Array([0x00]), content)
      return concatBytes(new Uint8Array([0x03, ...encodeDerLength(withUnused.length)]), withUnused)
    }
    // RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER }
    const rsaPub = seq(concatBytes(derInt(n), derInt(e)))
    // AlgorithmIdentifier for rsaEncryption: SEQ { OID 1.2.840.113549.1.1.1, NULL }
    const oidRsaEncryption = new Uint8Array([
      0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    ])
    const nullDer = new Uint8Array([0x05, 0x00])
    const algId = seq(concatBytes(oidRsaEncryption, nullDer))
    const spki = seq(concatBytes(algId, bitString(rsaPub)))
    const b64 = toBase64(spki)
    const pem = `-----BEGIN PUBLIC KEY-----\n${b64
      .match(/.{1,64}/g)!
      .join('\n')}\n-----END PUBLIC KEY-----`
    return pem
  } catch {
    return null
  }
}

function encodeDerLength(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len])
  const bytes: number[] = []
  let n = len
  while (n > 0) {
    bytes.unshift(n & 0xff)
    n >>= 8
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes])
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}
