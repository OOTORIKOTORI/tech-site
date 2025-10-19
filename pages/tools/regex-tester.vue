<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useHead } from '#imports'
import RelatedList from '@/components/RelatedList.vue'
import AudienceNote from '@/components/AudienceNote.vue'

// ToolIntro 用 例示
const exampleInput = 'abc123\nxyz'
const exampleOutput = 'パターン /\\d+/ → 一致: 123'

useHead({
  title: 'Regex Tester | Migaki Explorer',
  meta: [
    { name: 'description', content: '正規表現の一致・フラグ・キャプチャを確認。' },
    { property: 'og:title', content: 'Regex Tester | Migaki Explorer' },
    { property: 'og:description', content: '正規表現の一致・フラグ・キャプチャを確認。' }
  ]
})

const pattern = ref('')
const flags = ref<{ [k: string]: boolean }>({ i: true, g: true, m: false, s: false, u: false, y: false })
const target = ref('')
const error = ref('')
const matches = ref<Array<{ index: number; groups: string[] }>>([])

const flagString = computed(() => Object.entries(flags.value).filter(([, v]) => v).map(([k]) => k).join(''))

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

async function runTest() {
  error.value = ''
  matches.value = []
  const text = target.value
  const pat = pattern.value
  try {
    const re = new RegExp(pat, flagString.value)
    const ms = Array.from(text.matchAll(re))
    matches.value = ms.map(m => ({ index: m.index ?? 0, groups: Array.from(m) }))
    await nextTick()
  } catch (e: any) {
    error.value = e?.message || '正規表現の構文エラーです。'
  }
}

const highlighted = computed(() => {
  if (!pattern.value) return escapeHtml(target.value)
  try {
    const re = new RegExp(pattern.value, flagString.value)
    return escapeHtml(target.value).replace(re, (m) => `<mark>${escapeHtml(m)}</mark>`)
  } catch {
    return escapeHtml(target.value)
  }
})

async function copyMatches() {
  if (!matches.value.length) return
  const lines = matches.value.map((m, i) => `#${i + 1}@${m.index}: ${m.groups.join(' | ')}`).join('\n')
  await navigator.clipboard.writeText(lines)
}

function clearAll() {
  pattern.value = ''
  target.value = ''
  error.value = ''
  matches.value = []
}
</script>

<template>
  <main class="mx-auto max-w-6xl p-4 space-y-4">
    <ToolIntro title="Regex Tester" description="正規表現の一致・フラグ・キャプチャを確認。" usage="1) パターンとテキストを入力\n2) フラグを選択してテスト"
      time="~30秒" audience="開発・学習" :example-input="exampleInput" :example-output="exampleOutput" />
    <h1 class="text-2xl font-semibold">
      正規表現テスター
    </h1>
    <AudienceNote who="フロント/バックエンド開発者・QA（テキスト処理/バリデーション）" />
    <p class="text-sm text-gray-600">パターンとフラグを指定して一致箇所を確認。巨大テキストはReDoS回避のため入力を控えてください。</p>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label for="re-pattern" class="block text-sm font-medium">パターン</label>
        <input id="re-pattern" v-model="pattern" class="w-full rounded border px-2 py-1 font-mono text-sm"
          placeholder="^foo(.*)$" />
        <fieldset class="flex flex-wrap gap-3 text-sm" aria-label="フラグ">
          <label v-for="k in ['i', 'g', 'm', 's', 'u', 'y']" :key="k" class="inline-flex items-center gap-1">
            <input v-model="flags[k]" type="checkbox" :aria-label="`フラグ ${k}`" />
            <span>{{ k }}</span>
          </label>
        </fieldset>
        <label for="re-target" class="block text-sm font-medium">テスト対象</label>
        <textarea id="re-target" v-model="target" rows="14"
          class="mt-1 w-full rounded border px-2 py-1 font-mono text-sm" placeholder="multi\nline\ntext"></textarea>
        <div class="flex gap-2">
          <button type="button" class="rounded border px-3 py-1 text-sm" @click="runTest">テスト</button>
          <button type="button" class="rounded border px-3 py-1 text-sm" :disabled="!matches.length"
            @click="copyMatches">
            コピー
          </button>
          <button type="button" class="rounded border px-3 py-1 text-sm" @click="clearAll">クリア</button>
        </div>
        <p v-if="error" aria-live="assertive" class="text-sm text-red-600">{{ error }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium">結果</label>
        <div class="mt-1 rounded border border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-2">
          <div class="prose prose-sm max-w-none" v-html="highlighted"></div>
          <pre v-if="matches.length" class="mt-2 text-xs overflow-x-auto"><code>{{ matches }}</code></pre>
        </div>
      </div>
    </div>

    <RelatedList :tags="['regex', 'test', 'string', 'tools']" />
  </main>
</template>
