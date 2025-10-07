// scripts/ci/guard-control-post.cjs
// feed.xml/sitemap.xml から /blog/_control の混入を検知
const fs = require('fs')
const path = require('path')

const targets = [
  ['public/feed.xml', 'dist/public/feed.xml'],
  ['public/sitemap.xml', 'dist/public/sitemap.xml'],
]

let checked = 0
let found = false

for (const [p1, p2] of targets) {
  let file = null
  if (fs.existsSync(p1)) file = p1
  else if (fs.existsSync(p2)) file = p2
  if (!file) continue
  checked++
  const txt = fs.readFileSync(file, 'utf8')
  if (txt.includes('/blog/_control')) {
    console.error(`NG: ${file} に /blog/_control を検出`)
    found = true
  }
}

if (found) process.exit(1)
if (checked === 0) {
  console.warn('feed.xml/sitemap.xml が見つかりません (skip)')
  process.exit(0)
}
console.log('OK: _control not found in feed/sitemap')
process.exit(0)
