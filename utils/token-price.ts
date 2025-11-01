/**
 * LLM Token pricing data (USD per 1M tokens)
 * Updated: 2025-01
 */

export interface ModelPricing {
  id: string
  name: string
  provider: string
  inputPer1M: number // USD per 1M input tokens
  outputPer1M: number // USD per 1M output tokens
  maxTokens: number // Maximum context window
}

export const MODEL_PRICING: ModelPricing[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    inputPer1M: 10.0,
    outputPer1M: 30.0,
    maxTokens: 128000,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    inputPer1M: 30.0,
    outputPer1M: 60.0,
    maxTokens: 8192,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    inputPer1M: 0.5,
    outputPer1M: 1.5,
    maxTokens: 16385,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    inputPer1M: 15.0,
    outputPer1M: 75.0,
    maxTokens: 200000,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    maxTokens: 200000,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    inputPer1M: 0.25,
    outputPer1M: 1.25,
    maxTokens: 200000,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    inputPer1M: 3.5,
    outputPer1M: 10.5,
    maxTokens: 1048576,
  },
  {
    id: 'gemini-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    inputPer1M: 0.35,
    outputPer1M: 1.05,
    maxTokens: 1048576,
  },
]

export function getModelById(id: string): ModelPricing | undefined {
  return MODEL_PRICING.find(m => m.id === id)
}

/**
 * Calculate cost for given tokens
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelPricing
): {
  inputCost: number
  outputCost: number
  totalCost: number
} {
  const inputCost = (inputTokens / 1000000) * model.inputPer1M
  const outputCost = (outputTokens / 1000000) * model.outputPer1M
  const totalCost = inputCost + outputCost

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number(totalCost.toFixed(6)),
  }
}
