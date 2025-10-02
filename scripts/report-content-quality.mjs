import { writeFileSync, mkdirSync, existsSync } from 'node:fs'

const ORIGIN = process.env.E2E_ORIGIN ?? 'http://localhost:3000'

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function fetchJson(path) {
  const res = await fetch(`${ORIGIN}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return await res.json()
}

// RegExp literals（tests/content/quality.blog.spec.ts と整合）
const reImgAlt = /!\[([^\]]+)\]\(([^)]+)\)/u
const reBareFence = /^```[ \t]*$/m
const reAudience = /(誰に|対象|想定読者|前提)/u
const reBenefit = /(わかる|できる|身につく|理解|設計できる|使える)/u
const reGlossary = /^[^\S\r\n]*[\p{L}\p{N}_-]+\s*[:：]\s+/mu
const reInternal = /\]\(\/[^)]+\)/m
const reExternal = /\]\(https?:\/\/[^)]+\)/m

function stripHtml(input) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
}

function toPlain(body) {
  if (body && typeof body === 'object') {
    const out = []
    const visit = n => {
      if (!n || typeof n !== 'object') return
      if (n.type === 'text' && typeof n.value === 'string') out.push(n.value)
      if (Array.isArray(n.children)) n.children.forEach(visit)
    }
    if (Array.isArray(body.children)) body.children.forEach(visit)
    if (out.length) return out.join(' ')
  }
  if (typeof body === 'string') return stripHtml(body)
  return ''
}

function hasH2(docBody, plain) {
  if (docBody && Array.isArray(docBody.children)) {
    const found = docBody.children.some(n => n && n.tag && /^h[2-6]$/.test(n.tag))
    if (found) return true
  }
  if (/^##\s+/m.test(plain)) return true
  return false
}

function getLinks(doc) {
  let internal = 0
  let external = 0
  const visit = n => {
    if (!n || typeof n !== 'object') return
    if (n.tag === 'a' && n.props && typeof n.props.href === 'string') {
      const href = n.props.href
      if (href.startsWith('/')) internal++
      else if (/^https?:\/\//.test(href)) external++
    }
    if (Array.isArray(n.children)) n.children.forEach(visit)
  }
  if (doc?.body?.children) doc.body.children.forEach(visit)
  const mdRaw = String(doc?.bodyRaw || '')
  if (reInternal.test(mdRaw)) internal++
  if (reExternal.test(mdRaw)) external++
  return { internal, external }
}

function imagesHaveAlt(md) {
  const matches = [...String(md).matchAll(reImgAlt)]
  return matches.every(m => (m[1] || '').trim().length > 0)
}

function codeFencesHaveLang(md) {
  const s = String(md)
  if (reBareFence.test(s)) return false
  const fences = s.match(/```[^\n]*\n/g) || []
  return fences.every(f => /```\s*([a-zA-Z][^\s`]*)/.test(f))
}

function sliceIntro(s) {
  return String(s).slice(0, 300)
}

function hasIntroExpectations(intro) {
  return reAudience.test(intro) && reBenefit.test(intro)
}

function wordLen(s) {
  return String(s).length
}

async function main() {
  const ok = await headOk(ORIGIN)
  if (!ok) {
    console.warn('[report] origin not reachable, skip report generation:', ORIGIN)
    process.exit(0)
  }

  const { blog } = await fetchJson('/api/blogv2/list')

  const rows = []
  for (const { path } of blog) {
    const doc = await fetchJson(`/api/blogv2/doc?path=${encodeURIComponent(path)}`)
    const plain = toPlain(doc.body || '')
    const title = String(doc.title || '')
    const description = String(doc.description || '')
    const date = String(doc.date || '')

    const mustFails = []
    const shouldWarns = []

    const tLen = wordLen(title)
    const dLen = wordLen(description)
    if (!(tLen >= 32 && tLen <= 60)) mustFails.push(`title length ${tLen}`)
    if (!(dLen >= 120 && dLen <= 160)) mustFails.push(`description length ${dLen}`)
    if (!date) mustFails.push('date missing')

    const intro = sliceIntro(plain)
    if (!hasIntroExpectations(intro)) mustFails.push('intro expectations missing')
    if (!hasH2(doc.body, doc.bodyText || plain)) mustFails.push('no h2+ heading')

    // glossary
    const lines = plain.split(/\r?\n/)
    let cnt = 0
    for (const ln of lines) if (reGlossary.test(ln)) cnt++
    if (!(/(用語|用語集|ミニ辞典|Glossary)/.test(plain) || cnt >= 2)) {
      mustFails.push('terminology missing')
    }

    const { internal, external } = getLinks(doc)
    if (internal < 1) mustFails.push('no internal link')
    if (external < 1) mustFails.push('no external link')

    const mdRaw = String(doc.bodyRaw || '')
    if (mdRaw) {
      if (!codeFencesHaveLang(mdRaw)) mustFails.push('code block without language')
      if (!imagesHaveAlt(mdRaw)) mustFails.push('image alt empty')
    }

    // Shoulds
    const introLen = wordLen(intro)
    if (!(introLen >= 100 && introLen <= 300)) shouldWarns.push(`intro length ${introLen}`)
    const hasSummary = /^(##\s*(まとめ|結論|次に読む|Next))/m.test(doc.bodyText || plain)
    if (!hasSummary) shouldWarns.push('no summary/next section')

    // image presence
    const hasImage = /!\[[^\]]*\]\([^)]+\)|<img\b/i.test(mdRaw)
    if (!hasImage) shouldWarns.push('no images')

    const tags = Array.isArray(doc.tags) ? doc.tags : []
    if (!(tags.length >= 3 && tags.length <= 5)) shouldWarns.push(`tags ${tags.length}`)

    rows.push({
      path,
      title,
      must: mustFails.length,
      warn: shouldWarns.length,
      summary: [...mustFails, ...shouldWarns].join('; '),
    })
  }

  const lines = []
  lines.push('# Content Quality Report')
  lines.push('')
  lines.push(`Origin: ${ORIGIN}`)
  lines.push('')
  lines.push('| path | title | Must NG | Should WARN | 指摘サマリ |')
  lines.push('|---|---|---:|---:|---|')
  for (const r of rows) {
    const safeTitle = String(r.title).replace(/\|/g, '\\|')
    const safeSummary = String(r.summary).replace(/\|/g, '\\|')
    lines.push(`| ${r.path} | ${safeTitle} | ${r.must} | ${r.warn} | ${safeSummary} |`)
  }

  if (!existsSync('reports')) mkdirSync('reports', { recursive: true })
  writeFileSync('reports/content-quality.md', lines.join('\n'), 'utf8')
  console.log('[report] wrote reports/content-quality.md with %d rows', rows.length)
}

main().catch(err => {
  console.error('[report] failed:', err)
  process.exit(1)
})
