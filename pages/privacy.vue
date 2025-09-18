// pages/privacy.vue
<script setup lang="ts">
import { useSeoMeta } from '#imports'
useSeoMeta({ title: 'Privacy Policy' });
</script>
<template>
  <section class="prose max-w-3xl mx-auto p-6">
    <h1>Privacy Policy</h1>
    <p>本サイトは、利用者の個人情報を適切に取り扱います。収集目的・範囲・保存期間は必要最小限とし、法令に従います。</p>
    <h2>Logs & Analytics</h2>
    <p>アクセス解析や運用ログを品質向上のために用いる場合があります。個人が特定される形での公開は行いません。</p>
    <h2>Contact</h2>
    <p>ご不明点があればお問い合わせください。</p>
  </section>
</template>
