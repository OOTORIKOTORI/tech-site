<template>
  <div class="container mx-auto max-w-3xl py-8 px-4 space-y-6">
    <h1 class="text-2xl font-bold">Cron JST 次回実行予測</h1>

    <div class="rounded-md bg-blue-50 text-blue-900 text-sm p-3">
      入力はローカルでのみ処理されます。サーバーへ送信されることはありません。
    </div>

    <form @submit.prevent="onCheck" class="space-y-3">
      <label for="cron" class="block font-medium">crontab 形式（分 時 日 月 曜日）</label>
      <textarea id="cron" v-model="input" rows="2" class="w-full border rounded p-2 font-mono text-base"
        :aria-invalid="!!error" aria-describedby="cron-help" spellcheck="false" autocomplete="off"></textarea>
      <div id="cron-help" class="text-xs text-gray-500">
        例: <code>*/5 9-18 * * 1-5</code>（平日9-18時に5分毎）
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn-primary">今すぐチェック</button>
        <button type="button" class="btn-secondary" @click="onClear">クリア</button>
        <button type="button" class="btn-secondary" @click="onSample">サンプル挿入</button>

        <div class="ml-auto flex items-center gap-2">
          <label class="text-sm">表示タイムゾーン:</label>
          <label class="text-sm inline-flex items-center gap-1">
            <input type="radio" value="Asia/Tokyo" v-model="tzDisp" /> JST
          </label>
          <label class="text-sm inline-flex items-center gap-1">
            <input type="radio" value="UTC" v-model="tzDisp" /> UTC
          </label>
        </div>

        <div class="flex items-center gap-2">
          <label for="count" class="text-sm">件数:</label>
          <input id="count" type="number" min="1" :max="MAX_TOTAL" class="w-20 border rounded p-1"
            v-model.number="count" />
        </div>

        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary" @click="copyLink">共有リンクをコピー</button>
          <span v-if="copied" class="text-xs text-green-700">コピーしました</span>
        </div>
      </div>

      <div v-if="error" class="text-red-600 font-semibold">{{ error }}</div>
    </form>

    <div v-if="displayed.length" class="space-y-3">
      <h2 class="font-semibold">
        次回実行予定（{{ tzDisp === 'UTC' ? 'UTC' : 'JST' }}表示）
        <span class="text-xs text-gray-500 ml-2">表示中: {{ displayed.length }} / {{ MAX_TOTAL }} 件</span>
      </h2>

      <ul class="list-disc pl-6 space-y-1">
        <li v-for="dt in displayed" :key="dt.toISOString()" class="font-mono">
          {{ format(dt, tzDisp) }}
          <span class="text-gray-500 ml-2">（{{ relative(dt) }}）</span>
        </li>
      </ul>

      <div class="flex items-center gap-3 pt-2">
        <button type="button" class="btn-secondary" @click="loadMore" v-if="canLoadMore">
          もっと表示（+{{ stepForMore }}件）
        </button>
        <span v-else class="text-xs text-gray-500">これ以上は表示できません（最大 {{ MAX_TOTAL }} 件）</span>

        <button type="button" class="btn-primary" @click="downloadCsv" :disabled="!displayed.length">
          CSV でダウンロード
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from '#imports'
import { parseCron, nextRuns } from '~/utils/cron'

const input = ref('')
const error = ref('')
const results = ref<Date[]>([])
const tzDisp = ref<'Asia/Tokyo' | 'UTC'>('Asia/Tokyo')
const count = ref(5)
const copied = ref(false)

// 上限と増分
const MAX_TOTAL = 200
const MORE_STEP = 5

// 表示件数（常に 1..MAX_TOTAL に丸める）
const countClamped = computed(() =>
  Math.max(1, Math.min(Number(count.value ?? 5), MAX_TOTAL))
)

// 画面表示用（results は常に countClamped 件に揃えるけど一応 slice 保険）
const displayed = computed(() => results.value.slice(0, countClamped.value))

