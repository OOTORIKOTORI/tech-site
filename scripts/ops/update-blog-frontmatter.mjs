#!/usr/bin/env node
/**
 * content-classification.csv を基に、
 * 既存ブログ記事の frontmatter に type/tool/visibility/robots を追加する。
 *
 * Usage:
 *   node scripts/ops/update-blog-frontmatter.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'

const CSV_FILE = 'content-classification.csv'
const CONTENT_BLOG_DIR = 'content/blog'

function parseCSV(csvPath) {
  const content = readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  const header = lines[0].split(',')

  const records = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const record = {}
    header.forEach((key, idx) => {
      record[key.trim()] = values[idx] || ''
    })
    records.push(record)
  }

  return records
}

function updateFrontmatter(filePath, updates) {
  const content = readFileSync(filePath, 'utf-8')
  const { data, content: markdownContent } = matter(content)

  // 更新データをマージ
  const updated = {
    ...data,
    type: updates.type || data.type,
    tool: updates.tool || data.tool || undefined,
    visibility: updates.visibility || data.visibility,
    robots: updates.robots || data.robots,
  }

  // undefined のキーを削除
  Object.keys(updated).forEach(key => {
    if (updated[key] === undefined || updated[key] === '') {
      delete updated[key]
    }
  })

  // frontmatter を再構築
  const newContent = matter.stringify(markdownContent, updated)
  writeFileSync(filePath, newContent, 'utf-8')
}

function main() {
  const records = parseCSV(CSV_FILE)
  let updated = 0

  for (const record of records) {
    const fileName = record.fileName
    const filePath = join(CONTENT_BLOG_DIR, `${fileName}.md`)

    try {
      updateFrontmatter(filePath, {
        type: record.type,
        tool: record.tool,
        visibility: record.visibility,
        robots: record.robots,
      })
      updated++
      console.log(`✅ ${fileName}.md を更新しました`)
    } catch (error) {
      console.error(`❌ ${fileName}.md の更新に失敗: ${error.message}`)
    }
  }

  console.log(`\n🎉 ${updated} 件のファイルを更新しました。`)
}

main()
