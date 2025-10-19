<script setup lang="ts">
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { useHead } from '#imports'
import AudienceNote from '@/components/AudienceNote.vue'
const origin = useRuntimeConfig().public.siteOrigin
const checking = ref(false)
const err = ref<string | null>(null)
const robots = ref<any>(null)
const sitemap = ref<any>(null)
const feed = ref<any>(null)
const showRaw = ref({ robots: false, sitemap: false, feed: false })

// ToolIntro 用 例示
const exampleInput = 'https://example.com'
const exampleOutput = 'HTTP ステータス / ヘッダー / リダイレクト を表示'

useHead({
  title: 'Site Checker | Migaki Explorer',
  meta: [
    { name: 'description', content: 'サイトのHTTPレスポンスを確認（ステータス/ヘッダー/リダイレクト）。' },
    { property: 'og:title', content: 'Site Checker | Migaki Explorer' },
    { property: 'og:description', content: 'サイトのHTTPレスポンスを確認（ステータス/ヘッダー/リダイレクト）。' }
  ]
})

const badge = (ok: boolean | null) => ok === null ? 'N/A' : ok ? 'Pass' : 'Fail'
const badgeClass = (ok: boolean | null) => ok === null ? 'bg-gray-300 text-gray-700' : ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'

const doCheck = async () => {
  err.value = null
  checking.value = true
  robots.value = sitemap.value = feed.value = null
  // robots.txt
  try {
    const url = origin + '/robots.txt'
    const res = await fetch(url)
    const text = await res.text()
    const status = res.status
    // Sitemap行抽出
    const sitemaps = Array.from(text.matchAll(/^Sitemap:\s*(.+)$/gim)).map(m => m[1])
    const sitemapOk = sitemaps.some(u => u && u.startsWith(origin))
    robots.value = {
      url, status, raw: text, sitemaps, sitemapOk,
      ok: status === 200 && (sitemaps.length === 0 || sitemapOk),
    }
  } catch (e) {
    robots.value = { ok: false, raw: String(e) }
  }
  // sitemap.xml
  try {
    const url = origin + '/sitemap.xml'
    const res = await fetch(url)
    const text = await res.text()
    const status = res.status
    let locs: string[] = []
    let allOk = null
    try {
      const doc = new DOMParser().parseFromString(text, 'application/xml')
      locs = Array.from(doc.querySelectorAll('url>loc')).map(e => e.textContent || '')
      allOk = locs.length > 0 ? locs.every(u => u.startsWith(origin)) : null
    } catch {
      void 0
    }
    sitemap.value = {
      url, status, raw: text, count: locs.length, sample: locs.slice(0, 3), allOk,
      ok: status === 200 && allOk,
    }
  } catch (e) {
    sitemap.value = { ok: false, raw: String(e) }
  }
  // feed.xml
  try {
    const url = origin + '/feed.xml'
    const res = await fetch(url)
    const text = await res.text()
    const status = res.status
    let links: string[] = []
    let allOk = null
    try {
      const doc = new DOMParser().parseFromString(text, 'application/xml')
      links = Array.from(doc.querySelectorAll('item>link')).map(e => e.textContent || '')
      allOk = links.length > 0 ? links.every(u => u.startsWith(origin)) : null
    } catch {
      void 0
    }
    feed.value = {
      url, status, raw: text, count: links.length, sample: links.slice(0, 3), allOk,
      ok: status === 200 && allOk,
    }
  } catch (e) {
    feed.value = { ok: false, raw: String(e) }
  }
  checking.value = false
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-6">
    <ToolIntro title="Site Checker" description="サイトのHTTPレスポンスを確認（ステータス/ヘッダー/リダイレクト）。" usage="1) URL を入力\n2) チェックを実行"
      time="~10秒" audience="開発・運用" :example-input="exampleInput" :example-output="exampleOutput" />
    <ToolIntroBox audience="サイト運用者/SEO担当" value="sitemap.xml と robots.txt の到達性や掲載可否をまとめて点検"
      how="サイトのURLを入力 → それぞれの取得結果を確認" safety="URLは保存されず、結果は端末内で表示" />
    <h1 class="text-2xl font-bold">robots / sitemap / feed チェッカー</h1>
    <AudienceNote who="サイト運用・SEO担当（到達性・掲載可否の点検）" />
    <div class="mb-2 text-sm text-gray-700">現在のORIGIN: <span class="font-mono">{{ origin }}</span></div>
    <button :disabled="checking" class="rounded-xl px-4 py-2 bg-blue-600 text-white focus-ring mb-4" @click="doCheck">
      {{ checking ? 'まとめてチェック中…' : 'まとめてチェック' }}
    </button>
    <p v-if="err" class="text-red-600">{{ err }}</p>
    <section class="space-y-6">
      <!-- robots.txt -->
      <div class="border border-zinc-200 dark:border-zinc-800 rounded p-4">
        <div class="flex items-center gap-2 mb-2">
          <h2 class="font-semibold">robots.txt</h2>
          <span :class="'px-2 py-0.5 rounded text-xs ' + badgeClass(robots?.ok)">{{ badge(robots?.ok) }}</span>
        </div>
        <div class="text-sm text-gray-600 mb-1">{{ robots?.url }} — status {{ robots?.status }}</div>
        <ul class="list-disc pl-5 text-sm mb-2">
          <li>
            Sitemap行: <span v-if="robots?.sitemaps?.length">{{ robots.sitemaps.join(', ') }}</span><span
              v-else>なし</span>
          </li>
          <li>
            ORIGIN一致: <span :class="robots?.sitemapOk ? 'text-green-700' : 'text-red-600'">{{ robots?.sitemapOk ? 'OK'
              : 'NG' }}</span>
          </li>
        </ul>
        <button class="focus-ring text-xs underline mb-1" @click="showRaw.robots = !showRaw.robots">生データ表示</button>
        <pre v-if="showRaw.robots"
          class="whitespace-pre-wrap text-xs bg-gray-100 rounded p-2 mt-1">{{ robots?.raw }}</pre>
      </div>
      <!-- sitemap.xml -->
      <div class="border border-zinc-200 dark:border-zinc-800 rounded p-4">
        <div class="flex items-center gap-2 mb-2">
          <h2 class="font-semibold">sitemap.xml</h2>
          <span :class="'px-2 py-0.5 rounded text-xs ' + badgeClass(sitemap?.ok)">{{ badge(sitemap?.ok) }}</span>
        </div>
        <div class="text-sm text-gray-600 mb-1">{{ sitemap?.url }} — status {{ sitemap?.status }}</div>
        <ul class="list-disc pl-5 text-sm mb-2">
          <li>URL件数: {{ sitemap?.count }}</li>
          <li>
            ORIGIN一致: <span :class="sitemap?.allOk ? 'text-green-700' : 'text-red-600'">{{ sitemap?.allOk ? 'OK' :
              'NG' }}</span>
          </li>
          <li>
            サンプル: <span v-if="sitemap?.sample?.length">{{ sitemap.sample.join(', ') }}</span><span v-else>なし</span>
          </li>
        </ul>
        <button class="focus-ring text-xs underline mb-1" @click="showRaw.sitemap = !showRaw.sitemap">生データ表示</button>
        <pre v-if="showRaw.sitemap"
          class="whitespace-pre-wrap text-xs bg-gray-100 rounded p-2 mt-1">{{ sitemap?.raw }}</pre>
      </div>
      <!-- feed.xml -->
      <div class="border border-zinc-200 dark:border-zinc-800 rounded p-4">
        <div class="flex items-center gap-2 mb-2">
          <h2 class="font-semibold">feed.xml</h2>
          <span :class="'px-2 py-0.5 rounded text-xs ' + badgeClass(feed?.ok)">{{ badge(feed?.ok) }}</span>
        </div>
        <div class="text-sm text-gray-600 mb-1">{{ feed?.url }} — status {{ feed?.status }}</div>
        <ul class="list-disc pl-5 text-sm mb-2">
          <li>URL件数: {{ feed?.count }}</li>
          <li>
            ORIGIN一致: <span :class="feed?.allOk ? 'text-green-700' : 'text-red-600'">{{ feed?.allOk ? 'OK' : 'NG'
              }}</span>
          </li>
          <li>サンプル: <span v-if="feed?.sample?.length">{{ feed.sample.join(', ') }}</span><span v-else>なし</span></li>
        </ul>
        <button class="focus-ring text-xs underline mb-1" @click="showRaw.feed = !showRaw.feed">生データ表示</button>
        <pre v-if="showRaw.feed" class="whitespace-pre-wrap text-xs bg-gray-100 rounded p-2 mt-1">{{ feed?.raw }}</pre>
      </div>
    </section>
  </main>
</template>
