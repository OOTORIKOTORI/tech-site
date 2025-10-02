<template>
  <section v-if="entries.length" class="mt-6 prose-sm">
    <h3 class="text-sm font-semibold">用語ミニ辞典（簡易）</h3>
    <dl class="mt-2 divide-y">
      <template v-for="(v, k) in entries" :key="k">
        <div class="py-2">
          <dt class="font-medium">{{ k }}</dt>
          <dd class="mt-1 text-sm">
            <template v-for="(part, i) in splitParts(String(v))" :key="i">
              <code v-if="part.code">{{ part.text }}</code>
              <span v-else>{{ part.text }}</span>
            </template>
          </dd>
        </div>
      </template>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'

const local = inject<Record<string, string> | undefined>('localGlossary', {})

const entries = computed(() => {
  if (!local) return []
  // sort keys ascending
  return Object.keys(local)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .reduce((acc: Record<string, string>, k) => {
      acc[k] = (local as Record<string, string>)[k] ?? ''
      return acc
    }, {})
})

// split a string into parts where inline backticks `code` become {code:true, text}
function splitParts(s: string | undefined) {
  const str = s || ''
  const parts: Array<{ code: boolean; text: string }> = []
  const re = /`([^`]+)`/g
  let lastIndex = 0
  let m
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(str)) !== null) {
    if (m.index > lastIndex) parts.push({ code: false, text: str.slice(lastIndex, m.index) })
    parts.push({ code: true, text: m[1] ?? '' })
    lastIndex = re.lastIndex
  }
  if (lastIndex < str.length) parts.push({ code: false, text: str.slice(lastIndex) })
  return parts
}
</script>

<style scoped>
.divide-y> :not([hidden])~ :not([hidden]) {
  border-top-width: 1px;
}
</style>
