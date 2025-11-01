<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { useHead } from '#imports'
import { getTokenStats } from '~/utils/token'
import { MODEL_PRICING, calculateCost, type ModelPricing } from '~/utils/token-price'

useHead({
  title: 'LLM Token Counter & Cost Estimator | Migaki Explorer',
  meta: [
    {
      name: 'description',
      content:
        'テキストのトークン数を計算し、主要LLMモデル（GPT-4、Claude、Gemini）ごとの推定コストを表示します。',
    },
    {
      property: 'og:title',
      content: 'LLM Token Counter & Cost Estimator | Migaki Explorer',
    },
    {
      property: 'og:description',
      content: '主要LLMモデルのトークン数とコストを即座に計算できるツール',
    },
  ],
})

const inputText = ref('')
const outputTokens = ref(1000)
const selectedModelId = ref('gpt-4-turbo')

const selectedModel = computed<ModelPricing | undefined>(() =>
  MODEL_PRICING.find((m) => m.id === selectedModelId.value)
)

const stats = computed(() => getTokenStats(inputText.value))

const cost = computed(() => {
  if (!selectedModel.value) return null
  return calculateCost(stats.value.estimatedTokens, outputTokens.value, selectedModel.value)
})

const exampleInput = 'こんにちは、世界！ Hello, world!'
const exampleOutput = 'トークン数: 約10 / コスト: $0.0001'

function reset() {
  inputText.value = ''
  outputTokens.value = 1000
}

async function copyResult() {
  if (!cost.value || !selectedModel.value) return
  const text = `Model: ${selectedModel.value.name}
Input Tokens: ${stats.value.estimatedTokens}
Output Tokens: ${outputTokens.value}
Total Tokens: ${stats.value.estimatedTokens + outputTokens.value}
Input Cost: $${cost.value.inputCost}
Output Cost: $${cost.value.outputCost}
Total Cost: $${cost.value.totalCost}`
  await navigator.clipboard.writeText(text)
}

