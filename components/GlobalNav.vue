<template>
  <nav class="flex gap-6 items-center py-4 px-2 border-b">
    <NuxtLink to="/" class="font-bold text-lg">Tech Site</NuxtLink>
    <NuxtLink to="/tools/cron-jst" class="hover:underline">Cron JST</NuxtLink>
    <NuxtLink to="/blog" class="hover:underline" :aria-current="$route.path.startsWith('/blog') ? 'page' : undefined">
      Blog
    </NuxtLink>
  </nav>
</template>
