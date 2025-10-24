// scripts/fix-frontmatter-open.cjs
const fs = require('fs')
const path = require('path')

const dir = path.join(process.cwd(), 'content', 'blog')
if (!fs.existsSync(dir)) {
  console.error('Directory not found:', dir)
  process.exit(1)
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
let changed = 0

for (const f of files) {
  const fp = path.join(dir, f)
  let s = fs.readFileSync(fp, 'utf8')

  if (!s.startsWith('---\n')) {
    const lines = s.split('\n')

    // Try to locate an early closing fence (within first 100 lines)
    let closeIdx = lines.findIndex((ln, i) => i < 100 && ln.trim() === '---')

    // If there is no closing fence early on, inject one after the frontmatter block
    if (closeIdx === -1) {
      const insertAt = Math.max(
        1,
        lines.findIndex(ln => ln.trim() === '' || ln.trim().startsWith('#'))
      )
      if (insertAt > 0) {
        lines.splice(insertAt, 0, '---')
      } else {
        // Fallback: put at line 1 (after the opening fence we add below)
        lines.splice(1, 0, '---')
      }
      s = lines.join('\n')
    }

    s = `---\n${s}`
    fs.writeFileSync(fp, s)
    console.log('fixed:', f)
    changed++
  }
}

console.log(`done. changed=${changed}/${files.length}`)
