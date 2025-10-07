// scripts/ci/guard-relative-fetch.cjs
// SSR 500 の温床になる相対 fetch の静的検知
const fs = require('fs')
const path = require('path')

const IGNORE_DIRS = ['node_modules', '.nuxt', '.output', 'dist']
const exts = ['.ts', '.tsx', '.js', '.vue']
const NG_PATTERNS = [/\$fetch\(\s*['"]/, /ofetch\(\s*['"]/]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.includes(entry.name)) continue
      walk(path.join(dir, entry.name), files)
    } else if (exts.some(e => entry.name.endsWith(e))) {
      files.push(path.join(dir, entry.name))
    }
  }
  return files
}

const root = process.cwd()
const files = walk(root)
let ngs = []
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const pat of NG_PATTERNS) {
      if (pat.test(line)) {
        ngs.push(`${file}:${i + 1}: ${line.trim()}`)
      }
    }
  })
}

if (ngs.length) {
  console.error('NG: 相対 fetch 検出')
  ngs.forEach(x => console.error(x))
  process.exit(1)
}
console.log('OK: no relative fetch found')
process.exit(0)
