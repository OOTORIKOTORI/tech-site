// scripts/migrate-blog-template.cjs
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')

/** すべての .md を再帰的に列挙 */
function listMd(dir) {
  const out = []
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) out.push(...listMd(p))
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

function splitFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { fm: '', body: src, hasFm: false }
  return { fm: m[1], body: m[2], hasFm: true }
}

function ensureKey(lines, key, value) {
  const has = lines.some(l => l.trim().startsWith(`${key}:`))
  if (!has) lines.splice(0, 0, `${key}: ${value}`)
}

function migrateOne(file) {
  const src = fs.readFileSync(file, 'utf8')
  const { fm, body, hasFm } = splitFrontmatter(src)

  // FM を行配列化（無ければ新規作成）
  const fmLines = hasFm ? fm.split('\n') : []
  if (!hasFm) {
    fmLines.push(
      'title: ""',
      'description: ""',
      `publishedAt: "${new Date().toISOString().slice(0, 10)}"`
    )
  }

  // audience / for / benefits の補完
  ensureKey(fmLines, 'audience', '["初心者","中級者"]')
  ensureKey(fmLines, 'for', '""')
  ensureKey(fmLines, 'benefits', '""')

  const newFm = `---\n${fmLines.join('\n')}\n---\n`

  // 本文先頭への導入挿入（既に存在すればスキップ）
  const hasWho = /この記事はこういう人におすすめ|誰に向けた|対象読者/.test(body)
  const hasGain = /この記事で得られること|メリット|学べること/.test(body)
  let newBody = body

  const intro = []
  if (!hasWho) {
    intro.push('> **この記事はこういう人におすすめ**: （for）')
  }
  if (!hasGain) {
    intro.push('> **この記事で得られること**: （benefits）')
  }
  if (intro.length) {
    newBody = intro.join('\n') + '\n\n' + body
  }

  const out = newFm + newBody
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8')
    return true
  }
  return false
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) return console.error('No content/blog directory')
  const files = listMd(BLOG_DIR)
  let changed = 0
  for (const f of files) if (migrateOne(f)) changed++
  console.log(`migrated: ${changed}/${files.length}`)
}
main()
