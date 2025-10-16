<script setup lang="ts">
import { ref } from 'vue'
import RelatedList from '@/components/RelatedList.vue'
import AudienceNote from '@/components/AudienceNote.vue'

const input = ref('')
const output = ref('')
const error = ref('')

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
    <h1 class="text-2xl font-semibold">JSON フォーマッタ / バリデータ</h1>
    <AudienceNote who="API/フロント/バックエンド開発者" />
    <p class="text-sm text-gray-600">ペーストして整形 / 最小化。アップロード不要（ブラウザ内のみ）。</p>

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
        <div aria-live="polite" class="mt-1 min-h-[3rem] rounded border bg-gray-50 p-2">
          <pre v-if="output" class="overflow-x-auto text-sm"><code>{{ output }}</code></pre>
          <p v-else class="text-sm text-gray-400">整形結果がここに表示されます。</p>
        </div>
        <p v-if="error" aria-live="assertive" class="mt-2 text-sm text-red-600">{{ error }}</p>
      </div>
    </div>

    <RelatedList :tags="['json', 'format', 'validate', 'tools']" />
  </main>
</template>
