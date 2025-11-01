<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { useHead, useRequestURL } from '#imports'
import {
  validateSecurityHeaders,
  calculateSecurityScore,
  type SecurityHeaderCheck,
} from '~/utils/security-headers'

useHead({
  title: 'Security Header Checker | Migaki Explorer',
  meta: [
    {
      name: 'description',
      content:
        'URLのHTTPレスポンスヘッダを取得し、セキュリティヘッダの有無と推奨値を判定します。',
    },
    {
      property: 'og:title',
      content: 'Security Header Checker | Migaki Explorer',
    },
    {
      property: 'og:description',
      content: 'Webセキュリティヘッダの検証ツール。CSP、HSTS、X-Frame-Options等をチェック。',
    },
  ],
})

const targetUrl = ref('')
const loading = ref(false)
const error = ref('')

const headerData = ref<{
  url: string
  status: number
  headers: Record<string, string>
  error: string | null
} | null>(null)

const securityChecks = computed<SecurityHeaderCheck[]>(() => {
  if (!headerData.value?.headers) return []
  return validateSecurityHeaders(headerData.value.headers)
})

const score = computed(() => {
  if (securityChecks.value.length === 0) return 0
  return calculateSecurityScore(securityChecks.value)
})

const criticalIssues = computed(() =>
  securityChecks.value.filter((c) => c.status !== 'ok' && c.severity === 'critical')
)
const highIssues = computed(() =>
  securityChecks.value.filter((c) => c.status !== 'ok' && c.severity === 'high')
)
const mediumIssues = computed(() =>
  securityChecks.value.filter((c) => c.status !== 'ok' && c.severity === 'medium')
)
const lowIssues = computed(() =>
  securityChecks.value.filter((c) => c.status !== 'ok' && c.severity === 'low')
)

const exampleInput = 'https://example.com'
const exampleOutput = 'セキュリティスコア: 75/100 (CSP ✓, HSTS ✓)'

// Primerカード（非サスペンド）
const PrimerCardList = defineAsyncComponent({ loader: () => import('@/components/PrimerCardList.vue'), suspensible: false })
const showPrimers = ref(false)

