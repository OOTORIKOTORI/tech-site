<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useHead } from '#imports'
import AudienceNote from '@/components/AudienceNote.vue'
import { analyzeSite, type SiteMetaAnalysis } from '@/utils/site-check'
const config = useRuntimeConfig()
const siteOrigin = config.public.siteOrigin
const presets = [
  siteOrigin + '/blog/welcome',
  siteOrigin + '/api/og/hello.png',
]
const url = ref(presets[0])
const max = ref(5)
const checking = ref(false)
const result = ref<any | null>(null)
const err = ref<string | null>(null)
const imgStatus = ref<'none' | 'ok' | 'fail' | 'checking'>('none')
const imgResp = ref<any | null>(null)
const analysis = ref<SiteMetaAnalysis | null>(null)
const imgSize = ref<{ width: number; height: number } | null>(null)
const imgWarnings = ref<string[]>([])

const requiredChecks = computed(() => {
  const a = analysis.value
  if (!a) return []
  return [
    { key: 'og:title', ok: !!a.meta.og.title },
    { key: 'og:description', ok: !!a.meta.og.description },
    { key: 'og:image', ok: !!a.meta.og.image },
  ]
})
const recommendedChecks = computed(() => {
  const a = analysis.value
  if (!a) return []
  return [
    { key: 'og:url', ok: !!a.meta.og.url },
    { key: 'twitter:card', ok: !!a.meta.twitter.card },
  ]
})

const snsLinks = computed(() => {
  const target = encodeURIComponent(analysis.value?.finalUrl || result.value?.finalUrl || url.value)
  return [
    { name: 'Facebook Sharing Debugger', href: `https://developers.facebook.com/tools/debug/?q=${target}` },
    { name: 'X Card Validator', href: 'https://cards-dev.twitter.com/validator' },
    { name: 'LinkedIn Post Inspector', href: `https://www.linkedin.com/post-inspector/inspect/${target}` },
  ]
})

// ToolIntro 用 例示
const exampleInput = 'https://example.com/article'
const exampleOutput = 'og:title / og:description / og:image を取得しプレビュー'

useHead({
  title: 'OG Checker | Migaki Explorer',
  meta: [
    { name: 'description', content: 'URL の OGP メタ情報を取得してプレビュー表示。' },
    { property: 'og:title', content: 'OG Checker | Migaki Explorer' },
    { property: 'og:description', content: 'URL の OGP メタ情報を取得してプレビュー表示。' }
  ]
})

// Primerカード（非サスペンド）
const PrimerCardList = defineAsyncComponent({ loader: () => import('@/components/PrimerCardList.vue'), suspensible: false })
const showPrimers = ref(false)

const doCheck = async () => {
  err.value = null
  result.value = null
  checking.value = true
  analysis.value = null
  imgSize.value = null
  imgWarnings.value = []
  try {
    // SSR/CSR両対応の絶対URL（GET with query）
    const absApi = new URL('/api/ogcheck', siteOrigin).toString()
    const { $fetch } = await import('ofetch')
    const data = await $fetch(absApi, {
      method: 'GET',
      query: { url: url.value, max: max.value },
    })
    result.value = data
    if (data?.html) {
      const headersObj: Record<string, string> = data?.headers || {}
      analysis.value = analyzeSite(String(data.html), String(data.finalUrl || url.value), headersObj)
    }
  } catch (e: any) {
    err.value = e?.statusMessage || e?.message || 'Error'
  } finally {
    checking.value = false
  }
}

