<template>
  <div class="container mx-auto max-w-2xl py-8 px-4">
    <h1 class="text-2xl font-bold mb-4">Cron JST 次回実行予測</h1>
    <form @submit.prevent="onCheck" class="mb-4">
      <label for="cron" class="block font-medium mb-1">crontab 形式（分 時 日 月 曜日）</label>
      <textarea id="cron" v-model="input" rows="2" class="w-full border rounded p-2 font-mono text-base mb-2"
        :aria-invalid="!!error" aria-describedby="cron-help" aria-live="polite" spellcheck="false"
        autocomplete="off"></textarea>
      <div id="cron-help" class="text-xs text-gray-500 mb-2">
        例: <code>*/5 9-18 * * 1-5</code>（平日9-18時に5分毎）
      </div>
      <div class="flex gap-2 mb-2">
        <button type="submit" class="btn-primary">今すぐチェック</button>
        <button type="button" class="btn-secondary" @click="onClear">クリア</button>
        <button type="button" class="btn-secondary" @click="onSample">サンプル挿入</button>
      </div>
      <div v-if="error" class="text-red-600 font-semibold mb-2" aria-live="polite">{{ error }}</div>
    </form>
    <div v-if="results.length" class="mb-4">
      <h2 class="font-semibold mb-2">次回実行予定（JST）</h2>
      <ul class="list-disc pl-6">
        <li v-for="(dt, i) in results" :key="i" class="font-mono">{{ format(dt) }}</li>
      </ul>
    </div>
    <div class="text-xs text-gray-500 mt-6">
      ※ 入力はローカルでのみ処理され、サーバー送信はありません。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseCron, nextRuns } from '~/utils/cron'

const input = ref('')
const error = ref('')
const results = ref<Date[]>([])

function onCheck() {
  error.value = ''
  results.value = []
  try {
    const spec = parseCron(input.value.trim())
    results.value = nextRuns(spec, new Date(), 'Asia/Tokyo', 5)
  } catch (e: any) {
    error.value = e.message || '不明なエラーが発生しました'
  }
}
function onClear() {
  input.value = ''
  error.value = ''
  results.value = []
}
function onSample() {
  input.value = '*/5 9-18 * * 1-5'
  error.value = ''
  results.value = []
}
function format(dt: Date) {
  return dt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false })
}
</script>

<style scoped lang="postcss">
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-800 px-4 py-1 rounded hover:bg-gray-300 transition;
}
</style>
