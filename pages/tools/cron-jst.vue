<template>
  <div class="container mx-auto max-w-3xl py-8 px-4 space-y-6">
    <h1 class="text-2xl font-bold">Cron JST 次回実行予測</h1>
    <div class="mt-2 text-sm">
      <NuxtLink to="/blog" class="text-blue-700 underline hover:text-blue-900">Tech Blogはこちら</NuxtLink>
    </div>

    <div class="rounded-md bg-blue-50 text-blue-900 text-sm p-3" role="status" aria-live="polite">
      入力はローカルでのみ処理されます。サーバーへ送信されることはありません。
    </div>

    <form class="space-y-3" @submit.prevent="onCheck">
      <label for="cron" class="block font-medium">crontab 形式（分 時 日 月 曜日）</label>
      <textarea id="cron" v-model="input" rows="2" class="w-full border rounded p-2 font-mono text-base"
        :aria-invalid="!!error" aria-describedby="cron-help share-link-desc" spellcheck="false" autocomplete="off"
        aria-label="crontab形式の入力欄。例: */5 9-18 * * 1-5（平日9-18時に5分毎） 曜日は0-6（0=Sun）、7は非対応。"></textarea>
      <div id="cron-help" class="text-xs text-gray-500">
        例: <code>*/5 9-18 * * 1-5</code>（平日9-18時に5分毎） / 曜日は 0-6（0=Sun）。7 は非対応。
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn-primary" aria-label="cron式をチェック">
          今すぐチェック
        </button>
        <button type="button" class="btn-secondary" aria-label="入力をクリア" @click="onClear">
          クリア
        </button>

        <div class="flex items-center gap-2">
          <label for="preset" class="text-sm">プリセット:</label>
          <select id="preset" class="border rounded p-1 text-sm font-mono" @change="onPreset($event)">
            <option value="">選択してください</option>
            <option v-for="p in presets" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <label class="text-sm">表示タイムゾーン:</label>
          <label class="text-sm inline-flex items-center gap-1">
            <input v-model="tzDisp" type="radio" value="Asia/Tokyo" aria-label="JST（日本標準時）" /> JST
          </label>
          <label class="text-sm inline-flex items-center gap-1">
            <input v-model="tzDisp" type="radio" value="UTC" aria-label="UTC（協定世界時）" /> UTC
          </label>
          <div class="flex items-center gap-2">
            <span class="text-sm">相対基準:</span>
            <label class="text-sm inline-flex items-center gap-1">
              <input v-model="relMode" type="radio" value="now" aria-label="今（現在時刻を基準）" /> 今
            </label>
            <label class="text-sm inline-flex items-center gap-1">
              <input v-model="relMode" type="radio" value="base" aria-label="基準時刻を指定" /> 基準時刻
            </label>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <label for="baseAt" class="text-sm">基準時刻:</label>
          <input id="baseAt" v-model="baseInput" type="datetime-local" step="60" :disabled="relMode !== 'base'"
            class="border rounded p-1" aria-label="基準時刻（datetime-local）" />
          <button type="button" class="btn-secondary" aria-label="基準時刻を今に設定" :disabled="relMode !== 'base'"
            @click="setBaseNow">
            今
          </button>
        </div>


        <div class="flex items-center gap-2">
          <label for="count" class="text-sm">件数:</label>
          <input id="count" v-model.number="count" type="number" min="1" :max="MAX_TOTAL"
            class="w-20 border rounded p-1" aria-label="表示件数" />
        </div>

        <div class="flex flex-col gap-1 w-full max-w-xs">
          <div class="flex items-center gap-2">
            <button type="button" class="btn-secondary" aria-label="現在の設定で共有リンクをコピー" @click="copyLink">
              共有リンクをコピー
            </button>
            <span v-if="copied" class="text-xs text-green-700" aria-live="polite">コピーしました</span>
          </div>
          <div id="share-link-desc" class="text-xs text-gray-500">
            現在のcron式・件数・タイムゾーン・基準時刻をURLに反映した共有リンクを生成します。<br>
            受け取った人は同じ条件で即座に次回実行予測ができます。<br>
            <span class="font-mono">expr=</span>や<span class="font-mono">tz=</span>などのクエリパラメータで状態を再現します。
          </div>
        </div>
      </div>

      <div v-if="error" class="text-red-600 font-semibold" role="alert" aria-live="assertive">{{ error }}</div>
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
        <button v-if="canLoadMore" type="button" class="btn-secondary" @click="loadMore">
          もっと表示（+{{ stepForMore }}件）
        </button>
        <span v-else class="text-xs text-gray-500">これ以上は表示できません（最大 {{ MAX_TOTAL }} 件）</span>

        <button type="button" class="btn-primary" aria-label="CSVでダウンロード" :disabled="!displayed.length"
          @click="downloadCsv">
          CSV でダウンロード
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

