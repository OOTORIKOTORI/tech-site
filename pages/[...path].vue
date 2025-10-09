<template>
  <section class="not-found">
    <h1 class="text-2xl font-bold mb-6">ページが見つかりません</h1>
    <nav class="mb-8 flex flex-wrap gap-4">
      <NuxtLink to="/" class="btn">Home</NuxtLink>
      <NuxtLink to="/blog" class="btn">Blog</NuxtLink>
      <NuxtLink to="/tools" class="btn">Tools</NuxtLink>
      <NuxtLink to="/contact" class="btn">Contact</NuxtLink>
    </nav>
    <form class="mb-4 max-w-xs" @submit.prevent>
      <input type="search" placeholder="サイト内検索" class="input w-full" />
    </form>
  </section>
</template>

<script setup lang="ts">
import { setResponseStatus } from 'h3'
import { useRequestEvent } from '#imports'
if (process.server) {
  const e = useRequestEvent()
  if (e) setResponseStatus(e, 404)
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 1rem;
}

.btn {
  padding: 0.5rem 1.2rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  text-decoration: none;
  color: #222;
  font-weight: 500;
  transition: background 0.2s;
}

.btn:hover {
  background: #e5e7eb;
}

.input {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 1rem;
}
</style>
