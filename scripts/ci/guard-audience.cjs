#!/usr/bin/env node
// content/blog/**/*.md の frontmatter に audience が無い場合に警告
let glob
let matter
try {
  glob = require('glob')
  matter = require('gray-matter')
} catch (e) {
  console.warn('guard-audience: glob/gray-matter が無いためスキップします (optional).')
  process.exit(0)
}
const fs = require('fs')

const strict = process.argv.includes('--strict')
const files = glob.sync('content/blog/**/*.md', { nodir: true })
let missing = []
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const fm = matter(src).data
  if (!('audience' in fm)) missing.push(file)
}
if (missing.length) {
  console.warn(
    `WARNING: audience フィールドが無いファイル:\n` + missing.map(f => `  - ${f}`).join('\n')
  )
  if (strict) process.exit(1)
}
process.exit(0)
