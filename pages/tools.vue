<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">開発ツール</h1>
      <p class="text-gray-600 text-lg">
        開発に役立つ各種ツールをご利用いただけます。すべてのツールはブラウザ内で動作し、データがサーバーに送信されることはありません。
      </p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- JWT Decoder -->
      <NuxtLink to="/tools/jwt-decode"
        class="block group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 hover:border-blue-300">
        <div class="flex items-center mb-4">
          <div
            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          JWT Decoder
        </h3>
        <p class="text-gray-600 text-sm mb-4">
          JWT（JSON Web Token）をデコードして、ヘッダーとペイロードの内容を確認できます。
        </p>
        <div class="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
          ツールを使用する
          <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>

      <!-- 将来のツール用のプレースホルダー -->
      <div
        class="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-400 mb-2">新しいツール</h3>
        <p class="text-gray-400 text-sm text-center">
          近日公開予定
        </p>
      </div>

      <div
        class="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-400 mb-2">新しいツール</h3>
        <p class="text-gray-400 text-sm text-center">
          近日公開予定
        </p>
      </div>
    </div>

    <div class="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-blue-900 mb-2">プライバシーについて</h2>
      <p class="text-blue-800 text-sm">
        このサイトのすべてのツールは、お使いのブラウザ内でローカルに動作します。
        入力されたデータがサーバーに送信されることはなく、完全にプライベートで安全にご利用いただけます。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// メタデータ設定
useHead({
  title: '開発ツール',
  meta: [
    { name: 'description', content: '開発に役立つ各種ツールをご利用いただけます。JWT Decoder など、ブラウザ内で安全に動作するツールを提供しています。' }
  ]
})
</script>