async function checkHeaders() {
  if (!targetUrl.value.trim()) {
    error.value = 'URLを入力してください'
    return
  }

  loading.value = true
  error.value = ''
  headerData.value = null

  try {
    // SSRでの相対URL回避（Only absolute URLs are supported 対策）
    const origin = process.client ? window.location.origin : useRequestURL().origin
    // eslint-disable-next-line no-undef
    const response = await $fetch(`${origin}/api/headers`, {
      query: { url: targetUrl.value.trim() },
    })
    const data = response as {
      url: string
      status: number
      headers: Record<string, string>
      error: string | null
    }
    headerData.value = data
    if (data.error) {
      error.value = data.error
    }
  } catch (err: any) {
    error.value = err.message || 'ヘッダ取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function reset() {
  targetUrl.value = ''
  headerData.value = null
  error.value = ''
}

async function copyResults() {
  if (!headerData.value) return
  const text = `Security Header Check Results
URL: ${headerData.value.url}
Status: ${headerData.value.status}
Score: ${score.value}/100

Critical Issues: ${criticalIssues.value.length}
High Issues: ${highIssues.value.length}
Medium Issues: ${mediumIssues.value.length}
Low Issues: ${lowIssues.value.length}

Header Checks:
${securityChecks.value.map((c) => `${c.header}: ${c.status} - ${c.message}`).join('\n')}`
  await navigator.clipboard.writeText(text)
}

function downloadCSV() {
  if (!securityChecks.value.length) return
  const csv = `Header,Status,Severity,Message,Value,Recommendation
${securityChecks.value
      .map(
        (c) =>
          `"${c.header}","${c.status}","${c.severity}","${c.message}","${c.value || ''}","${c.recommendation || ''}"`
      )
      .join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'security-headers-check.csv'
  a.click()
  URL.revokeObjectURL(url)
}
onMounted(() => { showPrimers.value = true })
</script>

<template>
  <main class="mx-auto max-w-6xl p-4 space-y-6">
    <ToolIntro title="Security Header Checker" description="URLのHTTPレスポンスヘッダを取得し、セキュリティヘッダの有無と推奨値を判定します。"
      usage="1) URLを入力 → 2) チェック実行 → 3) 結果を確認" time="~30秒" audience="Web開発者・セキュリティ担当" :example-input="exampleInput"
      :example-output="exampleOutput" />

    <ToolIntroBox>
      <h2 class="text-lg font-semibold mb-2">🎯 このツールでできること</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>HTTPレスポンスヘッダの取得</li>
        <li>主要セキュリティヘッダ（CSP、HSTS、X-Frame-Options等）の検証</li>
        <li>100点満点のセキュリティスコア表示</li>
        <li>重要度別の問題リスト（Critical / High / Medium / Low）</li>
        <li>推奨設定の表示と結果のCSV出力</li>
      </ul>
    </ToolIntroBox>

    <ToolIntroBox>
      <h2 class="text-lg font-semibold mb-2">⚠️ 注意事項</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>ヘッダ検査はサーバーサイドで実行されます</li>
        <li>外部サイトのセキュリティポリシーにより、取得が拒否される場合があります</li>
        <li>検証結果は参考情報です。実際のセキュリティ対策は専門家にご相談ください</li>
      </ul>
    </ToolIntroBox>

    <ToolIntroBox>
      <p class="text-sm">
        セキュリティヘッダの詳しい説明や設定方法は
        <NuxtLink to="/blog/security-checker-basics" class="text-blue-600 hover:underline">
          入門記事
        </NuxtLink>
        を参照してください。
      </p>
    </ToolIntroBox>

    <!-- 入門記事（自動） -->
    <PrimerCardList v-if="showPrimers" tool-id="security-checker" />

    <!-- Input Section -->
    <div class="surface p-4 rounded">
      <label for="target-url" class="block text-sm font-medium mb-2">チェック対象のURL</label>
      <div class="flex gap-2">
        <input id="target-url" v-model="targetUrl" type="url"
          class="flex-1 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com" @keydown.enter="checkHeaders" />
        <button type="button"
          class="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          :disabled="loading" @click="checkHeaders">
          {{ loading ? 'チェック中...' : 'チェック' }}
        </button>
        <button type="button"
          class="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          @click="reset">
          リセット
        </button>
      </div>
      <p class="mt-2 text-xs text-muted">
        HTTPSサイトを推奨します（HSTSヘッダの検証のため）
      </p>
    </div>

    <!-- Error -->
    <div v-if="error" class="surface p-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800"
      role="alert">
      <p class="text-sm text-red-700 dark:text-red-300">❌ {{ error }}</p>
    </div>

    <!-- Results -->
    <div v-if="headerData && headerData.headers" class="space-y-4">
      <!-- Score -->
      <div class="surface p-4 rounded text-center">
        <h2 class="text-sm font-medium mb-2">セキュリティスコア</h2>
        <div class="text-5xl font-bold" :class="{
          'text-green-600': score >= 80,
          'text-yellow-600': score >= 60 && score < 80,
          'text-red-600': score < 60,
        }">
          {{ score }}<span class="text-2xl">/100</span>
        </div>
        <p class="mt-2 text-sm text-muted">
          {{
            score >= 80
              ? '優秀なセキュリティ設定です！'
              : score >= 60
                ? '改善の余地があります'
                : '重要な問題があります'
          }}
        </p>

        <!-- Issue Summary -->
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div class="font-bold text-red-600">{{ criticalIssues.length }}</div>
            <div class="text-xs text-muted">Critical</div>
          </div>
          <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
            <div class="font-bold text-orange-600">{{ highIssues.length }}</div>
            <div class="text-xs text-muted">High</div>
          </div>
          <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div class="font-bold text-yellow-600">{{ mediumIssues.length }}</div>
            <div class="text-xs text-muted">Medium</div>
          </div>
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div class="font-bold text-blue-600">{{ lowIssues.length }}</div>
            <div class="text-xs text-muted">Low</div>
          </div>
        </div>
      </div>

      <!-- URL & Status -->
      <div class="surface p-3 rounded text-xs">
        <p><strong>URL:</strong> {{ headerData.url }}</p>
        <p><strong>Status:</strong> {{ headerData.status }}</p>
      </div>

      <!-- Security Header Checks -->
      <div class="surface p-4 rounded">
        <h2 class="text-lg font-semibold mb-3">🔒 セキュリティヘッダ検証</h2>
        <div class="space-y-2">
          <div v-for="check in securityChecks" :key="check.header" class="p-3 rounded border" :class="{
            'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800':
              check.status === 'ok',
            'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800':
              check.status === 'warning',
            'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800':
              check.status === 'danger',
          }">
            <div class="flex items-start gap-2">
              <span class="text-lg">
                {{
                  check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
                }}
              </span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-sm">{{ check.header }}</p>
                  <span class="text-xs px-2 py-0.5 rounded" :class="{
                    'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200':
                      check.severity === 'critical',
                    'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200':
                      check.severity === 'high',
                    'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200':
                      check.severity === 'medium',
                    'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200':
                      check.severity === 'low',
                  }">
                    {{ check.severity }}
                  </span>
                </div>
                <p class="text-sm text-muted mt-1">{{ check.message }}</p>
                <p v-if="check.value" class="text-xs mt-1 font-mono break-all">
                  値: {{ check.value }}
                </p>
                <p v-if="check.recommendation" class="text-xs mt-1 text-muted">
                  💡 推奨: {{ check.recommendation }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button type="button"
          class="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          @click="copyResults">
          結果をコピー
        </button>
        <button type="button"
          class="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          @click="downloadCSV">
          CSV出力
        </button>
      </div>
    </div>

    <!-- Related Primers -->
    <!-- TODO: Add RelatedList after creating primer article -->
    <!-- <RelatedList :tags="['security', 'headers']" :limit="3" /> -->
  </main>
</template>