// 直近の spec と「基準時刻」（今すぐチェック押下時の時刻）
const lastSpec = ref<ReturnType<typeof parseCron> | null>(null)
const baseFrom = ref<Date | null>(null)

// 「もっと表示」ボタンの表示可否と、増やす件数の表示
const canLoadMore = computed(() => countClamped.value < MAX_TOTAL)
const stepForMore = computed(() =>
  Math.min(MORE_STEP, MAX_TOTAL - countClamped.value)
)

// 基準時刻 from から n 件を丸ごと作り直す
function recompute(n: number) {
  if (!lastSpec.value || !baseFrom.value) return
  results.value = nextRuns(lastSpec.value, baseFrom.value, 'Asia/Tokyo', n)
}

function onCheck() {
  error.value = ''
  results.value = []
  try {
    const spec = parseCron(input.value.trim())
    lastSpec.value = spec
    // 基準時刻を“今”に固定（連打しても秒ずれしにくいように ms は 0 にしておく）
    const now = new Date()
    now.setMilliseconds(0)
    baseFrom.value = now
    recompute(countClamped.value)
  } catch (e: any) {
    error.value = e?.message || '不明なエラーが発生しました'
  }
}

function onClear() {
  input.value = ''
  error.value = ''
  results.value = []
  lastSpec.value = null
  baseFrom.value = null
}

function onSample() {
  input.value = '*/5 9-18 * * 1-5'
  error.value = ''
  results.value = []
  onCheck()
}

function format(dt: Date, tz: 'Asia/Tokyo' | 'UTC') {
  return dt.toLocaleString('ja-JP', {
    timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}

function relative(dt: Date) {
  const diff = dt.getTime() - Date.now()
  const sec = Math.round(Math.abs(diff) / 1000)
  const mins = Math.floor(sec / 60), hrs = Math.floor(mins / 60), days = Math.floor(hrs / 24)
  const s = days ? `${days}日` : hrs ? `${hrs}時間` : mins ? `${mins}分` : `${sec}秒`
  return diff >= 0 ? `あと ${s}` : `${s} 前`
}

async function copyLink() {
  const url = new URL(window.location.href)
  url.searchParams.set('expr', input.value.trim())
  url.searchParams.set('n', String(countClamped.value))
  url.searchParams.set('tz', tzDisp.value)
  await navigator.clipboard.writeText(url.toString())
  copied.value = true
  setTimeout(() => (copied.value = false), 1200)
}

// もっと表示：件数を増やすだけ（再計算は watch で一括実行）
function loadMore() {
  count.value = Math.min(countClamped.value + MORE_STEP, MAX_TOTAL)
}

// 件数変更のたびに“基準時刻から”作り直す
watch(countClamped, n => recompute(n))

// CSV（現在表示ぶん）
function downloadCsv() {
  const rows = displayed.value.map((dt, i) => [
    i + 1,
    dt.toISOString(),
    format(dt, 'Asia/Tokyo'),
    format(dt, 'UTC'),
    relative(dt)
  ])
  const header = ['#', 'ISO', 'JST', 'UTC', 'relative']
  const csv = [header, ...rows].map(r => r.map(v =>
    String(v).includes(',') || String(v).includes('"')
      ? `"${String(v).replace(/"/g, '""')}"` : String(v)
  ).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cron-jst-runs.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

// プリフィル
const route = useRoute()
onMounted(() => {
  const q = route.query?.expr
  if (typeof q === 'string' && q.trim()) input.value = q
  const n = Number(route.query?.n)
  if (Number.isFinite(n) && n >= 1) count.value = Math.min(n, MAX_TOTAL)
  const tz = route.query?.tz
  if (tz === 'UTC' || tz === 'Asia/Tokyo') tzDisp.value = tz
  onCheck()
})
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition;
}
</style>
