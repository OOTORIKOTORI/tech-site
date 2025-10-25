<template>
  <div class="container mx-auto max-w-3xl py-8 px-4 space-y-6">
    <ToolIntro title="CRON ⇄ JST/UTC 変換" description="CRON式の次回発火時刻を JST/UTC で確認。式の整合性チェックにも。"
      usage="1) CRON式を入力\n2) タイムゾーンを選択\n3) 次回発火を確認" time="~10秒" audience="初心者・開発・運用" :example-input="exampleInput"
      :example-output="exampleOutput">
      <template #extra>
        <p class="text-sm mt-2">
          これは何？どんな時に使う？がまだ不安な方は、
          <NuxtLink to="/blog/cron-basics" class="text-blue-700 underline hover:text-blue-900 focus-ring">
            基礎ガイドを読む
          </NuxtLink>
          からスタートしてください。
        </p>
      </template>
    </ToolIntro>
    <ToolIntroBox audience="サイト運用・開発者（定時バッチの確認）" value="Cron式の次回実行を JST/UTC で確認できます。"
      how="1) 式を入力 → 2) タイムゾーン選択 → 3) 次回N件（5/10/25）を表示"
      safety="<strong>6フィールド（秒）</strong>や <strong>@hourly 等エイリアス</strong>も入力可（自動認識）。" />
    <h1 class="text-2xl font-bold">Cron JST 次回実行予測</h1>
    <AudienceNote who="サイト運用・開発者（定時バッチの確認）" />
    <div class="mt-2 text-sm">
      <NuxtLink to="/blog/cron-basics" class="text-blue-700 underline hover:text-blue-900 focus-ring">
        CRON入門（基礎ガイド）を読む
      </NuxtLink>
    </div>

    <div class="rounded-md bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm p-3" role="status"
      aria-live="polite">
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
      <div class="text-xs text-gray-500 mt-1">
        6フィールド例: <code>0 0 9 * * *</code>
      </div>
      <p class="text-xs text-gray-600 mt-1">
        ※ 秒付き6フィールド（例: <code>0 0 9 * * *</code>）や <code>@hourly</code> 等のエイリアスも入力可（自動認識）。
      </p>

      <!-- IANA TZ 選択（自由入力 + datalist） -->
      <div class="mt-3">
        <label for="tz-input" class="block text-sm font-medium">タイムゾーン（IANA形式）</label>
        <input id="tz-input" v-model="tzInput" list="tz-list" class="w-full max-w-sm border rounded p-2 font-mono"
          aria-describedby="tz-hint" placeholder="例: Asia/Tokyo" />
        <datalist id="tz-list">
          <option value="Asia/Tokyo" />
          <option value="UTC" />
          <option value="America/Los_Angeles" />
          <option value="Europe/London" />
        </datalist>
        <small id="tz-hint" class="text-xs text-gray-500">IANA 形式（例: Asia/Tokyo）。無効な場合は UTC で計算。</small>
      </div>

      <div v-if="humanized" class="rounded bg-gray-50 dark:bg-gray-900 border text-sm p-2" role="status"
        aria-live="polite">
        <div class="font-semibold">説明</div>
        <div class="font-mono">
          <div>Selected TZ: {{ humanized.sel }}</div>
          <div>UTC: {{ humanized.utc }}</div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn-primary focus-ring" aria-label="cron式をチェック">
          今すぐチェック
        </button>
        <button type="button" class="btn-secondary focus-ring" aria-label="入力をクリア" @click="onClear">
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
          <button type="button" class="btn-secondary focus-ring" aria-label="基準時刻を今に設定" :disabled="relMode !== 'base'"
            @click="setBaseNow">
            今
          </button>
        </div>


        <div class="flex items-center gap-2">
          <label for="count" class="text-sm">件数:</label>
          <input id="count" v-model.number="count" type="number" min="1" :max="MAX_TOTAL"
            class="w-20 border rounded p-1" aria-label="表示件数" />
          <div class="inline-flex overflow-hidden rounded-md border" role="tablist" aria-label="件数のクイック切替">
            <button type="button" class="px-2 py-1 text-sm focus-ring" :aria-selected="countClamped === 5" role="tab"
              @click="count = 5">
              5
            </button>
            <button type="button" class="px-2 py-1 text-sm focus-ring border-l" :aria-selected="countClamped === 10"
              role="tab" @click="count = 10">
              10
            </button>
            <button type="button" class="px-2 py-1 text-sm focus-ring border-l" :aria-selected="countClamped === 25"
              role="tab" @click="count = 25">
              25
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1 w-full max-w-xs">
          <div class="flex items-center gap-2">
            <button type="button" class="btn-secondary focus-ring" aria-label="現在の設定で共有リンクをコピー" @click="copyLink">
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

    <div v-if="displayedSel.length || displayedUTC.length" class="space-y-3">
      <h2 class="font-semibold">
        次回実行予定
        <span class="text-xs text-gray-500 ml-2">表示中: {{ Math.max(displayedSel.length, displayedUTC.length) }} / {{
          MAX_TOTAL }} 件</span>
      </h2>

      <p class="text-sm text-gray-600 -mt-1">
        CRON式の基礎は
        <NuxtLink to="/blog/cron-basics" class="text-blue-700 underline hover:text-blue-900 focus-ring">基礎ガイド</NuxtLink>
        で解説しています。
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-semibold mb-1 text-sm">Selected TZ（{{ tzCalc }}）</h3>
          <ul class="list-disc pl-6 space-y-1">
            <li v-for="dt in displayedSel" :key="'sel-' + dt.toISOString()" class="font-mono">
              {{ format(dt, tzCalc) }}
              <span class="text-gray-500 ml-2">（{{ relative(dt) }}）</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-1 text-sm">UTC</h3>
          <ul class="list-disc pl-6 space-y-1">
            <li v-for="dt in displayedUTC" :key="'utc-' + dt.toISOString()" class="font-mono">
              {{ format(dt, 'UTC') }}
              <span class="text-gray-500 ml-2">（{{ relative(dt) }}）</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button v-if="canLoadMore" type="button" class="btn-secondary focus-ring" @click="loadMore">
          もっと表示（+{{ stepForMore }}件）
        </button>
        <span v-else class="text-xs text-gray-500">これ以上は表示できません（最大 {{ MAX_TOTAL }} 件）</span>

        <button type="button" class="btn-primary focus-ring" aria-label="CSVでダウンロード"
          :disabled="!displayedSel.length && !displayedUTC.length" @click="downloadCsv">
          CSV でダウンロード
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { useHead } from '#imports'
import AudienceNote from '@/components/AudienceNote.vue'

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from '#imports'
import { parseCron, nextRuns, humanizeCron } from '~/utils/cron'

