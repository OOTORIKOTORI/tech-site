<template>
  <div
    class="ad-slot"
    :style="styleObj"
    role="region"
    :aria-label="label"
  >
    <span class="ad-slot__label">{{ label }}</span>
  </div>
  <!-- 将来の広告タグはこの枠内に差し替え挿入するだけ -->
  <!-- e.g., <div class="ad-slot"><ins class="adsbygoogle" ... /></div> -->
  <!-- CLS回避: min-heightで初期から領域を確保 -->
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ width?: string; height?: string; label?: string }>(), {
  height: '280px',
  width: '100%',
  label: '広告（仮）',
})

const styleObj = computed(() => ({
  minHeight: props.height,
  width: props.width || '100%',
}))

const label = computed(() => props.label)
</script>

<style scoped>
.ad-slot {
  box-sizing: border-box;
  display: block;
  width: 100%;
  /* heightは未指定（min-heightで確保） */
  border: 1px dashed #d1d5db; /* gray-300 */
  border-radius: 8px;
  background-image: repeating-linear-gradient(
    45deg,
    rgba(107, 114, 128, 0.08),
    rgba(107, 114, 128, 0.08) 10px,
    rgba(107, 114, 128, 0.02) 10px,
    rgba(107, 114, 128, 0.02) 20px
  );
  background-color: #fafafa;
  color: #6b7280; /* gray-500 */
  position: relative;
  overflow: hidden;
}

.ad-slot__label {
  position: absolute;
  left: 12px;
  top: 8px;
  font-size: 12px;
  line-height: 1;
  opacity: 0.8;
  user-select: none;
}
</style>
