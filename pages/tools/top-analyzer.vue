<script setup lang="ts">
import { ref } from 'vue'
import { downloadCSV, TOP_COLUMNS, type HeaderLang } from '@/utils/top/csv'
import { definePageMeta, useHead } from '#imports'
import type { TopSnapshot } from '../../types/top'
import TopSummary from '@/components/TopSummary.vue'
import TopCharts from '@/components/TopCharts.vue'
import AudienceNote from '@/components/AudienceNote.vue'

definePageMeta({ title: 'Top Log Analyzer' })

// ToolIntro 用 例示
const exampleInput = 'timestamp,cpu,load,mem\n10:00,23,0.58,1024 ...'
const exampleOutput = 'CPU/Load/Mem の折れ線グラフと SVG/PNG 保存'

useHead({
  title: 'Top Analyzer | Migaki Explorer',
  meta: [
    { name: 'description', content: 'top の CSV を可視化。CPU/Load/Mem を比較し、SVG/PNGで保存可能。' },
    { property: 'og:title', content: 'Top Analyzer | Migaki Explorer' },
    { property: 'og:description', content: 'top の CSV を可視化。CPU/Load/Mem を比較し、SVG/PNGで保存可能。' }
  ]
})


const file = ref<File | null>(null)
const snapshots = ref<TopSnapshot[]>([])

const warnings = ref<string[]>([])
const busy = ref(false)
const progress = ref(0)
const headerLang = ref<HeaderLang>('en')

function onDownload() {
  if (!snapshots.value.length) return
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadCSV(snapshots.value, `top_parsed_${ts}.csv`, headerLang.value)
}

function onPick(e: Event) {
  const t = e.target as HTMLInputElement
  file.value = t.files?.[0] ?? null
}


async function analyze() {
  if (!file.value) return
  busy.value = true
  progress.value = 0
  const worker = new Worker(new URL('../../workers/topParser.worker.ts', import.meta.url), { type: 'module' })
  const text = await file.value.text()
  // MVP: 全文をworkerに投げる
  worker.postMessage({ text })
  await new Promise<void>(resolve => {
    worker.onmessage = (e: MessageEvent) => {
      const { snapshots: s, warnings: w } = e.data
      snapshots.value = s
      warnings.value = w
      progress.value = 100
      resolve()
    }
  })
  busy.value = false
}

</script>

<template>
  <main class="mx-auto max-w-5xl p-6 space-y-6">
    <ToolIntro title="Top Analyzer" description="top の CSV を可視化。CPU/Load/Mem を比較し、SVG/PNGで保存可能。"
      usage="1) CSV を貼り付け/選択\n2) グラフ化→保存（SVG/PNG）" time="~30秒" audience="運用・調査" :example-input="exampleInput"
      :example-output="exampleOutput" />
    <h1 class="text-2xl font-bold">Top Log Analyzer</h1>

    <AudienceNote who="Linux/インフラ運用のSE/DevOps" />

    <ToolIntroBox audience="サーバ運用・SRE・開発（原因調査の初動を早くしたい方）" value="top のログから CPU/メモリ/ロードアベレージの時系列と、重いプロセスの傾向を可視化"
      how="ログファイルをドロップ/選択 → 解析 → ピークと該当プロセスを確認" safety="**ファイルはアップロードされません。処理はブラウザ内のみです。**" />

    <section class="space-y-3">
      <label class="block text-sm font-medium">ログファイルを選択</label>
      <input type="file" accept=".log,.txt" @change="onPick" />
      <div class="text-xs text-gray-500">例: <code>top -b -d 5 -n 1000 &gt; top_2025-10-14.log</code></div>
      <div class="flex items-center gap-3 text-sm mt-1">
        <a href="/samples/top_sample.log" download class="underline hover:no-underline">
          サンプルログをダウンロード
        </a>
        <span class="text-gray-500">（安全なダミーデータ。ブラウザ内のみで解析）</span>
      </div>
      <button :disabled="!file || busy"
        class="rounded-lg px-4 py-2 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50" @click="analyze">
        {{ busy ? '解析中…' : '解析する' }}
      </button>
      <div v-if="busy" class="w-full h-2 bg-gray-100 rounded overflow-hidden">
        <div class="h-full bg-blue-400 transition-all" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="text-xs text-gray-500">※ ファイルはアップロードされません。端末内で解析されます。</p>
    </section>

    <section class="space-y-2">
      <div class="flex items-center gap-3 justify-end">
        <label class="text-xs text-gray-600">CSVヘッダー</label>
        <select v-model="headerLang" class="rounded-md ring-1 ring-gray-300 text-sm px-2 py-1 bg-white">
          <option value="en">英語</option>
          <option value="ja">日本語</option>
        </select>
        <button :disabled="!snapshots.length"
          class="rounded-lg px-3 py-1.5 text-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          @click="onDownload">
          CSVをダウンロード
        </button>
      </div>
      <h2 class="text-xl font-semibold">Summary</h2>
      <div v-if="!snapshots.length" class="text-gray-500 text-sm">解析結果がここに表示されます。</div>
      <div v-else>
        <div class="mb-2 text-sm text-gray-500">スナップショット数: {{ snapshots.length }}</div>
        <TopSummary :snapshots="snapshots" />
      </div>
      <div v-if="warnings.length" class="text-amber-600 text-sm mt-2">
        <p class="font-medium">Warnings:</p>
        <ul class="list-disc pl-5">
          <li v-for="w in warnings" :key="w">{{ w }}</li>
        </ul>
      </div>
    </section>
    <!-- 項目の見方 -->
    <section class="space-y-2">
      <details class="rounded-xl ring-1 ring-gray-200 p-3 bg-white/60">
        <summary class="cursor-pointer font-medium">項目の見方（クリックで開く）</summary>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <div v-for="c in TOP_COLUMNS" :key="c.key" class="text-sm">
            <div class="font-medium">{{ c.ja }} <span class="text-gray-500">({{ c.key }})</span></div>
            <div class="text-gray-600">
              {{ c.note || '—' }}<span v-if="c.unit"> / 単位: {{ c.unit }}</span>
            </div>
          </div>
        </div>
      </details>
    </section>

    <section class="space-y-2">
      <h2 class="text-xl font-semibold">Charts</h2>
      <div v-if="!snapshots.length" class="text-gray-500 text-sm">CPU/Load/Mem のグラフはログ解析後に表示されます。</div>
      <TopCharts v-else :snapshots="snapshots" />
    </section>

    <RelatedList :tags="['linux', 'infra', 'devops', 'tools']" />
  </main>
</template>
