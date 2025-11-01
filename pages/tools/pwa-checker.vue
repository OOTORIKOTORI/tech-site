<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHead, useRequestURL } from '#imports'
import {
  validateManifest,
  validateIcons,
  calculateManifestScore,
  type ManifestValidationResult,
  type IconValidation,
} from '~/utils/pwa-manifest'

useHead({
  title: 'PWA Manifest Checker | Migaki Explorer',
  meta: [
    {
      name: 'description',
      content:
        'URLからmanifest.jsonを取得し、必須フィールドや推奨設定を検証します。PWAの品質チェックに。',
    },
    {
      property: 'og:title',
      content: 'PWA Manifest Checker | Migaki Explorer',
    },
    {
      property: 'og:description',
      content: 'PWA manifest.jsonの検証ツール。必須フィールドとアイコンサイズをチェック。',
    },
  ],
})

const targetUrl = ref('')
const loading = ref(false)
const error = ref('')

const manifestData = ref<{
  pageUrl: string
  manifestUrl: string | null
  manifest: any
  error: string | null
} | null>(null)

const validationResults = computed<ManifestValidationResult[]>(() => {
  if (!manifestData.value?.manifest) return []
  return validateManifest(manifestData.value.manifest)
})

const iconValidations = computed<IconValidation[]>(() => {
  if (!manifestData.value?.manifest) return []
  return validateIcons(manifestData.value.manifest)
})

const score = computed(() => {
  if (validationResults.value.length === 0) return 0
  return calculateManifestScore(validationResults.value)
})

const exampleInput = 'https://example.com'
const exampleOutput = 'Manifest検証結果: name ✓, icons ✓, display ✓'

async function checkManifest() {
  if (!targetUrl.value.trim()) {
    error.value = 'URLを入力してください'
    return
  }

  loading.value = true
  error.value = ''
  manifestData.value = null

  try {
    // SSRでの相対URL回避（Only absolute URLs are supported 対策）
    const origin = process.client ? window.location.origin : useRequestURL().origin
    // eslint-disable-next-line no-undef
    const response = await $fetch(`${origin}/api/manifest`, {
      query: { url: targetUrl.value.trim() },
    })
    const data = response as {
      pageUrl: string
      manifestUrl: string | null
      manifest: any
      error: string | null
    }
    manifestData.value = data
    if (data.error) {
      error.value = data.error
    }
  } catch (err: any) {
    error.value = err.message || 'Manifest取得に失敗しました'
  } finally {
    loading.value = false
  }
}

function reset() {
  targetUrl.value = ''
  manifestData.value = null
  error.value = ''
}

async function copyResults() {
  if (!manifestData.value) return
  const text = `PWA Manifest Check Results
URL: ${manifestData.value.pageUrl}
Manifest URL: ${manifestData.value.manifestUrl || 'N/A'}
Score: ${score.value}/100

Validation Results:
${validationResults.value.map((r) => `${r.field}: ${r.status} - ${r.message}`).join('\n')}

Icon Validation:
${iconValidations.value.map((i) => `${i.size}: ${i.status} - ${i.message}`).join('\n')}`
  await navigator.clipboard.writeText(text)
}

