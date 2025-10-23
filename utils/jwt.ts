// ================= JWT Utilities (Readable, strict, named exports) =================

// ---- Internal helpers (not exported) ----
function _b64ToU8(b64: string): Uint8Array {
  const clean = b64.replace(/[\r\n\s]/g, '')
  if (typeof atob === 'function') {
    const bin = atob(clean)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  // Node
  // eslint-disable-next-line no-undef
  return Uint8Array.from(Buffer.from(clean, 'base64'))
}

function _u8ToB64(u8: Uint8Array): string {
  if (typeof btoa === 'function') {
    let bin = ''
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!)
    return btoa(bin)
  }
  // eslint-disable-next-line no-undef
  return Buffer.from(u8).toString('base64')
}

function _pemToDerU8(pem: string, label: string): Uint8Array {
  const re = new RegExp(`-----BEGIN ${label}-----(.*?)-----END ${label}-----`, 'ms')
  const m = pem.match(re)
  const body = (m && m[1] ? m[1] : pem).replace(/[\r\n\s]/g, '')
  return _b64ToU8(body)
}

async function _importRsaSpkiPublicKey(pem: string): Promise<CryptoKey> {
  const der = _pemToDerU8(pem, 'PUBLIC KEY')
  return crypto.subtle.importKey(
    'spki',
    der as unknown as BufferSource,
    { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
    false,
    ['verify']
  )
}

// ---- Base64URL helpers ----
export function encodeBase64Url(input: Uint8Array | string): string {
  const u8 = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const b64 = _u8ToB64(u8)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decodeBase64Url(s: string): Uint8Array {
  if (!s) throw new Error('入力が無効です')
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('Base64URL形式が正しくありません')
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const rem = b64.length % 4
  if (rem === 2) b64 += '=='
  else if (rem === 3) b64 += '='
  else if (rem === 1) throw new Error('Base64URL形式が正しくありません')
  if (typeof atob === 'function') {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  // eslint-disable-next-line no-undef
  return Uint8Array.from(Buffer.from(b64, 'base64'))
}

// ---- parseJwt ----
export interface ParsedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

export function parseJwt(token: string): ParsedJwt {
  if (!token || typeof token !== 'string') throw new Error('JWTの形式が正しくありません')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('JWTの形式が正しくありません')
  const hSeg = parts[0]!
  const pSeg = parts[1]!
  const signature = parts[2]!
  let header: Record<string, unknown>
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(hSeg)))
  } catch (e) {
    if (e instanceof Error && /Base64URL形式/.test(e.message))
      throw new Error('Base64URL形式が正しくありません')
    throw new Error('有効なJSON形式ではありません')
  }
  try {
    payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(pSeg)))
  } catch (e) {
    if (e instanceof Error && /Base64URL形式/.test(e.message))
      throw new Error('Base64URL形式が正しくありません')
    throw new Error('有効なJSON形式ではありません')
  }
  return { header, payload, signature }
}

// ---- isProbablyJwt ----
export function isProbablyJwt(s: unknown): boolean {
  if (!s || typeof s !== 'string') return false
  const parts = s.split('.')
  if (parts.length !== 3) return false
  return parts.every(p => /^[A-Za-z0-9\-_]+$/.test(p))
}

// ---- verifyJwt ----
export interface JwtVerifyError {
  code: string
  message: string
  hint?: string
}

