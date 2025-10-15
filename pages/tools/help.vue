<script setup lang="ts">
import { definePageMeta } from '#imports'
definePageMeta({ title: 'Help' })
</script>

<template>
  <main class="mx-auto max-w-2xl p-6 space-y-4">
    <h1 class="text-3xl font-bold">Help / サポート</h1>
    <p>不具合の報告や機能のご提案は、下記のボタンからご連絡ください。必要であればページURLや再現手順をお書き添えください。</p>
    <p>返信が必要なお問い合わせも同じフォームで承ります。</p>
    <NuxtLink to="/contact"
      class="inline-block rounded-lg px-4 py-2 ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-ring">
      お問い合わせ・提案を送る
    </NuxtLink>
  </main>
</template>
