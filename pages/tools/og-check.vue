<script setup lang="ts">
import { ref } from 'vue'
import { useFetch } from '#app'
const url = ref('')
const max = ref(5)
const checking = ref(false)
const result = ref<any | null>(null)
const err = ref<string | null>(null)

const doCheck = async () => {
  err.value = null
  result.value = null
  checking.value = true
  try {
    const { data, error } = await useFetch('/api/ogcheck', {
      query: { url: url.value, max: max.value },
      // useFetch は SSR/CSR 両対応（ofetch直での相対URLは使わない）
      lazy: true
    })
    if (error.value) throw error.value
    result.value = data.value
  } catch (e: any) {
    err.value = e?.statusMessage || e?.message || 'Error'
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6 space-y-6">
    <h1 class="text-2xl font-bold">OG プレビュー確認</h1>
    <form class="space-y-3" @submit.prevent="doCheck">
      <label class="block">
        <span class="block text-sm mb-1">URL</span>
        <input v-model="url" type="url" required placeholder="https://example.com/..."
          class="w-full rounded-md border px-3 py-2" />
      </label>
      <label class="block">
        <span class="block text-sm mb-1">最大リダイレクト回数</span>
        <input v-model.number="max" type="number" min="1" max="10" class="w-24 rounded-md border px-3 py-2" />
      </label>
      <button :disabled="checking" class="rounded-xl px-4 py-2 bg-blue-600 text-white">
        {{ checking ? 'Checking…' : 'Check' }}
      </button>
    </form>
    <p v-if="err" class="text-red-600">{{ err }}</p>
    <section v-if="result" class="space-y-2">
      <p class="text-sm text-gray-600">
Final: {{ result.finalUrl }} (status {{ result.status }}) — hops {{ result.hops
        }}
</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
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
              <td class="py-1 pr-4">{{ h.i }}</td>
              <td class="py-1 pr-4 break-all">{{ h.url }}</td>
              <td class="py-1 pr-4">{{ h.status }}</td>
              <td class="py-1 pr-4 break-all">{{ h.location }}</td>
              <td class="py-1 pr-4">{{ h.contentType }}</td>
              <td class="py-1 pr-4">{{ h.contentLength }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
