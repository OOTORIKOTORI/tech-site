#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const DRY = process.argv.includes('--dry-run')
const ROOT = process.cwd()
const BLOG_DIR = join(ROOT, 'content', 'blog')

function walkDir(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => join(dir, e.name))
}

function log(...args) {
  console.log('[inject-terms]', ...args)
}

// Heuristics for exclusion zones
const headingRe = /^#{1,6}\s/ // headings
const listRe = /^[\s]*([-*+]\s|\d+\.)/ // lists
const blockquoteRe = /^\s*>/ // quotes
const codeFenceRe = /^\s*```/ // fence
const inlineCodeRe = /(`[^`]+`)/ // inline code
const linkTextRe = /\[[^\]]+\]\([^\)]+\)/ // markdown links

// Paragraph is a contiguous block of non-empty lines separated by blank lines
function splitParagraphs(text) {
  const lines = text.split(/\r?\n/)
  const paras = []
  let cur = []
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) {
        paras.push(cur.join('\n'))
        cur = []
      } else {
        paras.push('')
      }
    } else {
      cur.push(l)
    }
  }
  if (cur.length) paras.push(cur.join('\n'))
  return paras
}

function shouldExcludeParagraph(p) {
  const firstLine = p.split(/\r?\n/)[0] || ''
  if (headingRe.test(firstLine)) return true
  if (listRe.test(firstLine)) return true
  if (blockquoteRe.test(firstLine)) return true
  if (codeFenceRe.test(firstLine)) return true
  return false
}

function isInGlossarySection(fullText, paraIndex) {
  // find heading positions
  const lines = fullText.split(/\r?\n/)
  let lineNo = 0
  let paraLineRanges = []
  // build paragraph ranges (startLine, endLine)
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      if (i > start) {
        paraLineRanges.push([start, i - 1])
      }
      start = i + 1
    }
  }
  if (start < lines.length) paraLineRanges.push([start, lines.length - 1])

  // find glossary heading line
  const glossaryHeadingIdx = lines.findIndex(
    l => /^#{1,6}\s+用語(mini辞典|ミニ辞典|用語集|Glossary)/.test(l) || /^#{1,6}\s+用語/.test(l)
  )
  if (glossaryHeadingIdx === -1) return false

  // find next heading after glossary
  const nextHeadingIdx = lines.slice(glossaryHeadingIdx + 1).findIndex(l => headingRe.test(l))
  const endIdx =
    nextHeadingIdx === -1 ? lines.length - 1 : glossaryHeadingIdx + 1 + nextHeadingIdx - 0

  const [pStart, pEnd] = paraLineRanges[paraIndex] || [0, 0]
  return pStart >= glossaryHeadingIdx && pStart <= endIdx
}

function processFile(file) {
  const raw = readFileSync(file, 'utf8')
  const paras = splitParagraphs(raw)
  const out = []
  let changed = false

  // pre-scan to detect existing <Term and <Glossary - if present, skip inserting for that token
  const hasAnyTerm = /<Term\s+/.test(raw)

  for (let i = 0; i < paras.length; i++) {
    const p = paras[i]
    if (p === '') {
      out.push('')
      continue
    }

    // Exclude paragraphs that are headings, lists, blockquotes, code fences, or start with the target lines
    const firstLine = p.split(/\r?\n/)[0] || ''
    const lowerFirst = firstLine.trim().toLowerCase()
    if (
      /^対象読者/.test(firstLine) ||
      /^\*\*対象読者\*\*/.test(firstLine) ||
      /^\*\*この記事で得られること\*\*/.test(firstLine) ||
      /^この記事で得られること/.test(firstLine)
    ) {
      log('skip paragraph (audience/what-you-get):', file, 'line:', firstLine.replace(/\n/g, ' '))
      out.push(p)
      continue
    }

    if (shouldExcludeParagraph(p)) {
      log('skip paragraph (structural):', file, 'firstLine:', firstLine.replace(/\n/g, ' '))
      out.push(p)
      continue
    }

    // skip paragraphs within glossary section
    if (isInGlossarySection(raw, i)) {
      log('skip paragraph (in glossary section):', file)
      out.push(p)
      continue
    }

    // Skip if paragraph already contains Term or Glossary tag
    if (/<Term\s+|<Glossary\s*\/>|<Glossary\b/.test(p)) {
      log('skip paragraph (already contains Term/Glossary):', file)
      out.push(p)
      continue
    }

    // Do not inject into paragraphs that contain links, inline code, or backtick runs
    if (linkTextRe.test(p) || inlineCodeRe.test(p) || /`{3,}/.test(p)) {
      log('skip paragraph (contains link/code):', file)
      out.push(p)
      continue
    }

    // Idempotent insertion: insert each term at most once by checking global file-level flag
    if (hasAnyTerm) {
      log('skip injection (file already has <Term/>):', file)
      out.push(p)
      continue
    }

    // Simple tokenization: find candidate tokens (ASCII words of 2+ chars, excluding all-caps acronyms of length 1)
    // For demo purposes, inject a generic <Term k="TOKEN" /> after first occurrence of 'JWT' or 'token' etc.
    let newP = p
    if (/\bJWT\b/.test(p)) {
      newP = p.replace(/\bJWT\b/, '<Term k="JWT" />')
      changed = true
      log('inject: JWT ->', file)
    } else if (/\btoken\b/i.test(p)) {
      newP = p.replace(/\b(token)\b/i, '<Term k="$1" />')
      changed = true
      log('inject: token ->', file)
    }

    out.push(newP)
  }

  const result = out.join('\n\n')
  if (changed) {
    if (DRY) {
      log('[dry-run] would update:', file)
    } else {
      writeFileSync(file, result, 'utf8')
      log('updated:', file)
    }
  } else {
    log('no changes for', file)
  }
}

function main() {
  const files = walkDir(BLOG_DIR)
  if (files.length === 0) {
    log('no blog markdown files found in', BLOG_DIR)
    return
  }
  for (const f of files) processFile(f)
}

main()
