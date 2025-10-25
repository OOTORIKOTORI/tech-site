#!/usr/bin/env node
/**
 * 主要ツールページに PrimerCardList を追加する
 *
 * Usage:
 *   node scripts/ops/add-primer-cards.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TOOLS_DIR = 'pages/tools'

// ツールID → ファイル名のマッピング
const TOOLS = [
  { id: 'og-check', file: 'og-check.vue' },
  { id: 'regex-tester', file: 'regex-tester.vue' },
  { id: 'json-formatter', file: 'json-formatter.vue' },
  { id: 'site-check', file: 'site-check.vue' },
  { id: 'top-analyzer', file: 'top-analyzer.vue' },
  { id: 'timestamp', file: 'timestamp.vue' },
]

function addPrimerCard(toolId, filePath) {
  const content = readFileSync(filePath, 'utf-8')

  // 既に PrimerCardList が含まれている場合はスキップ
  if (content.includes('PrimerCardList')) {
    console.log(`⏭️  ${toolId}: 既に PrimerCardList が存在します`)
    return false
  }

  // </template> の直前に PrimerCardList を挿入
  const templateEndRegex = /([ ]*)<\/template>/
  const match = content.match(templateEndRegex)

  if (!match) {
    console.error(`❌ ${toolId}: </template> が見つかりません`)
    return false
  }

  const indent = match[1]
  const primerCardHTML = `${indent}  <PrimerCardList v-if="showPrimers" tool-id="${toolId}" />\n${indent}</template>`
  const updatedContent = content.replace(templateEndRegex, primerCardHTML)

  // <script setup> の最後に defineAsyncComponent を追加
  const scriptSetupRegex =
    /(<script setup[^>]*>[\s\S]*?)((?:const|let|var|function|import)\s+\w+[\s\S]*?)(<\/script>)/
  const scriptMatch = updatedContent.match(scriptSetupRegex)

  let finalContent = updatedContent

  if (scriptMatch) {
    const beforeScript = scriptMatch[1]
    const scriptBody = scriptMatch[2]
    const closeTag = scriptMatch[3]

    // showPrimers と PrimerCardList を追加
    const additions = `
// Primer カードリスト（非同期）
const showPrimers = ref(true)
const PrimerCardList = defineAsyncComponent({ loader: () => import('@/components/PrimerCardList.vue'), suspensible: false })
`

    finalContent = beforeScript + scriptBody + additions + '\n' + closeTag
  } else {
    console.error(`❌ ${toolId}: <script setup> が見つかりません`)
    return false
  }

  // ref, defineAsyncComponent のインポートを確認
  if (!finalContent.includes("from 'vue'") && !finalContent.includes('from "vue"')) {
    // vue のインポートを追加
    finalContent = finalContent.replace(
      /(<script setup[^>]*>)/,
      "$1\nimport { ref, defineAsyncComponent } from 'vue'\n"
    )
  } else {
    // 既存のインポートに ref, defineAsyncComponent を追加
    if (!finalContent.includes(' ref,') && !finalContent.includes(' ref ')) {
      finalContent = finalContent.replace(/(import\s+{[^}]*)(}\s+from\s+['"]vue['"])/, '$1, ref$2')
    }
    if (!finalContent.includes('defineAsyncComponent')) {
      finalContent = finalContent.replace(
        /(import\s+{[^}]*)(}\s+from\s+['"]vue['"])/,
        '$1, defineAsyncComponent$2'
      )
    }
  }

  writeFileSync(filePath, finalContent, 'utf-8')
  console.log(`✅ ${toolId}: PrimerCardList を追加しました`)
  return true
}

function main() {
  let added = 0
  let skipped = 0

  for (const tool of TOOLS) {
    const filePath = join(TOOLS_DIR, tool.file)
    try {
      const result = addPrimerCard(tool.id, filePath)
      if (result) {
        added++
      } else {
        skipped++
      }
    } catch (error) {
      console.error(`❌ ${tool.id}: エラー - ${error.message}`)
    }
  }

  console.log(`\n🎉 ${added} 件追加、${skipped} 件スキップしました。`)
}

main()
