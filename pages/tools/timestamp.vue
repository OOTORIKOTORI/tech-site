<script setup lang="ts">
import { ref, computed } from 'vue'
import RelatedList from '@/components/RelatedList.vue'
import { useHead } from '#imports'
import { detectUnitByLength, epochToDate, dateToEpoch, formatInTZ, parseDateTimeLocal, toDateTimeLocalValue, type Tz, type Unit } from '~/utils/timestamp'

useHead({
  title: 'Epoch Timestamp Converter | Migaki Explorer',
  meta: [
    { name: 'description', content: 'Epoch ⇄ 日時（JST/UTC）の双方向変換ツール。秒/ミリ秒の自動判定にも対応。' },
    { property: 'og:title', content: 'Epoch Timestamp Converter | Migaki Explorer' },
    { property: 'og:description', content: 'Epoch ⇄ 日時（JST/UTC）の双方向変換ツール。' }
  ]
})

// UI 状態
const unitMode = ref<Unit>('auto') // auto | s | ms

// Epoch -> Date
const epochInput = ref('')
const epochDetected = computed(() => unitMode.value === 'auto' ? detectUnitByLength(epochInput.value || '') : unitMode.value)
const epochResult = computed(() => {
  if (!epochInput.value.trim()) return { date: null as Date | null, error: '' }
  const d = epochToDate(epochInput.value, unitMode.value)
  if (!d || Number.isNaN(d.getTime())) {
    return { date: null as Date | null, error: '無効な数値です' }
  }
  return { date: d, error: '' }
})

// Date -> Epoch
const dateInputMode = ref<Tz>('Asia/Tokyo')
const dateLocal = ref('') // datetime-local value
const dateResult = computed(() => {
  if (!dateLocal.value) return { date: null as Date | null, error: '' }
  const d = parseDateTimeLocal(dateLocal.value, dateInputMode.value)
  if (!d || Number.isNaN(d.getTime())) {
    return { date: null as Date | null, error: '日時の形式が不正です (YYYY-MM-DDTHH:mm)' }
  }
  return { date: d, error: '' }
})
const dateEpochSec = computed(() => dateResult.value.date ? dateToEpoch(dateResult.value.date, 's') : '')
const dateEpochMs = computed(() => dateResult.value.date ? dateToEpoch(dateResult.value.date, 'ms') : '')

function setNow() {
  const now = new Date()
  now.setSeconds(0, 0)
  dateLocal.value = toDateTimeLocalValue(now, dateInputMode.value)
}

// ToolIntro 用例
const exampleInput = '1700000000 (秒) / 1700000000000 (ミリ秒)'
const exampleOutput = 'JST: 2023/11/14 22:13:20, UTC: 2023/11/14 13:13:20 (例)'
</script>

