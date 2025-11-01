import { describe, it, expect } from 'vitest'
import { countTokens, countTokensByChars, getTokenStats } from '@/utils/token'

describe('utils/token: countTokens', () => {
  it('counts Japanese characters roughly 1:1', () => {
    const text = '今日は良い天気'
    expect(countTokens(text)).toBe(7)
  })

  it('counts English words with ~1.33 tokens/word', () => {
    const text = 'Hello world from AI'
    // 4 * 1.33 = 5.32 -> ceil = 6
    expect(countTokens(text)).toBe(6)
  })

  it('handles mixed Japanese and English', () => {
    const text = '今日は sunny day'
    // JP 3 chars + EN 2 * 1.33 = 5.66 -> ceil 6
    expect(countTokens(text)).toBe(6)
  })
})

describe('utils/token: countTokensByChars', () => {
  it('approximates English text by 4 chars per token', () => {
    const text = 'abcd efgh' // 9 chars including space
    expect(countTokensByChars(text)).toBe(3) // ceil(9/4)=3
  })

  it('approximates Japanese text by 1.5 chars per token', () => {
    const text = 'あいうえおか' // 6 chars
    expect(countTokensByChars(text)).toBe(4) // ceil(6/1.5)=4
  })
})

describe('utils/token: getTokenStats', () => {
  it('returns consistent stats', () => {
    const text = '今日は sunny day'
    const s = getTokenStats(text)
    expect(s.chars).toBe(text.length)
    expect(s.words).toBeGreaterThan(0)
    expect(s.japaneseChars).toBe(3)
    expect(s.englishWords).toBe(2)
    expect(s.estimatedTokens).toBe(6)
    expect(s.estimatedTokensByChars).toBeGreaterThan(0)
  })
})
