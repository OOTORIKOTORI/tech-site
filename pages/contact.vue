<template>
  <div class="contact-page mx-auto max-w-md py-12 px-4">
    <h1 class="text-2xl font-bold mb-6">お問い合わせ</h1>
    <div class="mb-4 flex items-center">
      <span id="contact-email" class="font-mono text-lg select-all">
        {{ user }}@{{ domain }}
      </span>
      <button id="copy-btn" class="ml-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm border border-gray-300"
        @click="copy">
        コピー
      </button>
      <button id="mailto-btn"
        class="ml-2 px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm border border-blue-600"
        :href="mailtoLink" as="a" @click="openMailto">
        メールを作成
      </button>
    </div>
    <div v-if="toast" class="mt-2 text-green-600 text-sm">コピーしました</div>
    <p class="text-gray-500 text-sm mt-6">
      ※ メールアドレスはスパム対策のため分割表示しています。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#imports'
const runtime = useRuntimeConfig()
const email = (runtime.public?.NUXT_PUBLIC_CONTACT_EMAIL as string) || 'ootorikotori981@gmail.com'
const [user, domain] = email.split('@')
const toast = ref(false)
const mailtoLink = computed(() => `mailto:${user}@${domain}?subject=[Migaki Explorer] お問い合わせ`)
const copy = async () => {
  try {
    await navigator.clipboard.writeText(`${user}@${domain}`)
    // eslint-disable-next-line no-console
    console.log('copied')
    toast.value = true
    setTimeout(() => (toast.value = false), 1500)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
  }
}
function openMailto(e: Event) {
  window.location.href = mailtoLink.value
  e.preventDefault()
}
</script>

<style scoped>
.contact-page {
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
</style>