const doImgCheck = async () => {
  imgStatus.value = 'checking'
  imgResp.value = null
  imgSize.value = null
  imgWarnings.value = []
  try {
    let imgUrl = ''
    // 結果からOG画像URLを抽出
    if (analysis.value) {
      imgUrl = analysis.value.meta.og.image || ''
    }
    if (!imgUrl) throw new Error('OG画像URLが見つかりません')
    // HEAD優先、失敗時GET（最小情報のみ保持）
    let status = 0
    let contentType = ''
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const resp = await fetch(imgUrl, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
      clearTimeout(timeout)
      status = resp.status
      contentType = resp.headers.get('content-type') || ''
      if (status === 405) {
        const controller2 = new AbortController()
        const timeout2 = setTimeout(() => controller2.abort(), 8000)
        const resp2 = await fetch(imgUrl, { method: 'GET', redirect: 'follow', signal: controller2.signal })
        clearTimeout(timeout2)
        status = resp2.status
        contentType = resp2.headers.get('content-type') || ''
      }
    } catch {
      // ignore network errors, will be treated as unreachable below
    }
    imgResp.value = { status, contentType }
    // 画像寸法: ブラウザ Image オブジェクトで到達時のみ測定（CORS非依存）
    const size = await new Promise<{ width: number; height: number } | null>((resolve) => {
      const im = new Image()
      im.onload = () => resolve({ width: im.naturalWidth, height: im.naturalHeight })
      im.onerror = () => resolve(null)
      // Cache-busting to avoid stale
      const sep = imgUrl.includes('?') ? '&' : '?'
      im.src = imgUrl + sep + '_ogchk=' + Date.now()
    })
    if (size) {
      imgSize.value = size
      // 推奨: 1200x630 以上、縦横比 ~1.91:1（±10%）
      const warnings: string[] = []
      if (size.width < 600 || size.height < 315) warnings.push('画像寸法が小さい可能性（推奨: 幅>=1200, 高さ>=630）')
      const ratio = size.width / Math.max(1, size.height)
      if (Math.abs(ratio - 1.91) / 1.91 > 0.1) warnings.push('画像アスペクト比が推奨(1.91:1)から外れています')
      imgWarnings.value = warnings
    }
    imgStatus.value = status && status < 400 ? 'ok' : 'fail'
  } catch (e) {
    imgStatus.value = 'fail'
    imgResp.value = e
  }
}
onMounted(() => { showPrimers.value = true })
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-6">
    <ToolIntro title="OG Checker" description="URL の OGP メタ情報を取得してプレビュー表示。" usage="1) URL を入力\n2) 取得をクリック" time="~10秒"
      audience="ブロガー・開発" :example-input="exampleInput" :example-output="exampleOutput" />
    <ToolIntroBox audience="広報・編集・開発（SNS共有の見え方確認）" value="URLを入力して、共有時の画像/タイトルと最終URL・ステータスをすぐ確認できます。"
      how="1) URLを入力 → 2) チェックを実行 → 3) 結果パネルを確認" safety="画像取得は失敗する場合があります（到達不可/タイムアウト）。" />
    <ToolIntroBox>
      <p>このツールの使い方や基本概念は <NuxtLink to="/blog/og-check-basics">こちらの記事</NuxtLink> を参照。</p>
    </ToolIntroBox>
    <!-- 入門記事（自動） -->
    <PrimerCardList v-if="showPrimers" tool-id="og-check" />
    <p class="text-sm text-gray-700">
      必須: <code>og:title</code> <code>og:type</code> <code>og:image</code> <code>og:url</code>／推奨:
      <code>og:description</code> <code>og:site_name</code> <code>og:image:alt</code> を評価します。
    </p>
    <h1 class="text-2xl font-bold">OG プレビュー確認</h1>
    <AudienceNote who="コンテンツ担当・開発者（共有プレビュー確認）" />
    <form class="space-y-3" @submit.prevent="doCheck">
      <label class="block">
        <span class="block text-sm mb-1">URL</span>
        <div class="flex gap-2 mb-1">
          <input v-model="url" type="url" required placeholder="https://example.com/..."
            class="w-full rounded-md border px-3 py-2" />
          <button v-for="preset in presets" :key="preset" type="button"
            class="rounded-md border px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 focus-ring" @click="url = preset">
            プリセット
          </button>
        </div>
      </label>
      <label class="block">
        <span class="block text-sm mb-1">最大リダイレクト回数</span>
        <input v-model.number="max" type="number" min="1" max="10" class="w-24 rounded-md border px-3 py-2" />
      </label>
      <div class="flex gap-2">
        <button type="submit" :disabled="checking" class="rounded-xl px-4 py-2 bg-blue-600 text-white focus-ring">
          {{ checking ? 'OGタグ解析中…' : 'OGタグ解析' }}
        </button>
        <button type="button" :disabled="!result || imgStatus === 'checking'"
          class="rounded-xl px-4 py-2 bg-green-600 text-white focus-ring" @click="doImgCheck">
          画像チェック
        </button>
      </div>
    </form>
    <p v-if="err" class="text-red-600">{{ err }}</p>
    <section v-if="result" class="space-y-2">
      <p class="text-sm text-gray-600">
        最終URL: <span class="font-mono">{{ result.finalUrl }}</span> (status <span
          :class="{ 'text-green-700': [200, 302].includes(result.status), 'text-red-600': ![200, 302].includes(result.status) }">{{
            result.status }}</span>) — リダイレクト: {{ result.hops }}回
      </p>
      <div class="flex flex-wrap gap-2 text-xs mb-2">
        <a v-for="link in snsLinks" :key="link.name" :href="link.href" target="_blank" rel="noopener"
          class="underline focus-ring">{{ link.name }}</a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="text-left text-xs text-gray-500">リダイレクトチェーン</caption>
          <thead>
            <tr class="text-left border-b">
              <th class="py-2 pr-4">#</th>
              <th class="py-2 pr-4">URL</th>
              <th class="py-2 pr-4">Status</th>
              <th class="py-2 pr-4">Location</th>
              <th class="py-2 pr-4">Type</th>
              <th class="py-2 pr-4">Length</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in result.chain" :key="h.i" class="border-b align-top">
              <th scope="row" class="py-1 pr-4">{{ h.i }}</th>
              <td class="py-1 pr-4 break-all">{{ h.url }}</td>
              <td class="py-1 pr-4">{{ h.status }}</td>
              <td class="py-1 pr-4 break-all">{{ h.location }}</td>
              <td class="py-1 pr-4">{{ h.contentType }}</td>
              <td class="py-1 pr-4">{{ h.contentLength }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="analysis" class="mt-4">
        <h3 class="font-semibold">必須/推奨タグチェック</h3>
        <ul class="text-sm list-disc pl-5">
          <li v-for="it in requiredChecks" :key="it.key">
            {{ it.key }}
            <span
              :class="'ml-2 text-xs px-2 py-0.5 rounded ' + (it.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white')">{{
                it.ok ? 'Pass' : 'Missing' }}</span>
          </li>
          <li v-for="it in recommendedChecks" :key="it.key">
            {{ it.key }}
            <span
              :class="'ml-2 text-xs px-2 py-0.5 rounded ' + (it.ok ? 'bg-green-600 text-white' : 'bg-orange-600 text-white')">{{
                it.ok ? 'OK' : 'Recommended' }}</span>
          </li>
        </ul>
        <div v-if="analysis.meta.warnings.length" class="mt-2 text-xs text-orange-700">
          警告: {{ analysis.meta.warnings.join(' / ') }}
        </div>
      </div>
      <div class="overflow-x-auto mt-4">
        <table class="w-full text-sm border">
          <caption class="text-left text-xs text-gray-500">OG/Twitterタグ・未知キー含む</caption>
          <thead>
            <tr class="text-left border-b">
              <th class="py-2 pr-4">キー</th>
              <th class="py-2 pr-4">値</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in (analysis ? Object.entries({
              'og:title': analysis.meta.og.title,
              'og:description': analysis.meta.og.description,
              'og:image': analysis.meta.og.image,
              'og:url': analysis.meta.og.url,
              'twitter:card': analysis.meta.twitter.card,
            }) : [])" :key="'og-' + entry[0]">
              <th scope="row" class="py-1 pr-4 break-all">{{ entry[0] }}</th>
              <td class="py-1 pr-4 break-all">{{ entry[1] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="imgStatus !== 'none'" class="mt-4">
        <p class="text-sm">
          画像チェック: <span
            :class="{ 'text-green-700': imgStatus === 'ok', 'text-red-600': imgStatus === 'fail', 'text-gray-500': imgStatus === 'checking' }">
            <template v-if="imgStatus === 'ok'">OK (200/302)</template>
            <template v-else-if="imgStatus === 'fail'">NG (404/5xx)</template>
            <template v-else>Checking…</template>
          </span>
        </p>
        <div v-if="imgResp && typeof imgResp === 'object'" class="text-xs text-gray-700">
          status: {{ imgResp.status }} / type: {{ imgResp.contentType || '—' }}
        </div>
        <div v-if="imgSize" class="text-xs text-gray-700">寸法: {{ imgSize.width }}×{{ imgSize.height }}</div>
        <div v-if="imgWarnings.length" class="text-xs text-orange-700">注意: {{ imgWarnings.join(' / ') }}</div>
      </div>
    </section>
  </main>
</template>
