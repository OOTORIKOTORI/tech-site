<template>
  <section class="max-w-2xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold mb-4">このサイトについて</h1>
    <p class="mb-4">
      「Migaki Explorer」は、知識や経験を共有し、学びを深めるためのブログ＆情報サイトです。
    </p>
    <p class="mb-4">
      サイト運営や内容に関するご連絡は、
      <a :href="`mailto:${contactEmail}`" class="text-blue-600 underline">{{ contactEmail }}</a>
      までお願いします。
    </p>
  </section>
</template>

<script setup lang="ts">
const contactEmail = process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'ootorikotori981@gmail.com';
</script>
