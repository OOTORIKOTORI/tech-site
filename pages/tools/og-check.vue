<script setup lang="ts">
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
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

const doCheck = async () => {
  err.value = null
  result.value = null
  checking.value = true
  try {
    // SSR/CSR両対応の絶対URL
    const absApi = new URL('/api/ogcheck', siteOrigin).toString()
    const { $fetch } = await import('ofetch')
    const data = await $fetch(absApi, {
      method: 'POST',
      body: { url: url.value, max: max.value },
    })
    result.value = data
  } catch (e: any) {
    err.value = e?.statusMessage || e?.message || 'Error'
  } finally {
    checking.value = false
  }
}

const doImgCheck = async () => {
  imgStatus.value = 'checking'
  imgResp.value = null
  try {
    let imgUrl = ''
    // 結果からOG画像URLを抽出
    if (result.value) {
      imgUrl = result.value['og:image'] || result.value['twitter:image'] || ''
    }
    if (!imgUrl) throw new Error('OG画像URLが見つかりません')
    const { $fetch } = await import('ofetch')
    // HEAD優先、失敗時GET
    let resp
    try {
      resp = await $fetch(imgUrl, { method: 'HEAD', redirect: 'follow' })
    } catch {
      resp = await $fetch(imgUrl, { method: 'GET', redirect: 'follow' })
    }
    imgResp.value = resp
    imgStatus.value = 'ok'
  } catch (e) {
    imgStatus.value = 'fail'
    imgResp.value = e
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-6">
    <h1 class="text-2xl font-bold">OG プレビュー確認</h1>
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
            <tr v-for="entry in Object.entries(result).filter(([k]) => k.startsWith('og:') || k.startsWith('twitter:'))"
              :key="'og-' + entry[0]">
              <th scope="row" class="py-1 pr-4 break-all">{{ entry[0] }}</th>
              <td class="py-1 pr-4 break-all">{{ entry[1] }}</td>
            </tr>
            <tr
              v-for="entry in Object.entries(result).filter(([k]) => !k.startsWith('og:') && !k.startsWith('twitter:') && !['finalUrl', 'status', 'hops', 'chain'].includes(k))"
              :key="'other-' + entry[0]">
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
        <div v-if="imgResp && typeof imgResp === 'object'">
          <pre class="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{{ imgResp }}</pre>
        </div>
      </div>
    </section>
  </main>
</template>
