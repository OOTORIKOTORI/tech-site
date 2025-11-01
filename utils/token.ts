/**
 * Token counting utilities for LLM text estimation
 *
 * Note: This is a simplified estimation based on character/word counts.
 * For production use, consider using official tokenizer libraries:
 * - OpenAI: tiktoken or gpt-3-encoder
 * - Anthropic: @anthropic-ai/tokenizer
 * - Google: @google/generative-ai tokenizer
 */

/**
 * Estimate token count for text
 *
 * Rule of thumb:
 * - English: ~0.75 tokens per word (1 token ≈ 4 chars)
 * - Japanese: ~1 token per character
 * - Mixed: Use weighted average
 *
 * @param text Input text
 * @returns Estimated token count
 */
export function countTokens(text: string): number {
  if (!text || text.length === 0) return 0

  // Count Japanese characters (Hiragana, Katakana, Kanji, full-width symbols)
  const japaneseChars = (
    text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/g) || []
  ).length

  // Count English words
  const englishWords = text
    .replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length

  // Estimate tokens
  // Japanese: 1 char ≈ 1 token
  // English: 1 word ≈ 1.33 tokens (0.75 tokens per word)
  const japaneseTokens = japaneseChars
  const englishTokens = englishWords * 1.33

  return Math.ceil(japaneseTokens + englishTokens)
}

/**
 * Estimate token count by character-based rule (alternative method)
 * OpenAI rule: 1 token ≈ 4 characters in English
 */
export function countTokensByChars(text: string): number {
  if (!text || text.length === 0) return 0

  // Simple approximation: 4 chars = 1 token for English
  // Japanese tends to be denser, so use 1.5 chars = 1 token
  const japaneseChars = (
    text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/g) || []
  ).length
  const otherChars = text.length - japaneseChars

  return Math.ceil(japaneseChars / 1.5 + otherChars / 4)
}

/**
 * Get detailed token statistics
 */
export function getTokenStats(text: string): {
  chars: number
  words: number
  japaneseChars: number
  englishWords: number
  estimatedTokens: number
  estimatedTokensByChars: number
} {
  const chars = text.length
  const japaneseChars = (
    text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/g) || []
  ).length
  const words = text.split(/\s+/).filter(word => word.length > 0).length
  const englishWords = text
    .replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length

  return {
    chars,
    words,
    japaneseChars,
    englishWords,
    estimatedTokens: countTokens(text),
    estimatedTokensByChars: countTokensByChars(text),
  }
}
