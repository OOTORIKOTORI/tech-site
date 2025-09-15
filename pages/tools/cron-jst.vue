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
          <div class="flex items-center gap-2">
            <span class="text-sm">相対基準:</span>
            <label class="text-sm inline-flex items-center gap-1">
              <input type="radio" value="now" v-model="relMode" /> 今
            </label>
            <label class="text-sm inline-flex items-center gap-1">
              <input type="radio" value="base" v-model="relMode" /> 基準時刻
            </label>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <label for="baseAt" class="text-sm">基準時刻:</label>
          <input id="baseAt" type="datetime-local" step="60" class="border rounded p-1" v-model="baseInput"
            :disabled="relMode !== 'base'" />
          <button type="button" class="btn-secondary" @click="setBaseNow" :disabled="relMode !== 'base'">今</button>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from '#imports'
import { parseCron, nextRuns } from '~/utils/cron'

const input = ref('')
const error = ref('')
const results = ref<Date[]>([])
const tzDisp = ref<'Asia/Tokyo' | 'UTC'>('Asia/Tokyo')
const count = ref(5)
const copied = ref(false)
const baseInput = ref('') // datetime-local の値
const baseFrom = ref<Date | null>(null) // UTC基準の瞬間

// 相対表示用の現在時刻（30秒毎に更新：境界に揃えて開始）
const now = ref<number>(Date.now())
let nowIv: ReturnType<typeof setInterval> | null = null
let nowTo: ReturnType<typeof setTimeout> | null = null
const tick = () => { now.value = Date.now() }

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

// 「もっと表示」ボタンの表示可否と、増やす件数の表示
const canLoadMore = computed(() => countClamped.value < MAX_TOTAL)
const stepForMore = computed(() =>
  Math.min(MORE_STEP, MAX_TOTAL - countClamped.value)
)

const relMode = ref<'now' | 'base'>('now')

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

    // 入力があれば優先、未入力/不正なら「今」で初期化
    const parsed = baseInput.value ? fromInputValue(baseInput.value, tzDisp.value) : null
    if (parsed) {
      baseFrom.value = parsed
    } else {
      // ← ここは setBaseNow() でも OK（下で秒0化済み）
      const anchor = new Date()
      anchor.setSeconds(0, 0)         // 秒・ミリ秒を 0 に
      baseFrom.value = anchor
    }

    // UI 側のフォーマットも現在のTZで揃える
    baseInput.value = toInputValue(baseFrom.value!, tzDisp.value)

    // 再計算
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
  baseInput.value = ''
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
  const anchorMs =
    relMode.value === 'base' && baseFrom.value
      ? baseFrom.value.getTime()
      : now.value

  const diffMs = dt.getTime() - anchorMs
  const future = diffMs >= 0
  const absSec = Math.max(0, Math.floor(Math.abs(diffMs) / 1000))

  const fmt = (val: number, unit: '分' | '時間' | '日') =>
    future ? `あと ${val}${unit}` : `${val}${unit} 前`

  if (absSec < 90) return fmt(1, '分')
  const mins = future ? Math.ceil(absSec / 60) : Math.floor(absSec / 60)
  if (mins < 60) return fmt(mins, '分')
  const hours = future ? Math.ceil(mins / 60) : Math.floor(mins / 60)
  if (hours < 48) return fmt(hours, '時間')
  const days = future ? Math.ceil(hours / 24) : Math.floor(hours / 24)
  return fmt(days, '日')
}

async function copyLink() {
  const url = new URL(window.location.href)
  url.searchParams.set('expr', input.value.trim())
  url.searchParams.set('n', String(countClamped.value))
  url.searchParams.set('tz', tzDisp.value)
  url.searchParams.set('rel', relMode.value)
  if (relMode.value === 'base' && baseInput.value) {
    url.searchParams.set('from', baseInput.value)
  } else {
    url.searchParams.delete('from')
  }
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

// ---- 基準時刻関連ヘルパー ----
function pad(n: number) { return String(n).padStart(2, '0') }
function toInputValue(d: Date, tz: 'Asia/Tokyo' | 'UTC') {
  const y = tz === 'UTC' ? d.getUTCFullYear() : d.getFullYear()
  const mo = pad((tz === 'UTC' ? d.getUTCMonth() : d.getMonth()) + 1)
  const da = pad(tz === 'UTC' ? d.getUTCDate() : d.getDate())
  const hh = pad(tz === 'UTC' ? d.getUTCHours() : d.getHours())
  const mi = pad(tz === 'UTC' ? d.getUTCMinutes() : d.getMinutes())
  return `${y}-${mo}-${da}T${hh}:${mi}`
}

function fromInputValue(s: string, tz: 'Asia/Tokyo' | 'UTC'): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  const yy = Number(m[1]);
  const MM = Number(m[2]);
  const dd = Number(m[3]);
  const HH = Number(m[4]);
  const mm = Number(m[5]);
  // 入力の“壁時計”時刻を UTC の瞬間に正規化
  const d = new Date(Date.UTC(yy, MM - 1, dd, HH, mm, 0, 0));
  if (tz === 'Asia/Tokyo') d.setUTCHours(d.getUTCHours() - 9);
  return d;
}

function setBaseNow() {
  const anchor = new Date()
  anchor.setSeconds(0, 0)     // ここが入っていればOK
  baseFrom.value = anchor
  baseInput.value = toInputValue(anchor, tzDisp.value)
  recompute(countClamped.value)
}

// watchers
watch(baseInput, (v) => {
  if (relMode.value !== 'base' || !v) return
  const parsed = fromInputValue(v, tzDisp.value)
  if (parsed) {
    baseFrom.value = parsed
    recompute(countClamped.value)
  }
})
watch(tzDisp, (tz) => {
  if (relMode.value === 'base' && baseFrom.value) {
    baseInput.value = toInputValue(baseFrom.value, tz)
  }
})
// 既存の watchers 群の近くに追加
watch(relMode, (mode) => {
  if (mode === 'base' && !baseInput.value) {
    setBaseNow();            // 入力も結果も即揃う
  }
  if (mode === 'now') {
    // 表示URLの“from”を消したい場合はここで（UI表示はすでに無効化済み）
    // baseInput.value = ''   // ←好みで
  }
});


// プリフィル & タイマー開始
const route = useRoute()
onMounted(() => {
  const rel = route.query?.rel
  if (rel === 'now' || rel === 'base') relMode.value = rel
  // 相対時間の即時更新（任意。ぴたり合わせたい場合）
  now.value = Date.now()
  tick()
  const delay = 30_000 - (Date.now() % 30_000)
  nowTo = setTimeout(() => { tick(); nowIv = setInterval(tick, 30_000) }, delay)
  // 1. tz
  const tz = route.query?.tz
  if (tz === 'UTC' || tz === 'Asia/Tokyo') tzDisp.value = tz
  // 2. from
  const fromQ = route.query?.from
  if (typeof fromQ === 'string') {
    baseInput.value = fromQ
    const parsed = fromInputValue(fromQ, tzDisp.value)
    if (parsed) baseFrom.value = parsed
  }
  if (!baseFrom.value) setBaseNow()
  // 3. expr / n
  const q = route.query?.expr
  if (typeof q === 'string' && q.trim()) input.value = q
  const n = Number(route.query?.n)
  if (Number.isFinite(n) && n >= 1) count.value = Math.min(n, MAX_TOTAL)
  // 4. 計算
  onCheck()
})

onUnmounted(() => {
  if (nowTo) { clearTimeout(nowTo); nowTo = null }
  if (nowIv) { clearInterval(nowIv); nowIv = null }
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
