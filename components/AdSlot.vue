<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'

interface Props {
  slot?: string
  format?: string
  style?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'auto',
  style: 'display:block',
  className: ''
})

const config = useRuntimeConfig()
const isEnabled = computed(() => {
  // Dev環境では常に無効
  if (process.dev) {
    return false
  }

  // フラグとクライアントIDが両方設定されているときのみ有効
  return config.public.enableAds === '1' && config.public.adsenseClient
})

const canRender = computed(() => isEnabled.value && !!props.slot)

onMounted(() => {
  if (canRender.value) {
    // AdSenseの広告をプッシュ
    const w = window as any
    w.adsbygoogle = w.adsbygoogle || []
    w.adsbygoogle.push({})
  }
})
</script>

<template>
  <ins v-if="canRender" class="adsbygoogle" :class="props.className" :style="props.style"
    :data-ad-client="config.public.adsenseClient" :data-ad-slot="props.slot" :data-ad-format="props.format"
    data-full-width-responsive="true"></ins>
</template>
