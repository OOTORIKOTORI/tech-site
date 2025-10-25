#!/usr/bin/env node
/**
 * 既存ブログ記事の frontmatter を分析し、
 * type / tool / visibility / robots の割り当て候補を CSV で出力する。
 *
 * Usage:
 *   node scripts/ops/classify-blog-content.mjs > content-classification.csv
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import matter from 'gray-matter'

const CONTENT_BLOG_DIR = 'content/blog'
const OUTPUT_FILE = 'content-classification.csv'

// ツール名マッピング (tags に tool:xxx が含まれる場合に対応)
const TOOL_MAPPING = {
  'tool:cron-jst': 'cron-jst',
  'tool:jwt-decode': 'jwt-decode',
  'tool:jwt-verify': 'jwt-verify',
  'tool:json-formatter': 'json-formatter',
  'tool:regex-tester': 'regex-tester',
  'tool:timestamp-converter': 'timestamp-converter',
  'tool:og-check': 'og-check',
  'tool:site-check': 'site-check',
  'tool:top-analyzer': 'top-analyzer',
}

function classifyContent(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const { data } = matter(content)

  const fileName = basename(filePath, '.md')
  const tags = data.tags || []
  const title = data.title || '(no title)'
  const published = data.published !== false
  const draft = data.draft === true

  // Tool の特定
  let tool = ''
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.startsWith('tool:')) {
      tool = TOOL_MAPPING[tag] || tag.replace('tool:', '')
      break
    }
  }

  // Type の推定
  let type = 'guide' // デフォルトは guide
  if (fileName.endsWith('-basics') || tags.some(t => t === 'primer' || t === '入門')) {
    type = 'primer'
  } else if (tags.some(t => t === 'news' || t === 'お知らせ')) {
    type = 'news'
  } else if (tags.some(t => t === 'reference' || t === 'リファレンス')) {
    type = 'reference'
  }

  // Visibility の推定
  let visibility = 'primer' // デフォルトは primer
  if (draft || !published) {
    visibility = 'hidden'
  } else if (tool && type === 'primer') {
    visibility = 'primer'
  } else if (fileName === 'welcome' || fileName === '_control') {
    visibility = 'hidden'
  } else {
    // ツール関連でない・または primer でない記事は archive 候補
    visibility = 'archive'
  }

  // Robots の推定
  let robots = 'index'
  if (visibility === 'hidden') {
    robots = 'noindex'
  } else if (visibility === 'archive') {
    robots = 'noindex'
  }

  return {
    fileName,
    title,
    tool,
    type,
    visibility,
    robots,
    published,
    draft,
    tags: tags.join('; '),
  }
}

function main() {
  const files = readdirSync(CONTENT_BLOG_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => join(CONTENT_BLOG_DIR, f))

  const results = files.map(f => classifyContent(f))

  // CSV 構築
  const lines = []
  lines.push('fileName,title,tool,type,visibility,robots,published,draft,tags')

  for (const r of results) {
    const row = [
      r.fileName,
      `"${r.title.replace(/"/g, '""')}"`,
      r.tool,
      r.type,
      r.visibility,
      r.robots,
      r.published,
      r.draft,
      `"${r.tags.replace(/"/g, '""')}"`,
    ].join(',')
    lines.push(row)
  }

  // UTF-8 BOM 付きで書き込み
  const csv = '\uFEFF' + lines.join('\n')
  writeFileSync(OUTPUT_FILE, csv, 'utf-8')
  console.log(`✅ ${OUTPUT_FILE} に ${results.length} 件の分類結果を出力しました。`)
}

main()
