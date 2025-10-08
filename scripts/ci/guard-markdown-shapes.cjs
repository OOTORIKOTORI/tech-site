#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const TARGET = path.join('content', 'blog')
const EXTS = ['.md']

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (EXTS.includes(path.extname(entry.name))) {
      yield full
    }
  }
}

// _archive ディレクトリ配下を除外
function isArchived(p) {
  return p.includes('/_archive/') || p.includes('\\_archive\\')
}

let files = Array.from(walk(TARGET))
let targets = files.filter(p => !isArchived(p))

let errors = []
for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  // frontmatter check
  let first3 = lines.slice(0, 3)
  let fmStart = first3.findIndex(l => l.trim() === '---')
  if (fmStart !== -1) {
    let fmEnd = lines.slice(fmStart + 1).findIndex(l => l.trim() === '---')
    if (fmEnd === -1) {
      errors.push(`${file}: frontmatter not closed with ---`)
    }
  }
  // code fence check
  let fenceCount = lines.reduce((acc, l) => acc + (l.trim() === '```' ? 1 : 0), 0)
  if (fenceCount % 2 !== 0) {
    errors.push(`${file}: code fence (\`\`\`) count is odd (${fenceCount})`)
  }
}

if (errors.length) {
  console.error('Markdown shape errors found:')
  errors.forEach(e => console.error(e))
  process.exit(1)
} else {
  process.exit(0)
}
