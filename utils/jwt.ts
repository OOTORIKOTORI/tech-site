/**
 * Base64URL文字列をUint8Arrayにデコードします
 * @param input Base64URL形式の文字列
 * @returns デコードされたUint8Array
 * @throws エラー文字列（日本語）
 */
export function decodeBase64Url(input: string): Uint8Array {
  if (!input || typeof input !== 'string') {
    throw new Error('入力が無効です。Base64URL形式の文字列を入力してください。')
  }

  // Base64URL文字のパターンチェック
  if (!/^[A-Za-z0-9_-]*$/.test(input)) {
    throw new Error('Base64URL形式が正しくありません。使用できる文字は A-Z, a-z, 0-9, -, _ のみです。')
  }

  try {
    // Base64URL → Base64 変換
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
    
    // パディング調整
    while (base64.length % 4) {
      base64 += '='
    }

    // Base64デコード
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    return bytes
  } catch (error) {
    throw new Error('Base64URLのデコードに失敗しました。形式が正しくない可能性があります。')
  }
}

/**
 * JWTトークンをパースしてheaderとpayloadを取得します
 * @param token JWT形式のトークン文字列
 * @returns パースされたheaderとpayload
 * @throws エラー文字列（日本語）
 */
export function parseJwt(token: string): { header: unknown; payload: unknown } {
  if (!token || typeof token !== 'string') {
    throw new Error('JWTトークンが無効です。文字列を入力してください。')
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('JWTの形式が正しくありません。header.payload.signature の形式である必要があります。')
  }

  const [headerPart, payloadPart] = parts

  if (!headerPart || !payloadPart) {
    throw new Error('JWTのheaderまたはpayloadが空です。')
  }

  try {
    // headerをデコード
    const headerBytes = decodeBase64Url(headerPart)
    const headerJson = new TextDecoder().decode(headerBytes)
    const header = JSON.parse(headerJson)

    // payloadをデコード
    const payloadBytes = decodeBase64Url(payloadPart)
    const payloadJson = new TextDecoder().decode(payloadBytes)
    const payload = JSON.parse(payloadJson)

    return { header, payload }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Base64URL')) {
        throw error // Base64URLエラーはそのまま
      }
      if (error.message.includes('JSON')) {
        throw new Error('JWTのheaderまたはpayloadが有効なJSON形式ではありません。')
      }
    }
    throw new Error('JWTの解析中に予期しないエラーが発生しました。')
  }
}

/**
 * 文字列がJWTトークンの可能性があるかチェックします
 * @param token チェックする文字列
 * @returns JWTの可能性がある場合true
 */
export function isProbablyJwt(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  // 各部分がBase64URL文字のみで構成されているかチェック
  return parts.every(part => /^[A-Za-z0-9_-]*$/.test(part))
}