<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-center px-6">
    <h1 class="text-4xl font-bold mb-4" aria-label="Error status">
      <span v-if="is404">404</span>
      <span v-else>エラー</span>
    </h1>
    <p class="text-gray-600 mb-6" v-if="is404">お探しのページが見つかりませんでした。</p>
    <p class="text-gray-600 mb-6" v-else>予期しないエラーが発生しました。時間をおいて再度お試しください。</p>
    <NuxtLink to="/" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">トップへ戻る</NuxtLink>
    <p class="text-xs text-gray-400 mt-8" v-if="error?.statusCode && !is404">Status: {{ error.statusCode }}</p>
  </div>
</template>
<script setup lang="ts">
import { useError, computed, useHead } from '#imports'
const error = useError()
const is404 = computed(() => error.value?.statusCode === 404)
useHead({ title: is404.value ? '404 Not Found' : 'Error' })
</script>
