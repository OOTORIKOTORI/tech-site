#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const EXTS = ['.ts', '.js', '.vue']
const EXCLUDE = ['node_modules', '.nuxt', '.output', 'dist']
const PATTERN = /import\s*\{[^}]*\bqueryContent\b[^}]*\}\s*from\s*['"]#imports['"]/

function shouldExclude(p) {
  return EXCLUDE.some(ex => p.split(path.sep).includes(ex))
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (shouldExclude(full)) continue
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (EXTS.includes(path.extname(entry.name))) {
      yield full
    }
  }
}

let found = []
for (const file of walk(process.cwd())) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    if (PATTERN.test(line)) {
      found.push(`${file}:${i + 1}: ${line.trim()}`)
    }
  })
}

if (found.length) {
  console.error('Forbidden import of queryContent from #imports found:')
  found.forEach(f => console.error(f))
  process.exit(1)
} else {
  process.exit(0)
}