// ToolIntro 用 例示
const exampleInput = '*/5 * * * *'
const exampleOutput = '次回発火: 2025-10-18 09:00 JST / 00:00 UTC ...'

useHead({
  title: 'CRON ⇄ JST/UTC 変換 | Migaki Explorer',
  meta: [
    { name: 'description', content: 'CRON式の次回発火時刻を JST/UTC で確認。式の整合性チェックにも。' },
    { property: 'og:title', content: 'CRON ⇄ JST/UTC 変換 | Migaki Explorer' },
    { property: 'og:description', content: 'CRON式の次回発火時刻を JST/UTC で確認。式の整合性チェックにも。' }
  ]
})

const input = ref('')
const error = ref('')
const resultsSel = ref<Date[]>([])
const resultsUTC = ref<Date[]>([])
const humanized = ref<{ sel: string; utc: string } | null>(null)

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
    resultsSel.value = []
    resultsUTC.value = []
    updateHumanize()
    onCheck()
  }
}
const tzDisp = ref<'Asia/Tokyo' | 'UTC'>('Asia/Tokyo')
// 計算に使う IANA TZ（自由入力）
const tzInput = ref<string>('Asia/Tokyo')
function isValidTimeZone(tz?: string): tz is string {
  if (!tz) return false
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(); return true } catch { return false }
}
const tzCalc = computed<string>(() => (isValidTimeZone(tzInput.value) ? tzInput.value : 'UTC'))
const count = ref(5)
const copied = ref(false)
let copyTo: ReturnType<typeof setTimeout> | null = null
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

