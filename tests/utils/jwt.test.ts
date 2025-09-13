import { describe, it, expect } from 'vitest'
import { decodeBase64Url, parseJwt, isProbablyJwt } from '../../utils/jwt'

describe('JWT Utils', () => {
  describe('decodeBase64Url', () => {
    it('正常なBase64URL文字列をデコードできる', () => {
      // "hello"のBase64URL
      const input = 'aGVsbG8'
      const result = decodeBase64Url(input)
      const decoded = new TextDecoder().decode(result)
      expect(decoded).toBe('hello')
    })

    it('空文字列や無効な入力でエラーを投げる', () => {
      expect(() => decodeBase64Url('')).toThrow('入力が無効です')
      expect(() => decodeBase64Url('invalid@chars')).toThrow('Base64URL形式が正しくありません')
    })

    it('無効なBase64URL文字列でエラーを投げる', () => {
      expect(() => decodeBase64Url('!!!')).toThrow('Base64URL形式が正しくありません')
    })
  })

  describe('parseJwt', () => {
    it('正常なJWTトークンをパースできる', () => {
      // 実際に有効なJWTトークン（テスト用のダミー）
      // header: {"alg":"HS256","typ":"JWT"}
      // payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

      const result = parseJwt(token)

      expect(result).toHaveProperty('header')
      expect(result).toHaveProperty('payload')
      expect(result.header).toEqual({
        alg: 'HS256',
        typ: 'JWT',
      })
      expect(result.payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
      })
    })

    it('区切り文字が不足している場合エラーを投げる', () => {
      expect(() => parseJwt('invalid.token')).toThrow('JWTの形式が正しくありません')
      expect(() => parseJwt('invalid')).toThrow('JWTの形式が正しくありません')
    })

    it('Base64URLが不正な場合エラーを投げる', () => {
      expect(() => parseJwt('invalid@.invalid@.signature')).toThrow(
        'Base64URL形式が正しくありません'
      )
    })

    it('JSONが不正な場合エラーを投げる', () => {
      // 有効なBase64URLだが、デコード後が不正なJSON
      const invalidJsonToken = 'aW52YWxpZA.aW52YWxpZA.signature'
      expect(() => parseJwt(invalidJsonToken)).toThrow('有効なJSON形式ではありません')
    })
  })

  describe('isProbablyJwt', () => {
    it('有効なJWT形式を正しく判定する', () => {
      const validJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      expect(isProbablyJwt(validJwt)).toBe(true)
    })

    it('無効な形式を正しく判定する', () => {
      expect(isProbablyJwt('')).toBe(false)
      expect(isProbablyJwt('invalid')).toBe(false)
      expect(isProbablyJwt('invalid.token')).toBe(false)
      expect(isProbablyJwt('invalid@.token@.signature@')).toBe(false)
    })

    it('空文字やnullを正しく判定する', () => {
      expect(isProbablyJwt('')).toBe(false)
      expect(isProbablyJwt(null as any)).toBe(false)
      expect(isProbablyJwt(undefined as any)).toBe(false)
    })
  })
})
