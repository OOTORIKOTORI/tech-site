<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">JWT Decoder</h1>
      <p class="text-gray-600 mb-2">
        JWT（JSON Web Token）をデコードして、ヘッダーとペイロードの内容を確認できます。
      </p>
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <strong>プライバシー保護:</strong> すべての処理はお使いのブラウザ内でローカルに実行されます。データがサーバーに送信されることはありません。
        </p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- 入力エリア -->
      <div class="space-y-4">
        <div>
          <label for="jwt-input" class="block text-sm font-medium text-gray-700 mb-2">
            JWT トークン
          </label>
          <textarea id="jwt-input" v-model="jwtInput"
            class="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-500 bg-red-50': hasError }"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            aria-describedby="jwt-error"></textarea>

          <div id="jwt-error" class="mt-2 min-h-[1.5rem]" aria-live="polite" aria-atomic="true">
            <p v-if="errorMessage" class="text-sm text-red-600">
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button @click="clearInput"
            class="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
            クリア
          </button>
          <button @click="insertSample"
            class="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            サンプル挿入
          </button>
        </div>
      </div>

      <!-- 出力エリア -->
      <div class="space-y-6">
        <!-- ヘッダー -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-900">Header</h3>
            <button v-if="parsedJwt?.header" @click="copyToClipboard(formattedHeader)"
              class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
              コピー
            </button>
          </div>
          <div class="bg-gray-50 border rounded-lg p-4 min-h-[120px]">
            <pre v-if="parsedJwt?.header"
              class="text-sm text-gray-800 whitespace-pre-wrap break-words">{{ formattedHeader }}</pre>
            <p v-else class="text-gray-500 text-sm">
              有効なJWTを入力するとヘッダーが表示されます
            </p>
          </div>
        </div>

        <!-- ペイロード -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-900">Payload</h3>
            <button v-if="parsedJwt?.payload" @click="copyToClipboard(formattedPayload)"
              class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
              コピー
            </button>
          </div>
          <div class="bg-gray-50 border rounded-lg p-4 min-h-[120px]">
            <pre v-if="parsedJwt?.payload"
              class="text-sm text-gray-800 whitespace-pre-wrap break-words">{{ formattedPayload }}</pre>
            <p v-else class="text-gray-500 text-sm">
              有効なJWTを入力するとペイロードが表示されます
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知 -->
    <div v-if="notification"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300"
      :class="{ 'opacity-0': !showNotification }">
      {{ notification }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { parseJwt, isProbablyJwt } from '../../utils/jwt'

// メタデータ設定
useHead({
  title: 'JWT Decoder | Tools',
  meta: [
    { name: 'description', content: 'JWT（JSON Web Token）をデコードしてヘッダーとペイロードの内容を確認するツールです。' }
  ]
})

// リアクティブデータ
const jwtInput = ref('')
const parsedJwt = ref<{ header: unknown; payload: unknown } | null>(null)
const errorMessage = ref('')
const notification = ref('')
const showNotification = ref(false)

// 計算プロパティ
const hasError = computed(() => !!errorMessage.value)

const formattedHeader = computed(() => {
  if (!parsedJwt.value?.header) return ''
  return JSON.stringify(parsedJwt.value.header, null, 2)
})

const formattedPayload = computed(() => {
  if (!parsedJwt.value?.payload) return ''
  return JSON.stringify(parsedJwt.value.payload, null, 2)
})

// JWTパース処理（リアルタイム）
watch(jwtInput, (newValue: string) => {
  errorMessage.value = ''
  parsedJwt.value = null

  if (!newValue.trim()) {
    return
  }

  if (!isProbablyJwt(newValue.trim())) {
    errorMessage.value = 'JWT形式ではありません。header.payload.signature の形式で入力してください。'
    return
  }

  try {
    parsedJwt.value = parseJwt(newValue.trim())
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '予期しないエラーが発生しました。'
    }
  }
}, { immediate: true })

// メソッド
function clearInput(): void {
  jwtInput.value = ''
}

function insertSample(): void {
  // サンプルJWT（実際の署名は無効だが、header/payloadは有効）
  jwtInput.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
}

async function copyToClipboard(text: string): Promise<void> {
  // 早期 return: 空文字をコピーしない
  if (!text) {
    showNotificationMessage('コピーする内容がありません')
    return
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      showNotificationMessage('コピーしました')
      return
    }
    throw new Error('Clipboard API が利用できません')
  } catch (primaryErr) {
    // Fallback for古いブラウザ
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '-1000px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const succeeded = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (succeeded) {
        showNotificationMessage('コピーしました')
      } else {
        showNotificationMessage('コピーに失敗しました（手動で選択してください）')
      }
    } catch (fallbackErr) {
      showNotificationMessage('コピーに失敗しました（手動で選択してください）')
    }
  }
}

function showNotificationMessage(message: string): void {
  notification.value = message
  showNotification.value = true

  setTimeout(() => {
    showNotification.value = false
    setTimeout(() => {
      notification.value = ''
    }, 300)
  }, 2000)
}
</script>
