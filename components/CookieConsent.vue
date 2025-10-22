<script setup lang="ts">
import { onMounted, ref } from 'vue'

type ConsentChoice = 'accepted' | 'rejected'

const open = ref(false)
const storageKey = 'cookie-consent-choice'

function updateConsent(choice: ConsentChoice) {
  const granted = choice === 'accepted' ? 'granted' : 'denied'
    ; (window as any).gtag?.('consent', 'update', {
      ad_storage: granted,
      analytics_storage: granted,
      ad_user_data: granted,
      ad_personalization: granted,
    })
}

function persist(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(storageKey, choice)
  } catch {
    // localStorage unavailable (private mode, etc.)
  }
}

function apply(choice: ConsentChoice) {
  updateConsent(choice)
  persist(choice)
  open.value = false
}

function acceptAll() {
  apply('accepted')
}

function rejectAll() {
  apply('rejected')
}

onMounted(() => {
  try {
    const stored = window.localStorage.getItem(storageKey) as ConsentChoice | null
    if (stored === 'accepted' || stored === 'rejected') {
      apply(stored)
      return
    }
  } catch {
    // ignore storage errors and display banner
  }
  open.value = true
})
</script>

<template>
  <div v-if="open" class="fixed inset-x-0 bottom-0 z-50 bg-gray-900/90 text-white p-4 text-sm" role="dialog"
    aria-modal="true" aria-label="Cookie consent banner">
    <div class="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="opacity-90">
        当サイトは Cookie を使用します。EU/UK/CH のユーザーは広告・分析に関する同意を選択できます。
      </p>
      <div class="flex gap-2 justify-end">
        <button class="px-3 py-2 rounded bg-gray-700 focus-ring" type="button" @click="rejectAll">拒否</button>
        <button class="px-3 py-2 rounded bg-white text-gray-900 focus-ring" type="button" @click="acceptAll">同意</button>
      </div>
    </div>
  </div>
</template>
