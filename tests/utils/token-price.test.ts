import { describe, it, expect } from 'vitest'
import { MODEL_PRICING, getModelById, calculateCost } from '@/utils/token-price'

describe('utils/token-price: model lookup', () => {
  it('finds a known model by id', () => {
    const m = getModelById('gpt-4-turbo')
    expect(m).toBeDefined()
    expect(m!.provider).toBe('OpenAI')
  })

  it('MODEL_PRICING has at least 5 models', () => {
    expect(MODEL_PRICING.length).toBeGreaterThanOrEqual(5)
  })
})

describe('utils/token-price: calculateCost', () => {
  it('calculates input/output/total costs with 6-dec precision', () => {
    const m = getModelById('gpt-4-turbo')!
    const res = calculateCost(1000, 500, m)
    expect(res.inputCost).toBeCloseTo(0.01, 6)
    expect(res.outputCost).toBeCloseTo(0.015, 6)
    expect(res.totalCost).toBeCloseTo(0.025, 6)
  })
})
