<template>
  <nav class="flex gap-6 items-center py-4 px-2 border-b">
    <NuxtLink to="/" class="font-bold text-lg focus-ring">
      {{ display }}
    </NuxtLink>
    <NuxtLink to="/tools/cron-jst" class="hover:underline focus-ring">
      Cron JST
    </NuxtLink>
    <NuxtLink to="/blog" class="hover:underline focus-ring"
      :aria-current="$route.path.startsWith('/blog') ? 'page' : undefined">
      Blog
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { useSiteBrand } from '@/composables/useSiteBrand'
const { display } = useSiteBrand()
</script>
