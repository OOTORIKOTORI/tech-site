<script setup lang="ts">
import { computed } from 'vue'
import type { TopSnapshot } from '@/types/top'

const props = defineProps<{ snapshots: TopSnapshot[] }>()

const rows = computed(() =>
  props.snapshots.map(s => ({
    t: s.ts,
    cpuUsed: 100 - (s.cpu?.id ?? 100),
    load1: s.load?.one ?? 0,
    memUsedMiB: (s.mem?.used ?? 0) / 1024,
  }))
)

function agg(nums: number[]) {
  const arr = nums.length ? nums : [0]
  const max = Math.max(...arr)
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return { max, avg }
}

const cpuAgg = computed(() => agg(rows.value.map(r => r.cpuUsed)))
const loadAgg = computed(() => agg(rows.value.map(r => r.load1)))
const memAgg = computed(() => agg(rows.value.map(r => r.memUsedMiB)))

function makePath(values: number[], width = 800, height = 160, pad = 24) {
  const n = Math.max(values.length, 2)
  const xs = values.map((_, i) => pad + (i * (width - pad * 2)) / (n - 1))
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const ys = values.map(v => {
    const y = height - pad - (max - min === 0 ? 0 : (v - min) * (height - pad * 2) / (max - min))
    return Math.max(pad, Math.min(height - pad, y))
  })
  if (!ys || xs.length !== ys.length) return { d: '', scale: { min, max, pad, width, height }, last: 0 }
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i]?.toFixed(1)}`).join(' ')
  const scale = { min, max, pad, width, height }
  const last = values.at(-1) ?? 0
  return { d, scale, last }
}

const cpu = computed(() => makePath(rows.value.map(r => r.cpuUsed)))
const load = computed(() => makePath(rows.value.map(r => r.load1)))
const mem = computed(() => makePath(rows.value.map(r => r.memUsedMiB)))

function gridLines(scale: { min: number; max: number; pad: number; width: number; height: number }) {
  const { min, max, pad, width, height } = scale
  const lines: string[] = []
  const ticks = 5
  for (let i = 0; i <= ticks; i++) {
    const v = min + (i * (max - min)) / ticks
    const y = height - pad - (max - min === 0 ? 0 : (v - min) * (height - pad * 2) / (max - min))
    lines.push(`<line x1="${pad}" y1="${y.toFixed(1)}" x2="${(width - pad).toFixed(1)}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity="0.15" />`)
  }
  return lines.join('')
}

function rightLabel(scale: { pad: number; width: number; height: number }, text: string) {
  const x = scale.width - scale.pad + 4
  const y = scale.pad + 12
  return `<text x="${x}" y="${y}" font-size="11" fill="currentColor">${text}</text>`
}
</script>


<template>
  <div class="space-y-6">
    <!-- CPU -->
    <figure class="w-full rounded-2xl ring-1 ring-gray-200 p-3" aria-label="CPU usage chart">
      <figcaption class="flex items-baseline justify-between mb-1">
        <span class="text-xs text-gray-600">CPU Used (%)</span>
        <span class="text-[11px] text-gray-500">avg {{ cpuAgg.avg.toFixed(1) }} / max {{ cpuAgg.max.toFixed(1) }}</span>
      </figcaption>
      <svg viewBox="0 0 800 160" class="w-full h-40 text-gray-800" xmlns="http://www.w3.org/2000/svg" role="img">
        <g v-if="cpu.scale" v-html="gridLines(cpu.scale)"></g>
        <path v-if="cpu.d" :d="cpu.d" fill="none" stroke="currentColor" stroke-width="2" />
        <g v-if="cpu.scale && cpu.last !== undefined" v-html="rightLabel(cpu.scale, cpu.last.toFixed(1) + '%')"></g>
      </svg>
    </figure>

    <!-- Load -->
    <figure class="w-full rounded-2xl ring-1 ring-gray-200 p-3" aria-label="Load average (1m) chart">
      <figcaption class="flex items-baseline justify-between mb-1">
        <span class="text-xs text-gray-600">Load (1m)</span>
        <span class="text-[11px] text-gray-500">avg {{ loadAgg.avg.toFixed(2) }} / max {{ loadAgg.max.toFixed(2)
          }}</span>
      </figcaption>
      <svg viewBox="0 0 800 160" class="w-full h-40 text-gray-800" xmlns="http://www.w3.org/2000/svg" role="img">
        <g v-if="load.scale" v-html="gridLines(load.scale)"></g>
        <path v-if="load.d" :d="load.d" fill="none" stroke="currentColor" stroke-width="2" />
        <g v-if="load.scale && load.last !== undefined" v-html="rightLabel(load.scale, load.last.toFixed(2))"></g>
      </svg>
    </figure>

    <!-- Mem -->
    <figure class="w-full rounded-2xl ring-1 ring-gray-200 p-3" aria-label="Memory used chart">
      <figcaption class="flex items-baseline justify-between mb-1">
        <span class="text-xs text-gray-600">Mem Used (MiB)</span>
        <span class="text-[11px] text-gray-500">avg {{ memAgg.avg.toFixed(0) }} / max {{ memAgg.max.toFixed(0) }}</span>
      </figcaption>
      <svg viewBox="0 0 800 160" class="w-full h-40 text-gray-800" xmlns="http://www.w3.org/2000/svg" role="img">
        <g v-if="mem.scale" v-html="gridLines(mem.scale)"></g>
        <path v-if="mem.d" :d="mem.d" fill="none" stroke="currentColor" stroke-width="2" />
        <g v-if="mem.scale && mem.last !== undefined" v-html="rightLabel(mem.scale, mem.last.toFixed(0) + ' MiB')"></g>
      </svg>
    </figure>
  </div>
</template>
