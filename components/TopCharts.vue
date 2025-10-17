<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TopSnapshot } from '@/types/top'


const props = defineProps<{ snapshots: TopSnapshot[] }>()


// 系列ごとの表示状態（初期は全てtrue）
const showCpu = ref(true)
const showLoad = ref(true)
const showMem = ref(true)

// しきい値ガイドライン（最大3本、リロードでリセット）
const cpuGuides = ref(['', '', ''])
const loadGuides = ref(['', '', ''])
const memGuides = ref(['', '', ''])

function renderGuides(
  guides: string[],
  scale: { min: number; max: number; pad: number; width: number; height: number } | undefined,
  unit: string
): string {
  if (!scale) return ''
  const { min, max, pad, width, height } = scale
  return guides
    .map((v: string, i: number) => {
      const val = parseFloat(v)
      if (isNaN(val)) return ''
      const y = height - pad - (max - min === 0 ? 0 : (val - min) * (height - pad * 2) / (max - min))
      if (y < pad || y > height - pad) return ''
      const color = ['#e11d48', '#2563eb', '#059669'][i % 3] // 赤/青/緑
      return `
        <line x1="${pad}" y1="${y.toFixed(1)}" x2="${(width - pad).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 2" />
        <text x="${width - pad + 6}" y="${y + 4}" font-size="11" fill="${color}">${val}${unit}</text>
      `
    })
    .join('')
}

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

// ファイル名生成
const nowStamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function filename(kind: 'cpu' | 'load' | 'mem', ext: 'svg' | 'png') {
  return `top-analyzer-${kind}-${nowStamp()}.${ext}`
}

