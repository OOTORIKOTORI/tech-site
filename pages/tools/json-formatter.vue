<script setup lang="ts">
import { ref } from 'vue'
import RelatedList from '@/components/RelatedList.vue'


import { useHead } from '#imports'
useHead({
  title: 'JSON Formatter | Migaki Explorer',
  meta: [
    { name: 'description', content: 'JSONを整形・最小化・検証できるオンラインツール。貼り付けてワンクリック。' },
    { property: 'og:title', content: 'JSON Formatter | Migaki Explorer' },
    { property: 'og:description', content: 'JSONを整形・最小化・検証できるオンラインツール。' },
    // 画像は共通OGPでも可
  ]
})

const input = ref('')
const output = ref('')
const error = ref('')

// ToolIntro用サンプル文字列
const exampleInput = '{ "hello": "world" }'
const exampleOutput = `{
  "hello": "world"
}`

function parseAndFormat(space = 2) {
  error.value = ''
  try {
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj, space ? null : undefined, space || undefined)
  } catch (e: any) {
    error.value = e?.message || 'JSON の解析に失敗しました。'
    output.value = ''
  }
}

function minify() {
  error.value = ''
  try {
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj)
  } catch (e: any) {
    error.value = e?.message || 'JSON の解析に失敗しました。'
    output.value = ''
  }
}

async function copyOutput() {
  if (!output.value) return
  await navigator.clipboard.writeText(output.value)
}

function downloadJson() {
  if (!output.value) return
  const blob = new Blob([output.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <main class="mx-auto max-w-6xl p-4 space-y-4">
    <ToolIntro title="JSON Formatter" description="JSON 文字列を整形 / 最小化 / 検証します。"
      usage="1) 入力欄にJSONを貼り付ける\n2) 「整形」または「最小化」をクリック" time="~10秒" audience="開発者・学習者" :example-input="exampleInput"
      :example-output="exampleOutput" />
    <ToolIntroBox value="JSON を整形/検証/コピー/ダウンロードできます。" how="1) JSONを貼付 → 2) 整形/ミニファイ → 3) 必要に応じてコピー/保存"
      safety="貼り付けたJSONは<strong>ブラウザ内で処理</strong>されます。" />
    <ToolIntroBox>
      <p>このツールの使い方や基本概念は <NuxtLink to="/blog/json-formatter-basics">こちらの記事</NuxtLink> を参照。</p>
    </ToolIntroBox>

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label for="json-input" class="block text-sm font-medium">入力</label>
        <textarea id="json-input" v-model="input" rows="14"
          class="mt-1 w-full rounded border px-2 py-1 font-mono text-sm"
          placeholder="{&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:20}"></textarea>
        <div class="mt-2 flex gap-2">
          <button type="button" class="rounded border px-3 py-1 text-sm" @click="parseAndFormat(2)">整形</button>
          <button type="button" class="rounded border px-3 py-1 text-sm" @click="minify">最小化</button>
          <button type="button" class="rounded border px-3 py-1 text-sm" :disabled="!output" @click="copyOutput">
            コピー
          </button>
          <button type="button" class="rounded border px-3 py-1 text-sm" :disabled="!output" @click="downloadJson">
            ダウンロード
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-500">注意: 秘密情報は含めないでください。</p>
      </div>
      <div>
        <label class="block text-sm font-medium">出力</label>
        <div aria-live="polite"
          class="mt-1 min-h-[3rem] rounded border border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-2">
          <pre v-if="output" class="overflow-x-auto text-sm"><code>{{ output }}</code></pre>
          <p v-else class="text-sm text-gray-400">整形結果がここに表示されます。</p>
        </div>
        <p v-if="error" aria-live="assertive" class="mt-2 text-sm text-red-600">{{ error }}</p>
      </div>
    </div>

    <RelatedList :tags="['json', 'format', 'validate', 'tools']" />
  </main>
</template>