export async function verifyJwt(
  token: string,
  opts: {
    expectedAlg: 'HS256' | 'RS256'
    key: Uint8Array | string
    currentTimeSec?: number
    leewaySec?: number
  }
): Promise<{
  valid: boolean
  header: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  errors: JwtVerifyError[]
}> {
  const errors: JwtVerifyError[] = []
  const addError = (code: string, message: string, hint?: string) => {
    errors.push({ code, message, hint: hint ?? '' })
  }

  if (!token || typeof token !== 'string') {
    addError('ERR_FORMAT', 'トークンが空です')
    return { valid: false, header: null, payload: null, errors }
  }

  const parts = token.split('.')
  if (parts.length === 4 || parts.length === 5) {
    addError('ERR_JWE_UNSUPPORTED', 'JWEは未対応です')
    return { valid: false, header: null, payload: null, errors }
  }
  if (parts.length !== 3) {
    addError('ERR_FORMAT', 'JWTの形式が正しくありません')
    return { valid: false, header: null, payload: null, errors }
  }

  const [hSeg, pSeg, sigSeg] = parts
  if (!hSeg || !pSeg || sigSeg === undefined) {
    addError('ERR_FORMAT', 'JWTの形式が正しくありません')
    return { valid: false, header: null, payload: null, errors }
  }

  let header: Record<string, unknown> | null = null
  let payload: Record<string, unknown> | null = null

  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(hSeg)))
  } catch (e: unknown) {
    addError('ERR_HEADER_PARSE', 'ヘッダ解析失敗', e instanceof Error ? e.message : undefined)
  }
  try {
    payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(pSeg)))
  } catch (e: unknown) {
    addError('ERR_PAYLOAD_PARSE', 'ペイロード解析失敗', e instanceof Error ? e.message : undefined)
  }

  if (!header || typeof header !== 'object') {
    return { valid: false, header: null, payload: null, errors }
  }

  if (header.alg === 'none') {
    addError('ERR_ALG_NONE', 'alg=noneは許可されていません')
    return { valid: false, header, payload, errors }
  }
  if (header.alg !== opts.expectedAlg) {
    addError('ERR_ALG_MISMATCH', 'アルゴリズムが期待値と一致しません')
    return { valid: false, header, payload, errors }
  }

  const signingInputU8 = new TextEncoder().encode(`${hSeg}.${pSeg}`)
  let signatureValid = false

  try {
    if (header.alg === 'HS256') {
      const keyBytes: Uint8Array =
        typeof opts.key === 'string' ? new TextEncoder().encode(opts.key) : opts.key
      // crypto.subtle.importKey expects BufferSource (ArrayBuffer or ArrayBufferView)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes as unknown as BufferSource,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      )
      const sig = decodeBase64Url(sigSeg)
      signatureValid = await crypto.subtle.verify(
        'HMAC',
        cryptoKey,
        sig as unknown as BufferSource,
        signingInputU8 as unknown as BufferSource
      )
    } else if (header.alg === 'RS256') {
      const keyStr =
        typeof opts.key === 'string' ? opts.key.trim() : new TextDecoder().decode(opts.key).trim()
      if (
        /BEGIN PRIVATE KEY/.test(keyStr) ||
        /BEGIN CERTIFICATE/.test(keyStr) ||
        /BEGIN RSA PUBLIC KEY/.test(keyStr)
      ) {
        addError('ERR_KEY_FORMAT', '公開鍵(-----BEGIN PUBLIC KEY-----) のみ受け付けます')
        return { valid: false, header, payload, errors }
      }
      if (!/BEGIN PUBLIC KEY/.test(keyStr)) {
        addError('ERR_KEY_FORMAT', '公開鍵(-----BEGIN PUBLIC KEY-----) を指定してください')
        return { valid: false, header, payload, errors }
      }
      let pub: CryptoKey
      try {
        pub = await _importRsaSpkiPublicKey(keyStr)
      } catch (e: unknown) {
        addError(
          'ERR_KEY_IMPORT',
          '公開鍵の読み込みに失敗しました',
          e instanceof Error ? e.message : undefined
        )
        return { valid: false, header, payload, errors }
      }
      const sig = decodeBase64Url(sigSeg)
      signatureValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        pub,
        sig as unknown as BufferSource,
        signingInputU8 as unknown as BufferSource
      )
    }
  } catch (e: unknown) {
    addError(
      'ERR_VERIFY_EXCEPTION',
      '署名検証処理で例外',
      e instanceof Error ? e.message : undefined
    )
    return { valid: false, header, payload, errors }
  }

  if (!signatureValid) {
    addError('ERR_SIGNATURE', '署名が不正です')
  }

  if (payload && typeof payload === 'object') {
    const now = opts.currentTimeSec ?? Math.floor(Date.now() / 1000)
    const leeway = opts.leewaySec ?? 0
    if (typeof payload.exp === 'number' && now > payload.exp + leeway)
      addError('ERR_EXPIRED', 'トークンが期限切れです')
    if (typeof payload.nbf === 'number' && now + leeway < payload.nbf)
      addError('ERR_NOT_BEFORE', 'nbf前です')
  }

  const valid = errors.length === 0 && signatureValid
  return { valid, header, payload, errors }
}

// ---- Minimal JWKS utilities ----
export async function fetchJwks(url: string): Promise<{ keys?: unknown[]; [k: string]: unknown }> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

interface JwksRsaKey {
  kty: 'RSA'
  kid?: string
  use?: string
  alg?: string
  n: string
  e: string
  [k: string]: unknown
}
function isJwksRsaKey(x: unknown): x is JwksRsaKey {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return o.kty === 'RSA' && typeof o.n === 'string' && typeof o.e === 'string'
}
export function findJwksRsaKeyByKid(
  jwks: { keys?: unknown[] } | null | undefined,
  kid: string
): { n: string; e: string } | null {
  if (!jwks || !Array.isArray(jwks.keys)) return null
  const k = jwks.keys.find(x => isJwksRsaKey(x) && x.kid === kid)
  return k && isJwksRsaKey(k) ? { n: k.n, e: k.e } : null
}

export function buildRsaPemFromModExp(nBase64Url: string, eBase64Url: string): string {
  const n = decodeBase64Url(nBase64Url)
  const e = decodeBase64Url(eBase64Url)
  function derLen(len: number): Uint8Array {
    if (len < 128) return new Uint8Array([len])
    const bytes: number[] = []
    let v = len
    while (v > 0) {
      bytes.unshift(v & 0xff)
      v >>= 8
    }
    return new Uint8Array([0x80 | bytes.length, ...bytes])
  }
  const derInt = (buf: Uint8Array) => {
    // Ensure positive integer (prepend 0x00 if MSB set)
    const needsPad = (buf[0]! & 0x80) !== 0
    const val = needsPad ? new Uint8Array([0x00, ...buf]) : buf
    const len = derLen(val.length)
    return new Uint8Array([0x02, ...len, ...val])
  }
  const seq = (b: Uint8Array) => new Uint8Array([0x30, ...derLen(b.length), ...b])
  const bit = (b: Uint8Array) => new Uint8Array([0x03, ...derLen(b.length + 1), 0x00, ...b])
  // RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER }
  const rsaPub = seq(new Uint8Array([...derInt(n), ...derInt(e)]))
  // AlgorithmIdentifier for rsaEncryption: 1.2.840.113549.1.1.1 with NULL params
  const oid = new Uint8Array([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01])
  const nul = new Uint8Array([0x05, 0x00])
  const alg = seq(new Uint8Array([...oid, ...nul]))
  // SubjectPublicKeyInfo ::= SEQUENCE { algorithm AlgorithmIdentifier, subjectPublicKey BIT STRING }
  const spki = seq(new Uint8Array([...alg, ...bit(rsaPub)]))
  const b64 = _u8ToB64(spki)
  const body = b64.match(/.{1,64}/g)?.join('\n') || b64
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`
}
