#!/usr/bin/env node
/**
 * CI Guard: Prevent internal-only references in public blog content
 *
 * Scans content/blog/**\/*.md and fails if any internal-only patterns are found:
 * - HANDBOOK
 * - /docs/HANDBOOK
 * - internal-only
 * - 社内向け
 */

const fs = require('fs')
const path = require('path')

// Recursively find all .md files in content/blog
function findMarkdownFiles(dir) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }

  return results
}

const blogDir = path.resolve(process.cwd(), 'content/blog')
if (!fs.existsSync(blogDir)) {
  console.log('[guard-blog-no-internal] SKIP: content/blog does not exist')
  process.exit(0)
}

const files = findMarkdownFiles(blogDir)

// Pattern to detect internal-only references
const internalPattern = /(HANDBOOK|\/docs\/HANDBOOK|internal-only|社内向け)/i

let hasViolation = false

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    if (internalPattern.test(line)) {
      const relativePath = path.relative(process.cwd(), file)
      console.error(`[guard-blog-no-internal] NG: ${relativePath}:${index + 1}`)
      console.error(`  → ${line.trim()}`)
      hasViolation = true
    }
  })
}

if (hasViolation) {
  console.error(
    '\n[guard-blog-no-internal] FAIL: Public blog must not include internal-only references.'
  )
  process.exit(1)
}

console.log('[guard-blog-no-internal] OK: No internal references found in public blog content.')
