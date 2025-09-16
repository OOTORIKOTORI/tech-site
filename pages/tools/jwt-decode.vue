<template>
  <div class="container mx-auto max-w-6xl py-8 px-4 space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-bold flex items-center gap-3">JWT ツール
        <span v-if="verifyState.valid === true"
          class="inline-flex items-center text-xs font-semibold rounded bg-green-100 text-green-800 px-2 py-1">検証成功</span>
        <span v-else-if="verifyState.valid === false"
          class="inline-flex items-center text-xs font-semibold rounded bg-red-100 text-red-800 px-2 py-1">検証失敗</span>
      </h1>
      <p class="text-sm text-gray-600">ローカルのみで動作。トークン本文は送信されません。JWKS は明示許可時のみ取得。</p>
    </header>

    <div class="rounded-md bg-blue-50 text-blue-900 text-xs md:text-sm p-3 leading-relaxed">
      <p class="font-medium mb-1">プライバシーと安全な使い方</p>
      <ul class="list-disc ml-5 space-y-1">
        <li>貼り付けた JWT はブラウザ内のみで解析・任意検証されます。</li>
        <li>JWKS を有効化しない限り外部通信は発生しません。</li>
        <li>本番環境のシークレットや長期有効トークンは極力貼らないでください。</li>
        <li>ドラッグ&ドロップした鍵ファイルもアップロードはされません。</li>
      </ul>
    </div>

    <!-- Tabs -->
    <nav class="flex gap-2 border-b text-sm">
      <button v-for="t in tabs" :key="t" @click="activeTab = t"
        :class="['px-4 py-2 -mb-px border-b-2', activeTab === t ? 'border-blue-600 text-blue-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700']">{{
          t }}</button>
    </nav>

    <!-- Common Input -->
    <section class="space-y-2">
      <label for="jwt" class="block font-medium">JWT トークン</label>
      <textarea id="jwt" v-model="token" rows="5" class="w-full border rounded p-2 font-mono text-xs md:text-sm"
        spellcheck="false" @dragover.prevent @drop.prevent="onDropToken"></textarea>
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" @click="onClear">クリア</button>
        <button class="btn-secondary" @click="onSample">サンプル挿入</button>
        <button class="btn-secondary" @click="copyToken" :disabled="!token">コピー</button>
      </div>
    </section>

    <!-- Decode Panel -->
    <section v-show="activeTab === 'Decode'" class="space-y-6">
      <div class="grid md:grid-cols-2 gap-4">
        <div class="rounded border bg-gray-50">
          <header class="flex items-center justify-between px-3 py-2 border-b">
            <h2 class="font-semibold text-sm">Header</h2>
            <button class="text-xs text-blue-600 hover:underline" @click="collapsed.header = !collapsed.header">{{
              collapsed.header ? '展開' : '折りたたみ' }}</button>
          </header>
          <pre v-show="!collapsed.header"
            class="text-[11px] md:text-xs p-3 overflow-auto"><code>{{ pretty(header) }}</code></pre>
        </div>
        <div class="rounded border bg-gray-50">
          <header class="flex items-center justify-between px-3 py-2 border-b">
            <h2 class="font-semibold text-sm">Payload</h2>
            <button class="text-xs text-blue-600 hover:underline" @click="collapsed.payload = !collapsed.payload">{{
              collapsed.payload ? '展開' : '折りたたみ' }}</button>
          </header>
          <pre v-show="!collapsed.payload"
            class="text-[11px] md:text-xs p-3 overflow-auto"><code>{{ pretty(payload) }}</code></pre>
        </div>
      </div>

      <section v-if="payload" class="rounded border p-3 space-y-3">
        <h2 class="font-semibold text-sm">Claims</h2>
        <table class="text-xs md:text-sm">
          <tbody>
            <tr v-for="c in visibleClaims" :key="c.key">
              <th class="text-left pr-4 align-top">{{ c.key }}</th>
              <td class="font-mono break-all">{{ formatClaim(c.key, c.value) }}</td>
              <td v-if="c.key === 'exp'" class="text-xs text-gray-500 pl-2">{{ relativeExp(c.value as number) }}</td>
              <td v-else-if="c.key === 'nbf'" class="text-xs text-gray-500 pl-2">{{ relativeGeneric(c.value as number)
                }}</td>
              <td v-else-if="c.key === 'iat'" class="text-xs text-gray-500 pl-2">{{ relativeGeneric(c.value as number)
                }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>

    <!-- Verify Panel -->
    <section v-show="activeTab === 'Verify'" class="space-y-6">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block font-medium text-sm mb-1">期待アルゴリズム</label>
            <select v-model="verifyInput.expectedAlg" class="border rounded px-2 py-1 text-sm">
              <option value="">(指定しない)</option>
              <option value="HS256">HS256</option>
              <option value="RS256">RS256</option>
              <option value="ES256">ES256</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-sm mb-1">鍵 / シークレット (ペースト or D&D)</label>
            <textarea v-model="verifyInput.key" rows="4"
              class="w-full border rounded p-2 font-mono text-[11px] md:text-xs"
              placeholder="HS256: 共有シークレット\nRS/ES: -----BEGIN PUBLIC KEY----- ..." @dragover.prevent
              @drop.prevent="onDropKey"></textarea>
            <p class="text-[11px] text-gray-500 mt-1 leading-snug">
              PEM 公開鍵 / 秘密鍵 / 証明書 いずれか可 (検証では公開鍵部分のみ使用)。HS256 の場合はシークレット文字列。<br>
              コンテンツは送信されずローカル処理のみ。<br>
              証明書チェーン複合やJWEは未対応。
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label class="block font-medium text-sm mb-1">leeway秒 (exp/nbf/iat)</label>
              <input type="number" v-model.number="verifyInput.leewaySec"
                class="w-full border rounded px-2 py-1 text-sm" min="0" />
            </div>
            <div>
              <label class="block font-medium text-sm mb-1">現在時刻(秒, override)</label>
              <input type="number" v-model.number="verifyInput.nowOverride"
                class="w-full border rounded px-2 py-1 text-sm" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="jwks.use" />
              <span>JWKS を取得して kid に対応する鍵で検証 (任意)</span>
            </label>
            <input :disabled="!jwks.use" v-model="jwks.url" placeholder="https://issuer.example/.well-known/jwks.json"
              class="w-full border rounded px-2 py-1 text-xs" />
            <div class="flex gap-2">
              <button class="btn-secondary" :disabled="!jwks.use || jwks.loading"
                @click="fetchJwksKeys(false)">取得</button>
              <button class="btn-secondary" :disabled="!jwks.use || jwks.loading"
                @click="fetchJwksKeys(true)">再取得</button>
              <span v-if="jwks.loading" class="text-xs text-gray-500 self-center">取得中...</span>
              <span v-else-if="jwks.error" class="text-xs text-red-600">{{ jwks.error }}</span>
              <span v-else-if="jwks.keys.length" class="text-xs text-green-700">{{ jwks.keys.length }}鍵</span>
            </div>
            <p class="text-[11px] text-gray-500">送信されるのは JWKS 取得 HTTP リクエストのみ。トークン本文は送信しません。</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="btn-primary" @click="doVerify">検証</button>
            <button class="btn-secondary" @click="resetVerify">結果クリア</button>
            <button class="btn-secondary" @click="injectDemo">デモJWT</button>
          </div>
        </div>
        <div class="space-y-4">
          <div class="rounded border p-3 bg-white min-h-[140px]">
            <h3 class="font-semibold text-sm mb-2">結果</h3>
            <div v-if="verifyState.errors.length" class="space-y-1">
              <div v-for="e in verifyState.errors" :key="e.code" class="text-xs flex gap-2">
                <span class="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">{{ e.code }}</span>
                <span class="text-gray-800">{{ e.message }}<span v-if="e.hint" class="text-gray-500"> ({{ e.hint
                }})</span></span>
              </div>
            </div>
            <div v-else-if="verifyState.valid === true" class="text-green-700 text-sm">署名/クレーム OK</div>
            <div v-else class="text-xs text-gray-500">検証結果はここに表示されます</div>
          </div>
          <div v-if="verifyState.header" class="rounded border p-3 bg-gray-50">
            <h3 class="font-semibold text-sm mb-1">検証後 Header</h3>
            <pre class="text-[11px] md:text-xs overflow-auto"><code>{{ pretty(verifyState.header) }}</code></pre>
          </div>
          <div v-if="verifyState.payload" class="rounded border p-3 bg-gray-50">
            <h3 class="font-semibold text-sm mb-1">検証後 Payload</h3>
            <pre class="text-[11px] md:text-xs overflow-auto"><code>{{ pretty(verifyState.payload) }}</code></pre>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { decodeBase64Url, verifyJwt, fetchJwks, findJwksRsaKeyByKid, buildRsaPemFromModExp } from '@/utils/jwt'

// --- Types ---
type JwtHeader = {
  alg: string
  kid?: string
  typ?: string
  [k: string]: unknown
}

type JwtPayload = {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  [k: string]: unknown
}

const tabs = ['Decode', 'Verify'] as const
const activeTab = ref<(typeof tabs)[number]>('Decode')
const token = ref('')
const collapsed = reactive({ header: false, payload: false })

function onClear() { token.value = '' }
function copyToken() { if (!token.value) return; navigator.clipboard?.writeText(token.value) }
function onSample() { token.value = SAMPLE_JWT }
function onDropToken(e: DragEvent) { const t = e.dataTransfer?.getData('text/plain'); if (t) token.value = t.trim() }

// --- Decode logic ---
function parseJsonPart<T>(part?: string): T | null { if (!part) return null; try { return JSON.parse(new TextDecoder().decode(decodeBase64Url(part))) as T } catch { return null } }
const parts = computed(() => token.value.split('.'))
const header = computed<JwtHeader | null>(() => parseJsonPart<JwtHeader>(parts.value[0]))
const payload = computed<JwtPayload | null>(() => parseJsonPart<JwtPayload>(parts.value[1]))
function pretty(v: unknown) { return v ? JSON.stringify(v, null, 2) : '（有効なJWTを入力すると表示されます）' }

interface ClaimRow { key: string; value: unknown }
const baseClaims = computed<ClaimRow[]>(() => {
  const p = payload.value || {}
  return ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat'].map(k => ({ key: k, value: (p as any)[k] }))
})
const visibleClaims = computed(() => baseClaims.value.filter(c => c.value !== undefined))
function formatClaim(key: string, val: unknown) { if (['exp', 'nbf', 'iat'].includes(key) && typeof val === 'number') { return `${val} (${new Date(val * 1000).toISOString()})` } return typeof val === 'string' ? val : JSON.stringify(val) }
function relativeGeneric(sec: number) { const diff = sec * 1000 - Date.now(); return diff >= 0 ? `あと${fmtDuration(diff)}` : `${fmtDuration(-diff)}前` }
function relativeExp(sec: number) { const diff = sec * 1000 - Date.now(); return diff >= 0 ? `有効:あと${fmtDuration(diff)}` : `期限切れ:${fmtDuration(-diff)}経過` }
function fmtDuration(ms: number) { const s = Math.floor(ms / 1000); if (s < 60) return s + '秒'; const m = Math.floor(s / 60); if (m < 60) return m + '分'; const h = Math.floor(m / 60); if (h < 24) return h + '時間'; const d = Math.floor(h / 24); return d + '日' }

// --- Verify logic ---
interface VerifyInput { expectedAlg: string | ''; key: string; leewaySec: number; nowOverride?: number }
interface VerifyError { code: string; message: string; hint?: string }
interface VerifyState { valid: undefined | boolean; header: JwtHeader | null; payload: JwtPayload | null; errors: VerifyError[] }
const verifyInput = reactive<VerifyInput>({ expectedAlg: '', key: '', leewaySec: 60 })
const verifyState = reactive<VerifyState>({ valid: undefined, header: null, payload: null, errors: [] })
function resetVerify() { verifyState.valid = undefined; verifyState.header = null; verifyState.payload = null; verifyState.errors = [] }
function onDropKey(e: DragEvent) { const t = e.dataTransfer?.getData('text/plain'); if (t) verifyInput.key = t.trim() }

// JWKS
const jwks = reactive({ use: false, url: '', keys: [] as any[], loading: false, error: '' })
async function fetchJwksKeys(force: boolean) { if (!jwks.url) { jwks.error = 'URL無し'; return } jwks.loading = true; jwks.error = ''; try { const data = await fetchJwks(jwks.url, { forceRefresh: force }); jwks.keys = data.keys } catch (e: any) { jwks.error = e.message || '取得失敗' } finally { jwks.loading = false } }

async function doVerify() {
  resetVerify(); if (!token.value) { return }
  try {
    let useKey = verifyInput.key
    // header取得(kid利用)
    const rawHeader = header.value
    if (jwks.use && jwks.keys.length && rawHeader?.kid) {
      const k = findJwksRsaKeyByKid({ keys: jwks.keys }, rawHeader.kid, 'RS256')
      if (k) { const pem = buildRsaPemFromModExp(k.n, k.e); if (pem) useKey = pem }
    }
    const res = await verifyJwt(token.value, {
      expectedAlg: verifyInput.expectedAlg as any || undefined,
      key: useKey || undefined,
      currentTimeSec: verifyInput.nowOverride || undefined,
      leewaySec: verifyInput.leewaySec
    })
    Object.assign(verifyState, res)
  } catch (e: any) { verifyState.errors.push({ code: 'UI_EXCEPTION', message: 'UI処理中例外', hint: e.message }) }
}

function injectDemo() { token.value = SAMPLE_JWT }

// Demo JWT (公開サンプル: 署名済みHS256 ダミー)
const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJkZW1vLWlzc3VlciIsInN1YiI6InVzZXIxIiwiYXVkIjoiYXBwMSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.' +
  'YVJ9IVd1cfplYfJm3gXpzAtgPn9gR2CQJE0XAgyyLF0'

watch(() => token.value, () => { if (activeTab.value === 'Verify') resetVerify() })
</script>

<style scoped>
.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  transition: background .15s;
  font-size: 0.75rem;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  transition: background .15s;
  font-size: 0.75rem;
}

.btn-primary:hover {
  background: #1d4ed8;
}
</style>