const SITE_URL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://tech-site-docs.com').replace(/\/$/, '')

useHead({
  title: 'Cron JST 次回実行予測 | Tech Site',
  meta: [
    { name: 'description', content: 'crontab形式のスケジュールから日本時間・UTCで次回実行時刻を予測。共有リンク・プリセット・CSVダウンロード対応。全処理ローカル。' },
    { property: 'og:title', content: 'Cron JST 次回実行予測 | Tech Site' },
    { property: 'og:description', content: 'crontab形式のスケジュールから日本時間・UTCで次回実行時刻を予測。共有リンク・プリセット・CSVダウンロード対応。全処理ローカル。' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: SITE_URL + '/tools/cron-jst' },
    { property: 'og:image', content: SITE_URL + '/favicon.ico' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: 'Cron JST 次回実行予測 | Tech Site' },
    { name: 'twitter:description', content: 'crontab形式のスケジュールから日本時間・UTCで次回実行時刻を予測。共有リンク・プリセット・CSVダウンロード対応。全処理ローカル。' }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Cron JST 次回実行予測',
        url: SITE_URL + '/tools/cron-jst',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        description: 'crontab形式のスケジュールから日本時間・UTCで次回実行時刻を予測。共有リンク・プリセット・CSVダウンロード対応。全処理ローカル。',
        image: SITE_URL + '/favicon.ico'
      })
    }
  ]
})
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from '#imports'
import { parseCron, nextRuns } from '~/utils/cron'

const input = ref('')
const error = ref('')
const results = ref<Date[]>([])

// プリセット定義
const presets = [
  { label: '平日9-18時に5分毎 (*/5 9-18 * * 1-5)', value: '*/5 9-18 * * 1-5' },
  { label: '毎日0時 (0 0 * * *)', value: '0 0 * * *' },
  { label: '毎時0分 (0 * * * *)', value: '0 * * * *' },
  { label: '毎月1日0時 (0 0 1 * *)', value: '0 0 1 * *' },
  { label: '毎週日曜12時 (0 12 * * 0)', value: '0 12 * * 0' },
  { label: '毎週月曜9時 (0 9 * * 1)', value: '0 9 * * 1' },
  { label: '毎分 (毎時毎分) (* * * * *)', value: '* * * * *' },
]

function onPreset(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val) {
    input.value = val
    error.value = ''
    results.value = []
    onCheck()
  }
}
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
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '不明なエラーが発生しました'
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
  // encode cron式: +/スペースを%20に
  url.searchParams.set('expr', encodeURIComponent(input.value.trim()).replace(/%20/g, '+'))
  url.searchParams.set('n', String(countClamped.value))
  url.searchParams.set('tz', tzDisp.value)
  url.searchParams.set('rel', relMode.value)
  if (relMode.value === 'base' && baseInput.value) {
    url.searchParams.set('from', baseInput.value)
  } else {
    url.searchParams.delete('from')
  }
  const shareUrl = url.toString()
  // クリップボードAPIが使えない場合はtextarea fallback
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {
    copied.value = false
    alert('クリップボードへのコピーに失敗しました')
  }
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



const route = useRoute()
onMounted(() => {
  // クライアントのみ
  if (typeof window === 'undefined') return
  const rel = route.query?.rel
  if (rel === 'now' || rel === 'base') relMode.value = rel
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
  let q = route.query?.expr
  if (typeof q === 'string' && q.trim()) {
    // decode: +→スペース, decodeURIComponent
    try {
      q = decodeURIComponent(q.replace(/\+/g, ' '))
      input.value = q
    } catch {
      input.value = ''
    }
  } else {
    input.value = ''
  }
  const n = Number(route.query?.n)
  if (Number.isFinite(n) && n >= 1) count.value = Math.min(n, MAX_TOTAL)
  // 4. 計算（無効クエリはデフォルト）
  try {
    onCheck()
  } catch {
    input.value = ''
    count.value = 5
    tzDisp.value = 'Asia/Tokyo'
    relMode.value = 'now'
    setBaseNow()
    onCheck()
  }
})

onUnmounted(() => {
  if (nowTo) { clearTimeout(nowTo); nowTo = null }
  if (nowIv) { clearInterval(nowIv); nowIv = null }
})
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-700 text-white px-4 py-1 rounded hover:bg-blue-800 transition outline-none focus:ring-2 focus:ring-blue-400;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900 px-3 py-1 rounded hover:bg-gray-300 transition outline-none focus:ring-2 focus:ring-blue-300;
}
</style>
