<template>
  <div class="container mx-auto max-w-5xl py-8 px-4 space-y-6">
    <h1 class="text-2xl font-bold">JWT Decoder</h1>

    <div class="rounded-md bg-blue-50 text-blue-900 text-sm p-3">
      プライバシー保護: すべての処理はお使いのブラウザ内でローカルに実行されます。データがサーバーに送信されることはありません。
    </div>

    <section class="space-y-2">
      <label for="jwt" class="block font-medium">JWT トークン</label>
      <textarea id="jwt" v-model="token" rows="5" class="w-full border rounded p-2 font-mono text-sm"
        spellcheck="false"></textarea>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="onClear">クリア</button>
        <button class="btn-secondary" @click="onSample">サンプル挿入</button>
      </div>
    </section>

    <section class="grid md:grid-cols-2 gap-4">
      <div class="rounded border bg-gray-50 p-3">
        <h2 class="font-semibold mb-2">Header</h2>
        <pre class="text-xs overflow-auto"><code>{{ pretty(header) }}</code></pre>
      </div>
      <div class="rounded border bg-gray-50 p-3">
        <h2 class="font-semibold mb-2">Payload</h2>
        <pre class="text-xs overflow-auto"><code>{{ pretty(payload) }}</code></pre>
      </div>
    </section>

    <section v-if="payload" class="rounded border p-3 space-y-2">
      <h2 class="font-semibold">基本クレーム（読みやすく）</h2>
      <table class="text-sm">
        <tbody>
          <tr v-if="payload.exp">
            <th class="text-left pr-4">exp</th>
            <td>{{ asDate(payload.exp) }}（{{ relFromNow(payload.exp) }}）</td>
          </tr>
          <tr v-if="payload.iat">
            <th class="text-left pr-4">iat</th>
            <td>{{ asDate(payload.iat) }}（{{ relFromNow(payload.iat) }}）</td>
          </tr>
          <tr v-if="payload.nbf">
            <th class="text-left pr-4">nbf</th>
            <td>{{ asDate(payload.nbf) }}（{{ relFromNow(payload.nbf) }}）</td>
          </tr>
          <tr v-if="payload.sub">
            <th class="text-left pr-4">sub</th>
            <td class="font-mono">{{ payload.sub }}</td>
          </tr>
          <tr v-if="payload.iss">
            <th class="text-left pr-4">iss</th>
            <td class="font-mono break-all">{{ payload.iss }}</td>
          </tr>
          <tr v-if="payload.aud">
            <th class="text-left pr-4">aud</th>
            <td class="font-mono break-all">{{ payload.aud }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-xs text-gray-500 mt-1"> 署名検証は未実装です（必要なら後日JWKS対応を追加します）。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const token = ref('')

function onClear() { token.value = '' }
function onSample() {
  token.value =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjE2MjM5MDIyfQ.' +
    'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
}

function b64urlDecode(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  return atob(s + '='.repeat(pad))
}
function parsePart<T = any>(part: string | undefined): T | null {
  if (!part) return null
  try { return JSON.parse(b64urlDecode(part)) as T } catch { return null }
}
const parts = computed(() => token.value.split('.'))
const header = computed(() => parsePart(parts.value[0]))
const payload = computed(() => parsePart(parts.value[1]))

function pretty(v: any) {
  return v ? JSON.stringify(v, null, 2) : '（有効なJWTを入力すると表示されます）'
}
function asDate(sec: number) {
  if (typeof sec !== 'number') return ''
  const d = new Date(sec * 1000)
  const jst = d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false })
  const utc = d.toUTCString().replace(' GMT', '')
  return `${jst} JST / ${utc} UTC`
}
function relFromNow(sec: number) {
  const diff = sec * 1000 - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000), hrs = Math.floor(mins / 60), days = Math.floor(hrs / 24)
  const s = days ? `${days}日` : hrs ? `${hrs}時間` : mins ? `${mins}分` : `${Math.floor(abs / 1000)}秒`
  return diff >= 0 ? `あと ${s}` : `${s} 前`
}
</script>

<style scoped>
.btn-secondary {
  @apply bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition;
}
</style>
