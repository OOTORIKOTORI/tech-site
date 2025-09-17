<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="max-w-xl w-full text-center space-y-4">
      <h1 class="text-3xl font-bold">{{ title }}</h1>
      <p class="opacity-80">
        <span v-if="is404">ページが見つかりませんでした。</span>
        <span v-else>エラーが発生しました。時間をおいて再度お試しください。</span>
      </p>
      <div class="text-sm opacity-60">
        <code>{{ props.error?.statusCode }} {{ props.error?.statusMessage || props.error?.message }}</code>
      </div>
      <div class="pt-2">
        <button class="px-4 py-2 rounded-2xl shadow border" @click="goHome">Home に戻る</button>
      </div>
      <footer class="pt-6 text-xs opacity-60">
        <NuxtLink to="/privacy" class="underline mr-3">Privacy</NuxtLink>
        <NuxtLink to="/terms" class="underline mr-3">Terms</NuxtLink>
        <NuxtLink to="/ads" class="underline">Ads</NuxtLink>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>();
const is404 = computed(() => props.error?.statusCode === 404);
const title = computed(() => (is404.value ? '404 Not Found' : 'Something went wrong'));
useSeoMeta({ title: title.value });

function goHome() {
  clearError({ redirect: '/' });
}
</script>