<template>
  <main class="mx-auto max-w-6xl p-4 space-y-6">
    <ToolIntro title="Epoch Timestamp Converter" description="Epoch ⇄ 日時（JST/UTC）の双方向変換。秒/ミリ秒は自動判定または手動指定。"
      usage="1) Epoch値を入力して日時を確認、または 2) 日時を入力してEpochを取得" time="~10秒" audience="開発・運用" :example-input="exampleInput"
      :example-output="exampleOutput" />
    <ToolIntroBox how="Epochか日時を入力 → タイムゾーンを選択 → 即時変換" safety="処理はブラウザ内のみ（送信なし）" />

    <p class="text-sm">
      入門記事: <NuxtLink class="link" to="/blog/timestamp-basics">/blog/timestamp-basics</NuxtLink>
    </p>

    <section aria-labelledby="epoch2date" class="surface p-4 space-y-3">
      <h2 id="epoch2date" class="text-lg font-semibold">Epoch → 日時</h2>
      <div class="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
        <div>
          <label for="epoch" class="block text-sm font-medium">Epoch</label>
          <input id="epoch" v-model="epochInput" type="text" inputmode="numeric"
            placeholder="1700000000 / 1700000000000" class="mt-1 w-full rounded border px-2 py-1 font-mono"
            aria-describedby="epoch-help" />
          <p id="epoch-help" class="text-xs muted mt-1">10桁=秒 / 13桁=ミリ秒（自動判定）。単位の固定も可。</p>
        </div>
        <div>
          <label class="block text-sm font-medium">単位</label>
          <div class="mt-1 flex items-center gap-3 text-sm">
            <label class="inline-flex items-center gap-1"><input v-model="unitMode" type="radio" value="auto" />
              Auto</label>
            <label class="inline-flex items-center gap-1"><input v-model="unitMode" type="radio" value="s" /> 秒</label>
            <label class="inline-flex items-center gap-1"><input v-model="unitMode" type="radio" value="ms" />
              ミリ秒</label>
          </div>
          <div class="text-xs text-gray-500">現在: {{ epochInput ? epochDetected.toUpperCase() : '-' }}</div>
        </div>
      </div>
      <div class="rounded border p-3 bg-gray-50 dark:bg-zinc-900">
        <template v-if="epochResult.date">
          <div class="font-mono">JST: {{ formatInTZ(epochResult.date, 'Asia/Tokyo') }}</div>
          <div class="font-mono">UTC: {{ formatInTZ(epochResult.date, 'UTC') }}</div>
        </template>
        <p v-else class="text-sm text-gray-500">結果がここに表示されます。</p>
      </div>
      <p v-if="epochResult.error" class="text-sm text-red-600" aria-live="assertive">{{ epochResult.error }}</p>
    </section>

    <section aria-labelledby="date2epoch" class="surface p-4 space-y-3">
      <h2 id="date2epoch" class="text-lg font-semibold">日時 → Epoch</h2>
      <div class="grid gap-3 sm:grid-cols-[auto_1fr_auto] items-end">
        <div>
          <label class="block text-sm font-medium">入力TZ</label>
          <div class="mt-1 flex items-center gap-3 text-sm">
            <label class="inline-flex items-center gap-1">
              <input v-model="dateInputMode" type="radio" value="Asia/Tokyo"
                @change="() => (dateLocal = dateLocal && dateResult.date ? toDateTimeLocalValue(dateResult.date, 'Asia/Tokyo') : dateLocal)" />
              JST
            </label>
            <label class="inline-flex items-center gap-1">
              <input v-model="dateInputMode" type="radio" value="UTC"
                @change="() => (dateLocal = dateLocal && dateResult.date ? toDateTimeLocalValue(dateResult.date, 'UTC') : dateLocal)" />
              UTC
            </label>
          </div>
        </div>
        <div>
          <label for="dt" class="block text-sm font-medium">日時</label>
          <input id="dt" v-model="dateLocal" type="datetime-local" step="60"
            class="mt-1 w-full rounded border px-2 py-1" placeholder="YYYY-MM-DDTHH:mm" />
          <div class="mt-2 flex gap-2">
            <button type="button" class="rounded border px-3 py-1 text-sm" @click="setNow">今</button>
            <button type="button" class="rounded border px-3 py-1 text-sm" @click="dateLocal = ''">クリア</button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium">参考表示</label>
          <div class="rounded border p-2 bg-gray-50 dark:bg-zinc-900 min-w-[16rem]">
            <template v-if="dateResult.date">
              <div class="text-xs font-mono">JST: {{ formatInTZ(dateResult.date, 'Asia/Tokyo') }}</div>
              <div class="text-xs font-mono">UTC: {{ formatInTZ(dateResult.date, 'UTC') }}</div>
            </template>
            <p v-else class="text-xs text-gray-500">日時を入力すると表示</p>
          </div>
        </div>
      </div>
      <div class="rounded border p-3 bg-white dark:bg-zinc-950">
        <div class="text-sm">Epoch (秒): <span class="font-mono">{{ dateEpochSec }}</span></div>
        <div class="text-sm">Epoch (ミリ秒): <span class="font-mono">{{ dateEpochMs }}</span></div>
      </div>
      <p v-if="dateResult.error" class="text-sm text-red-600" aria-live="assertive">{{ dateResult.error }}</p>
    </section>

    <RelatedList :tags="['tool:timestamp', 'epoch', 'timestamp', 'date', 'timezone', 'utc', 'jst', 'tools']" />
  </main>
</template>

<style scoped>
/* Tailwindの@applyは未使用。テンプレート内のユーティリティクラスを直接利用。*/
</style>