function downloadJSON() {
  if (!manifestData.value?.manifest) return
  const blob = new Blob([JSON.stringify(manifestData.value.manifest, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'manifest.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <main class="mx-auto max-w-6xl p-4 space-y-6">
    <ToolIntro title="PWA Manifest Checker" description="URLからmanifest.jsonを取得し、必須フィールドや推奨設定を検証します。"
      usage="1) URLを入力 → 2) チェック実行 → 3) 結果を確認" time="~30秒" audience="フロントエンド開発者" :example-input="exampleInput"
      :example-output="exampleOutput" />

    <ToolIntroBox>
      <h2 class="text-lg font-semibold mb-2">🎯 このツールでできること</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>ページからmanifest.jsonを自動検出</li>
        <li>必須フィールド（name、icons、display等）の検証</li>
        <li>推奨アイコンサイズ（192x192、512x512）のチェック</li>
        <li>100点満点のスコア表示</li>
        <li>結果のコピー・manifest.jsonのダウンロード</li>
      </ul>
    </ToolIntroBox>

    <ToolIntroBox>
      <h2 class="text-lg font-semibold mb-2">⚠️ 注意事項</h2>
      <ul class="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>HTTPS</strong>でホストされていないPWAはインストールできません
        </li>
        <li>一部サイトではCORSポリシーによりmanifest取得が制限される場合があります</li>
        <li>検証結果は参考情報です。実際のPWA動作は各ブラウザで確認してください</li>
      </ul>
    </ToolIntroBox>

    <ToolIntroBox>
      <p class="text-sm">
        PWA manifestの詳しい書き方や基礎知識は
        <NuxtLink to="/blog/pwa-checker-basics" class="text-blue-600 hover:underline">
          入門記事
        </NuxtLink>
        を参照してください。
      </p>
    </ToolIntroBox>

    <!-- Input Section -->
    <div class="surface p-4 rounded">
      <label for="target-url" class="block text-sm font-medium mb-2">チェック対象のURL</label>
      <div class="flex gap-2">
        <input id="target-url" v-model="targetUrl" type="url"
          class="flex-1 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com" @keydown.enter="checkManifest" />
        <button type="button"
          class="rounded bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          :disabled="loading" @click="checkManifest">
          {{ loading ? 'チェック中...' : 'チェック' }}
        </button>
        <button type="button"
          class="rounded border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          @click="reset">
          リセット
        </button>
      </div>
      <p class="mt-2 text-xs text-muted">
        PWAのトップページやランディングページのURLを入力してください
      </p>
    </div>

    <!-- Error -->
    <div v-if="error" class="surface p-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800"
      role="alert">
      <p class="text-sm text-red-700 dark:text-red-300">❌ {{ error }}</p>
    </div>

    <!-- Results -->
    <div v-if="manifestData && manifestData.manifest" class="space-y-4">
      <!-- Score -->
      <div class="surface p-4 rounded text-center">
        <h2 class="text-sm font-medium mb-2">総合スコア</h2>
        <div class="text-5xl font-bold" :class="{
          'text-green-600': score >= 80,
          'text-yellow-600': score >= 60 && score < 80,
          'text-red-600': score < 60,
        }">
          {{ score }}<span class="text-2xl">/100</span>
        </div>
        <p class="mt-2 text-sm text-muted">
          {{ score >= 80 ? '良好です！' : score >= 60 ? '改善の余地があります' : '要修正項目があります' }}
        </p>
      </div>

      <!-- Manifest URL -->
      <div class="surface p-3 rounded text-xs">
        <p><strong>Page URL:</strong> {{ manifestData.pageUrl }}</p>
        <p><strong>Manifest URL:</strong> {{ manifestData.manifestUrl }}</p>
      </div>

      <!-- Validation Results -->
      <div class="surface p-4 rounded">
        <h2 class="text-lg font-semibold mb-3">📋 フィールド検証</h2>
        <div class="space-y-2">
          <div v-for="result in validationResults" :key="result.field" class="p-3 rounded border" :class="{
            'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800':
              result.status === 'ok',
            'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800':
              result.status === 'warning',
            'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800':
              result.status === 'error',
          }">
            <div class="flex items-start gap-2">
              <span class="text-lg">
                {{ result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌' }}
              </span>
              <div class="flex-1">
                <p class="font-medium text-sm">{{ result.field }}</p>
                <p class="text-sm text-muted">{{ result.message }}</p>
                <p v-if="result.value" class="text-xs mt-1 font-mono">値: {{ result.value }}</p>
                <p v-if="result.expected" class="text-xs mt-1 text-muted">
                  推奨: {{ result.expected }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Icon Validation -->
      <div class="surface p-4 rounded">
        <h2 class="text-lg font-semibold mb-3">🖼️ アイコン検証</h2>
        <div class="space-y-2">
          <div v-for="icon in iconValidations" :key="icon.size" class="p-3 rounded border" :class="{
            'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800':
              icon.status === 'ok',
            'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800':
              icon.status === 'warning',
            'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800':
              icon.status === 'missing',
          }">
            <div class="flex items-start gap-2">
              <span class="text-lg">
                {{
                  icon.status === 'ok' ? '✅' : icon.status === 'warning' ? '⚠️' : '❌'
                }}
              </span>
              <div class="flex-1">
                <p class="font-medium text-sm">{{ icon.size }}</p>
                <p class="text-sm text-muted">{{ icon.message }}</p>
                <p v-if="icon.src" class="text-xs mt-1 font-mono">{{ icon.src }}</p>
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
          @click="downloadJSON">
          manifest.jsonをダウンロード
        </button>
      </div>
    </div>

    <!-- Related Primers -->
    <!-- TODO: Add RelatedList after creating primer article -->
    <!-- <RelatedList :tags="['pwa', 'manifest']" :limit="3" /> -->
  </main>
</template>