function downloadCSV() {
  if (!cost.value || !selectedModel.value) return
  const csv = `Model,Provider,Input Tokens,Output Tokens,Total Tokens,Input Cost (USD),Output Cost (USD),Total Cost (USD)
${selectedModel.value.name},${selectedModel.value.provider},${stats.value.estimatedTokens},${outputTokens.value},${stats.value.estimatedTokens + outputTokens.value},${cost.value.inputCost},${cost.value.outputCost},${cost.value.totalCost}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'token-cost-estimate.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// providerごとのモデル一覧（テンプレートでの暗黙any回避）
const modelsByProvider = (prov: string) => MODEL_PRICING.filter((m) => m.provider === prov)

// Primerカード（非サスペンド）
const PrimerCardList = defineAsyncComponent({ loader: () => import('@/components/PrimerCardList.vue'), suspensible: false })
const showPrimers = ref(false)
onMounted(() => { showPrimers.value = true })
</script>

<template>
  <main class="mx-auto max-w-6xl p-4 space-y-6">
    <ToolIntro title="LLM Token Counter & Cost Estimator"
      description="テキストのトークン数を計算し、主要LLMモデル（GPT-4、Claude、Gemini）ごとの推定コストを表示します。"
      usage="1) テキストを入力 → 2) モデルを選択 → 3) 出力トークン数を入力 → 4) コストを確認" time="~20秒" audience="AI開発者・プロンプトエンジニア"
      :example-input="exampleInput" :example-output="exampleOutput" />

    <ToolIntroBox>
      <h2 class="text-lg font-semibold mb-2">🎯 このツールでできること</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>日本語・英語混在テキストのトークン数を推定</li>
        <li>主要LLMモデル（OpenAI、Anthropic、Google）のコスト計算</li>
        <li>入力・出力トークンの個別コスト表示</li>
        <li>結果のコピー・CSV出力</li>
      </ul>
    </ToolIntroBox>

    <ToolIntroBox>
      <h2 class="text-lg font-semibold mb-2">⚠️ 注意事項</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>
          トークン数は<strong>推定値</strong>です。実際のトークナイザーとは異なる場合があります。
        </li>
        <li>価格は各社の公表値に基づく概算です。最新の料金は公式サイトをご確認ください。</li>
        <li>
          入力したテキストは<strong>ブラウザ内のみで処理</strong>され、外部に送信されません。
        </li>
      </ul>
    </ToolIntroBox>

    <ToolIntroBox>
      <p class="text-sm">
        このツールの詳しい使い方や、LLMトークンの基礎知識は
        <NuxtLink to="/blog/token-counter-basics" class="text-blue-600 hover:underline">
          入門記事
        </NuxtLink>
        を参照してください。
      </p>
    </ToolIntroBox>

    <!-- 入門記事（自動） -->
    <PrimerCardList v-if="showPrimers" tool-id="token-counter" />

    <!-- Input Section -->
    <div class="surface p-4 rounded">
      <label for="input-text" class="block text-sm font-medium mb-2">テキスト入力</label>
      <textarea id="input-text" v-model="inputText" rows="8"
        class="w-full rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500"
        placeholder="ここにテキストを入力してください（日本語・英語混在可）&#10;例: こんにちは、世界！ Hello, world!"></textarea>
      <div class="mt-2 text-xs text-muted space-y-1">
        <p>文字数: {{ stats.chars }} / 単語数: {{ stats.words }}</p>
        <p>日本語文字: {{ stats.japaneseChars }} / 英単語: {{ stats.englishWords }}</p>
      </div>
    </div>

    <!-- Model Selection -->
    <div class="surface p-4 rounded">
      <label for="model-select" class="block text-sm font-medium mb-2">LLMモデル選択</label>
      <select id="model-select" v-model="selectedModelId"
        class="w-full rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
        <optgroup v-for="provider in ['OpenAI', 'Anthropic', 'Google']" :key="provider" :label="provider">
          <option v-for="model in modelsByProvider(provider)" :key="model.id" :value="model.id">
            {{ model.name }} (入力: ${{ model.inputPer1M }}/1M, 出力: ${{ model.outputPer1M }}/1M)
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Output Tokens -->
    <div class="surface p-4 rounded">
      <label for="output-tokens" class="block text-sm font-medium mb-2">出力トークン数（推定）</label>
      <input id="output-tokens" v-model.number="outputTokens" type="number" min="0" step="100"
        class="w-full rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
      <p class="mt-1 text-xs text-muted">
        レスポンスとして生成されるトークン数の目安を入力してください（デフォルト: 1000）
      </p>
    </div>

    <!-- Results -->
    <div v-if="selectedModel" class="surface p-4 rounded" aria-live="polite">
      <h2 class="text-lg font-semibold mb-3">📊 計算結果</h2>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <h3 class="text-sm font-medium mb-2">トークン数</h3>
          <div class="space-y-1 text-sm">
            <p>入力トークン: <span class="font-bold">{{ stats.estimatedTokens }}</span></p>
            <p>出力トークン: <span class="font-bold">{{ outputTokens }}</span></p>
            <p class="pt-1 border-t border-blue-200 dark:border-blue-800">
              合計トークン:
              <span class="font-bold">{{ stats.estimatedTokens + outputTokens }}</span>
            </p>
          </div>
        </div>

        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <h3 class="text-sm font-medium mb-2">推定コスト（USD）</h3>
          <div v-if="cost" class="space-y-1 text-sm">
            <p>入力コスト: <span class="font-bold">${{ cost.inputCost }}</span></p>
            <p>出力コスト: <span class="font-bold">${{ cost.outputCost }}</span></p>
            <p class="pt-1 border-t border-green-200 dark:border-green-800">
              合計コスト: <span class="font-bold text-lg">${{ cost.totalCost }}</span>
            </p>
          </div>
        </div>
      </div>

      <div class="mt-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded text-xs text-muted">
        <p><strong>{{ selectedModel.name }}</strong> ({{ selectedModel.provider }})</p>
        <p>最大トークン数: {{ selectedModel.maxTokens.toLocaleString() }}</p>
        <p>
          入力: ${{ selectedModel.inputPer1M }}/1M tokens / 出力: ${{
            selectedModel.outputPer1M
          }}/1M tokens
        </p>
      </div>

      <div class="mt-4 flex gap-2">
        <button type="button"
          class="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          @click="copyResult">
          結果をコピー
        </button>
        <button type="button"
          class="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          @click="downloadCSV">
          CSV出力
        </button>
        <button type="button"
          class="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          @click="reset">
          リセット
        </button>
      </div>
    </div>

    <!-- Related Primers -->
    <!-- TODO: Add RelatedList after creating primer article -->
    <!-- <RelatedList :tags="['token-counter', 'llm']" :limit="3" /> -->
  </main>
</template>
