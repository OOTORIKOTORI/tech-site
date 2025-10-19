<script setup lang="ts">
import { computed } from 'vue'
import type { TopSnapshot } from '@/types/top'

const props = defineProps<{ snapshots: TopSnapshot[] }>()

function agg(nums: number[]) {
  const n = nums.length || 1
  const max = Math.max(...nums, 0)
  const avg = nums.reduce((a, b) => a + b, 0) / n
  return { max, avg }
}

const cpu = computed(() => agg(props.snapshots.map(s => 100 - (s.cpu?.id ?? 100))))
const load = computed(() => agg(props.snapshots.map(s => s.load?.one ?? 0)))
const mem = computed(() => agg(props.snapshots.map(s => (s.mem?.used ?? 0) / 1024)))
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-3">
    <div class="surface p-4">
      <div class="text-xs muted">CPU Used (%)</div>
      <div class="text-xl font-semibold">{{ cpu.max.toFixed(1) }} <span class="text-sm muted">max</span></div>
      <div class="text-sm muted">{{ cpu.avg.toFixed(1) }} avg</div>
    </div>
    <div class="surface p-4">
      <div class="text-xs muted">Load (1m)</div>
      <div class="text-xl font-semibold">{{ load.max.toFixed(2) }} <span class="text-sm muted">max</span></div>
      <div class="text-sm muted">{{ load.avg.toFixed(2) }} avg</div>
    </div>
    <div class="surface p-4">
      <div class="text-xs muted">Mem Used (MiB)</div>
      <div class="text-xl font-semibold">{{ mem.max.toFixed(0) }} <span class="text-sm muted">max</span></div>
      <div class="text-sm muted">{{ mem.avg.toFixed(0) }} avg</div>
    </div>
  </div>
</template>
