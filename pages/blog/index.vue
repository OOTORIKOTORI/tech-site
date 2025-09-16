<template>
  <div class="container mx-auto max-w-3xl py-8 px-4">
    <h1 class="text-2xl font-bold mb-6">Tech Blog</h1>
    <ContentList path="/blog" v-slot="{ list }">
      <ul class="space-y-6">
        <li v-for="article in list" :key="article._path" class="border-b pb-4">
          <NuxtLink :to="article._path" class="text-xl font-semibold hover:underline">{{ article.title }}</NuxtLink>
          <div class="text-xs text-gray-500 mt-1">{{ article.date }}<span v-if="article.tags"> ｜ {{ article.tags.join(', ') }}</span></div>
          <div class="mt-2 text-sm text-gray-700 line-clamp-2">{{ article.description }}</div>
        </li>
      </ul>
    </ContentList>
  </div>
</template>

<script setup lang="ts">
import { ContentList } from '#components'
</script>