function serializeSvgWithPadding(svg: SVGSVGElement, padding = 12): string {
  // clone to avoid mutating rendered SVG
  const cloned = svg.cloneNode(true) as SVGSVGElement
  // compute bbox safely
  let bbox: DOMRect
  try {
    bbox = svg.getBBox()
  } catch (e) {
    // fallback to viewBox or width/height
    const vb = svg.viewBox?.baseVal
    const w = vb?.width || parseFloat(svg.getAttribute('width') || '800') || 800
    const h = vb?.height || parseFloat(svg.getAttribute('height') || '160') || 160
    bbox = new DOMRect(0, 0, w, h)
  }
  const w = Math.ceil(bbox.width + padding * 2)
  const h = Math.ceil(bbox.height + padding * 2)
  const minX = Math.floor((bbox.x ?? 0) - padding)
  const minY = Math.floor((bbox.y ?? 0) - padding)

  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  cloned.setAttribute('version', '1.1')
  cloned.setAttribute('width', String(w))
  cloned.setAttribute('height', String(h))
  cloned.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`)
  cloned.setAttribute('overflow', 'visible')

  // white background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('x', String(minX))
  bg.setAttribute('y', String(minY))
  bg.setAttribute('width', String(w))
  bg.setAttribute('height', String(h))
  bg.setAttribute('fill', 'white')
  cloned.insertBefore(bg, cloned.firstChild)

  return new XMLSerializer().serializeToString(cloned)
}

async function exportChart(kind: 'cpu' | 'load' | 'mem', format: 'svg' | 'png') {
  if (typeof document === 'undefined') return
  const root = document.querySelector(`[data-chart="${kind}"]`) as HTMLElement | null
  if (!root) return
  const svgEl = root.querySelector('svg') as SVGSVGElement | null
  const canvasEl = root.querySelector('canvas') as HTMLCanvasElement | null

  if (format === 'svg' && svgEl) {
    const xml = serializeSvgWithPadding(svgEl, 12)
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename(kind, 'svg')
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
    return
  }

  // PNG path
  if (canvasEl) {
    const tmp = document.createElement('canvas')
    tmp.width = canvasEl.width
    tmp.height = canvasEl.height
    const ctx = tmp.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    ctx.drawImage(canvasEl, 0, 0)
    const dataUrl = tmp.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename(kind, 'png')
    a.click()
    a.remove()
    return
  }

  if (svgEl) {
    const xml = serializeSvgWithPadding(svgEl, 12)
    const svgUrl = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
    await new Promise<void>((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0)
        const url = c.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = filename(kind, 'png')
        a.click()
        a.remove()
        URL.revokeObjectURL(svgUrl)
        resolve()
      }
      img.src = svgUrl
    })
  }
}
</script>


<template>
  <div class="space-y-6">
    <!-- CPU -->
    <figure class="w-full rounded-2xl ring-1 ring-gray-200 p-3" aria-label="CPU usage chart" :data-chart="'cpu'">
      <figcaption class="flex flex-col gap-1 mb-1">
        <div class="flex items-baseline justify-between">
          <span class="text-xs text-gray-600">CPU Used (%)</span>
          <span class="text-[11px] text-gray-500">avg {{ cpuAgg.avg.toFixed(1) }} / max {{ cpuAgg.max.toFixed(1)
          }}</span>
          <button type="button" class="ml-2 px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
            :aria-pressed="showCpu" @click="showCpu = !showCpu">
            <span v-if="showCpu">●</span><span v-else>○</span> CPU
          </button>
        </div>
        <div class="flex gap-2 items-center mt-1">
          <label class="text-xs" :for="'cpu-guide-0'">しきい値:</label>
          <template v-for="i in 3" :key="i">
            <div class="inline-flex items-center gap-1">
              <input :id="'cpu-guide-' + (i - 1)" v-model="cpuGuides[i - 1]" :aria-label="'CPUしきい値' + i" type="number"
                inputmode="numeric" pattern="[0-9]*" min="0" max="100" step="1"
                class="w-16 px-1 py-0.5 border rounded text-xs" :placeholder="i === 1 ? '例: 80' : ''" />
              <span aria-hidden="true" class="text-xs text-muted">%</span>
            </div>
          </template>
        </div>
      </figcaption>
      <div class="flex gap-2 mt-1">
        <button type="button" class="px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
          :aria-label="'CPUチャートをSVG保存'" @click="exportChart('cpu', 'svg')">
          SVG保存
        </button>
        <button type="button" class="px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
          :aria-label="'CPUチャートをPNG保存'" @click="exportChart('cpu', 'png')">
          PNG保存
        </button>
      </div>
      <svg :id="'topchart-svg-cpu'" viewBox="0 0 800 160" class="w-full h-40 text-gray-800"
        xmlns="http://www.w3.org/2000/svg" role="img">
        <g v-if="cpu.scale" v-html="gridLines(cpu.scale)"></g>
        <g v-if="cpu.scale" v-html="renderGuides(cpuGuides, cpu.scale, '%')"></g>
        <path v-if="cpu.d && showCpu" :d="cpu.d" fill="none" stroke="currentColor" stroke-width="2" />
        <g v-if="cpu.scale && cpu.last !== undefined && showCpu"
          v-html="rightLabel(cpu.scale, cpu.last.toFixed(1) + '%')">
        </g>
      </svg>
    </figure>


    <!-- Load -->
    <figure class="w-full rounded-2xl ring-1 ring-gray-200 p-3" aria-label="Load average (1m) chart"
      :data-chart="'load'">
      <figcaption class="flex flex-col gap-1 mb-1">
        <div class="flex items-baseline justify-between">
          <span class="text-xs text-gray-600">Load (1m)</span>
          <span class="text-[11px] text-gray-500">avg {{ loadAgg.avg.toFixed(2) }} / max {{ loadAgg.max.toFixed(2)
          }}</span>
          <button type="button" class="ml-2 px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
            :aria-pressed="showLoad" @click="showLoad = !showLoad">
            <span v-if="showLoad">●</span><span v-else>○</span> Load
          </button>
        </div>
        <div class="flex gap-2 items-center mt-1">
          <label class="text-xs" :for="'load-guide-0'">しきい値:</label>
          <template v-for="i in 3" :key="i">
            <div class="inline-flex items-center gap-1">
              <input :id="'load-guide-' + (i - 1)" v-model="loadGuides[i - 1]" :aria-label="'Loadしきい値' + i"
                type="number" inputmode="decimal" pattern="[0-9.]*" min="0" step="0.1"
                class="w-16 px-1 py-0.5 border rounded text-xs" :placeholder="i === 1 ? '例: 4.0' : ''" />
              <!-- Loadは単位なし -->
            </div>
          </template>
        </div>
      </figcaption>
      <div class="flex gap-2 mt-1">
        <button type="button" class="px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
          :aria-label="'LoadチャートをSVG保存'" @click="exportChart('load', 'svg')">
          SVG保存
        </button>
        <button type="button" class="px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
          :aria-label="'LoadチャートをPNG保存'" @click="exportChart('load', 'png')">
          PNG保存
        </button>
      </div>
      <svg :id="'topchart-svg-load'" viewBox="0 0 800 160" class="w-full h-40 text-gray-800"
        xmlns="http://www.w3.org/2000/svg" role="img">
        <g v-if="load.scale" v-html="gridLines(load.scale)"></g>
        <g v-if="load.scale" v-html="renderGuides(loadGuides, load.scale, '')"></g>
        <path v-if="load.d && showLoad" :d="load.d" fill="none" stroke="currentColor" stroke-width="2" />
        <g v-if="load.scale && load.last !== undefined && showLoad"
          v-html="rightLabel(load.scale, load.last.toFixed(2))">
        </g>
      </svg>
    </figure>


    <!-- Mem -->
    <figure class="w-full rounded-2xl ring-1 ring-gray-200 p-3" aria-label="Memory used chart" :data-chart="'mem'">
      <figcaption class="flex flex-col gap-1 mb-1">
        <div class="flex items-baseline justify-between">
          <span class="text-xs text-gray-600">Mem Used (MiB)</span>
          <span class="text-[11px] text-gray-500">avg {{ memAgg.avg.toFixed(0) }} / max {{ memAgg.max.toFixed(0)
          }}</span>
          <button type="button" class="ml-2 px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
            :aria-pressed="showMem" @click="showMem = !showMem">
            <span v-if="showMem">●</span><span v-else>○</span> Mem
          </button>
        </div>
        <div class="flex gap-2 items-center mt-1">
          <label class="text-xs" :for="'mem-guide-0'">しきい値:</label>
          <template v-for="i in 3" :key="i">
            <div class="inline-flex items-center gap-1">
              <input :id="'mem-guide-' + (i - 1)" v-model="memGuides[i - 1]" :aria-label="'Memしきい値' + i" type="number"
                inputmode="numeric" pattern="[0-9]*" min="0" step="1" class="w-16 px-1 py-0.5 border rounded text-xs"
                :placeholder="i === 1 ? '例: 800' : ''" />
              <span aria-hidden="true" class="text-xs text-muted">MB</span>
            </div>
          </template>
        </div>
      </figcaption>
      <div class="flex gap-2 mt-1">
        <button type="button" class="px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
          :aria-label="'MemチャートをSVG保存'" @click="exportChart('mem', 'svg')">
          SVG保存
        </button>
        <button type="button" class="px-2 py-0.5 rounded text-xs border focus:outline-none focus-visible:ring"
          :aria-label="'MemチャートをPNG保存'" @click="exportChart('mem', 'png')">
          PNG保存
        </button>
      </div>
      <svg :id="'topchart-svg-mem'" viewBox="0 0 800 160" class="w-full h-40 text-gray-800"
        xmlns="http://www.w3.org/2000/svg" role="img">
        <g v-if="mem.scale" v-html="gridLines(mem.scale)"></g>
        <g v-if="mem.scale" v-html="renderGuides(memGuides, mem.scale, ' MiB')"></g>
        <path v-if="mem.d && showMem" :d="mem.d" fill="none" stroke="currentColor" stroke-width="2" />
        <g v-if="mem.scale && mem.last !== undefined && showMem"
          v-html="rightLabel(mem.scale, mem.last.toFixed(0) + ' MiB')"></g>
      </svg>
    </figure>
  </div>
</template>