// 画面表示用
const displayedSel = computed(() => resultsSel.value.slice(0, countClamped.value))
const displayedUTC = computed(() => resultsUTC.value.slice(0, countClamped.value))

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
  resultsSel.value = nextRuns(lastSpec.value, baseFrom.value, tzCalc.value, n)
  resultsUTC.value = nextRuns(lastSpec.value, baseFrom.value, 'UTC', n)
}

function onCheck() {
  error.value = ''
  resultsSel.value = []
  resultsUTC.value = []
  try {
    const spec = parseCron(input.value.trim())
    lastSpec.value = spec
    updateHumanize(spec)

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
    humanized.value = null
  }
}

function onClear() {
  input.value = ''
  error.value = ''
  resultsSel.value = []
  resultsUTC.value = []
  lastSpec.value = null
  baseFrom.value = null
  baseInput.value = ''
  humanized.value = null
}



function format(dt: Date, tz: string) {
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
  url.searchParams.set('calcTz', tzInput.value)
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
    if (copyTo) { clearTimeout(copyTo); copyTo = null }
    copyTo = setTimeout(() => { copied.value = false; copyTo = null }, 1200)
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
  const len = Math.max(displayedSel.value.length, displayedUTC.value.length)
  const rows = Array.from({ length: len }).map((_v, i) => {
    const dtSel = displayedSel.value[i]
    const dtUtc = displayedUTC.value[i]
    return [
      i + 1,
      dtSel ? dtSel.toISOString() : '',
      dtSel ? format(dtSel, tzCalc.value) : '',
      dtUtc ? dtUtc.toISOString() : '',
      dtUtc ? format(dtUtc, 'UTC') : '',
    ]
  })
  const header = ['#', 'ISO (Selected)', `Selected (${tzCalc.value})`, 'ISO (UTC)', 'UTC']
  const csv = [header, ...rows].map(r => r.map((v: unknown) =>
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
function updateHumanize(specArg?: ReturnType<typeof parseCron> | null) {
  try {
    const spec = specArg ?? parseCron(input.value.trim())
    const textSel = humanizeCron(spec, { tz: tzCalc.value })
    const textUtc = humanizeCron(spec, { tz: 'UTC' })
    humanized.value = { sel: textSel, utc: textUtc }
  } catch {
    humanized.value = null
  }
}

watch(input, () => {
  updateHumanize()
})

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
// 計算TZが変わったら再計算
watch(tzInput, () => {
  recompute(countClamped.value)
  updateHumanize()
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
  const calcTz = route.query?.calcTz
  if (typeof calcTz === 'string' && calcTz.trim()) tzInput.value = calcTz
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
      updateHumanize()
    } catch {
      input.value = ''
      humanized.value = null
    }
  } else {
    input.value = ''
    humanized.value = null
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
    tzInput.value = 'Asia/Tokyo'
    relMode.value = 'now'
    setBaseNow()
    updateHumanize()
    onCheck()
  }
})

onUnmounted(() => {
  if (nowTo) { clearTimeout(nowTo); nowTo = null }
  if (nowIv) { clearInterval(nowIv); nowIv = null }
  if (copyTo) { clearTimeout(copyTo); copyTo = null }
})
</script>

<style scoped>
.btn-primary {
  background-color: rgb(29 78 216);
  color: #fff;
  padding: 0.25rem 1rem;
  border-radius: 0.25rem;
}

.btn-primary:hover {
  background-color: rgb(30 64 175);
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, .5);
}

.btn-secondary {
  background-color: rgb(229 231 235);
  color: rgb(17 24 39);
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
}

.btn-secondary:hover {
  background-color: rgb(209 213 219);
}

.btn-secondary:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(147, 197, 253, .5);
}
</style>
