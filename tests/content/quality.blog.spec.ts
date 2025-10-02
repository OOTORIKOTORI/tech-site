import { describe, it, expect } from 'vitest'

const ORIGIN = process.env.E2E_ORIGIN ?? 'http://localhost:3000'

function headOk(url: string) {
  return fetch(url, { method: 'HEAD' })
    .then(res => res.ok)
    .catch(() => false)
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${ORIGIN}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return (await res.json()) as T
}

// RegExp literals
// 画像 alt 必須
const reImgAlt = /!\[([^\]]+)\]\(([^)]+)\)/u
// 未指定フェンス検出（行頭の ``` 単独）
const reBareFence = /^```[ \t]*$/m
// 導入の“対象読者/得られること”キーワード
const reAudience = /(誰に|対象|想定読者|前提)/u
const reBenefit = /(わかる|できる|身につく|理解|設計できる|使える)/u
// 「語: 説明」形式（Unicode 文字/数字 + _- を許可）
const reGlossary = /^[^\S\r\n]*[\p{L}\p{N}_-]+\s*[:：]\s+/mu
// 内部/外部リンク（Markdownリンク）
const reInternal = /\]\(\/[^)]+\)/m
const reExternal = /\]\(https?:\/\/[^)]+\)/m

// naive strip tags (no external deps)
function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
}

function toPlain(body: any): string {
  // AST (Nuxt Content) like: { type, tag, children, value }
  if (body && typeof body === 'object') {
    const out: string[] = []
    const visit = (n: any) => {
      if (!n || typeof n !== 'object') return
      if (n.type === 'text' && typeof n.value === 'string') out.push(n.value)
      if (Array.isArray(n.children)) n.children.forEach(visit)
    }
    if (Array.isArray(body.children)) body.children.forEach(visit)
    if (out.length) return out.join(' ')
  }
  // fallback: string/HTML
  if (typeof body === 'string') return stripHtml(body)
  return ''
}

function countSentences(text: string): string[] {
  const segs = text
    .split(/[。！？!?]/)
    .map(s => s.trim())
    .filter(Boolean)
  return segs
}

function hasH2(body: any, plain: string): boolean {
  // AST based
  if (body && Array.isArray(body.children)) {
    const found = body.children.some((n: any) => n && n.tag && /^h[2-6]$/.test(n.tag))
    if (found) return true
  }
  // Plain markdown-ish
  if (/^##\s+/m.test(plain)) return true
  return false
}

function getLinksFromDoc(doc: any): { internal: number; external: number } {
  let internal = 0
  let external = 0
  // From body AST
  const visit = (n: any) => {
    if (!n || typeof n !== 'object') return
    if (n.tag === 'a' && n.props && typeof n.props.href === 'string') {
      const href = n.props.href as string
      if (href.startsWith('/')) internal++
      else if (/^https?:\/\//.test(href)) external++
    }
    if (Array.isArray(n.children)) n.children.forEach(visit)
  }
  if (doc?.body?.children) (doc.body.children as any[]).forEach(visit)
  // Fallback: Markdown/plain からの簡易検出
  const mdRaw = String(doc?.bodyRaw || '')
  if (reInternal.test(mdRaw)) internal++
  if (reExternal.test(mdRaw)) external++
  return { internal, external }
}

function hasGlossary(doc: any, plain: string): boolean {
  // Heading containing keywords
  const kw = /(用語|用語集|ミニ辞典|Glossary)/
  if (
    doc?.body?.children?.some(
      (n: any) =>
        n?.tag?.startsWith('h') && kw.test(n?.children?.map((c: any) => c?.value || '').join(' '))
    )
  ) {
    return true
  }
  if (kw.test(plain)) return true
  // Bullet lines like "Term: desc" x2
  const lines = plain.split(/\r?\n/)
  let cnt = 0
  for (const ln of lines) if (reGlossary.test(ln)) cnt++
  return cnt >= 2
}

function codeFencesHaveLang(md: string): boolean {
  // 未指定フェンスがあればNG
  if (reBareFence.test(md)) return false
  // ```lang or ```ts/js/sh/bash etc. Allow optional [meta]
  const fences = md.match(/```[^\n]*\n/g) || []
  return fences.every(f => /```\s*([a-zA-Z][^\s`]*)/.test(f))
}

function extractParagraphByLabel(mdRaw: string, labelRe: RegExp): string | null {
  const idx = mdRaw.search(labelRe)
  if (idx === -1) return null
  const rest = mdRaw.slice(idx)
  const parts = rest.split(/\r?\n\r?\n/)
  if (!parts || parts.length === 0 || !parts[0]) return null
  return parts[0].trim()
}

function extractSectionByHeading(mdRaw: string, headingRe: RegExp): string | null {
  const m = mdRaw.match(headingRe)
  if (!m || !m.index) return null
  const start = m.index
  const after = mdRaw.slice(start)
  // split at next heading (lookahead for line starting with #)
  const parts = after.split(/\r?\n(?=#{1,6}\s)/)
  if (!parts || parts.length === 0 || !parts[0]) return null
  return parts[0].trim()
}

function imagesHaveAlt(md: string): boolean {
  // ![alt](src) — altは空でないこと
  const matches = [...md.matchAll(reImgAlt)]
  return matches.every(m => (m[1] || '').trim().length > 0)
}

function wordLen(s: string) {
  return s.length
}

function sliceIntro(s: string) {
  return s.slice(0, 300)
}

function hasIntroExpectations(intro: string) {
  return reAudience.test(intro) && reBenefit.test(intro)
}

describe('CQ-QUALITY — ブログ内容の品質チェック（Must/Should）', () => {
  it('validates all blog posts', async () => {
    const ok = await headOk(ORIGIN)
    if (!ok) {
      // 未起動時はスキップ（テスト本体を早期return）
      return
    }

    const { blog } = await fetchJson<{ blog: Array<{ path: string }> }>('/api/blogv2/list')

    const results: Array<{
      path: string
      title: string
      mustFails: string[]
      shouldWarns: string[]
    }> = []

    for (const { path } of blog) {
      const doc = await fetchJson<any>(`/api/blogv2/doc?path=${encodeURIComponent(path)}`)
      const plain = toPlain(doc.body || '')

      // Frontmatter-like fields from doc
      const title = String(doc.title || '')
      const description = String(doc.description || '')
      const date = String(doc.date || '')

      const mustFails: string[] = []
      const shouldWarns: string[] = []

      // 1) frontmatter
      const tLen = wordLen(title)
      const dLen = wordLen(description)
      if (!(tLen >= 32 && tLen <= 60)) mustFails.push(`title length ${tLen}`)
      if (!(dLen >= 120 && dLen <= 160)) mustFails.push(`description length ${dLen}`)
      if (!date) mustFails.push('date missing')

      // 2) intro expectations
      const intro = sliceIntro(plain)
      if (!hasIntroExpectations(intro)) mustFails.push('intro expectations missing')

      // 3) headings h2+
      if (!hasH2(doc.body, doc.bodyText || plain)) mustFails.push('no h2+ heading')

      // 4) glossary / terminology care
      if (!hasGlossary(doc, plain)) mustFails.push('terminology missing')

      // 5) links: internal+external
      const { internal, external } = getLinksFromDoc(doc)
      if (internal < 1) mustFails.push('no internal link')
      if (external < 1) mustFails.push('no external link')

      // 6) code-fence language & images alt
      const mdRaw = String(doc.bodyRaw || '')
      if (mdRaw) {
        if (!codeFencesHaveLang(mdRaw)) mustFails.push('code block without language')
        if (!imagesHaveAlt(mdRaw)) mustFails.push('image alt empty')
      }

      // 7) terminology placement rules (new)
      // Must: audience block must not contain <Term
      const audiencePara = extractParagraphByLabel(
        mdRaw,
        /^(\*\*|)対象読者|^この記事で得られること/m
      )
      if (audiencePara && /<Term\s+/.test(audiencePara)) {
        mustFails.push('audience contains <Term>')
      }

      // Must: glossary section must not contain <Term
      const glossarySection = extractSectionByHeading(
        mdRaw,
        /^#{1,6}\s*(用語|用語集|ミニ辞典|Glossary)/m
      )
      if (glossarySection && /<Term\s+/.test(glossarySection)) {
        mustFails.push('glossary contains <Term>')
      }

      // Should: if glossary section exists, it should use <Glossary />
      if (glossarySection) {
        if (!/<Glossary\s*\/>/.test(glossarySection) && !/<Glossary\b/.test(mdRaw)) {
          shouldWarns.push('glossary section present but <Glossary /> not used')
        }
      }

      // Shoulds
      // S1) intro 100–300
      const introLen = wordLen(sliceIntro(plain))
      if (!(introLen >= 100 && introLen <= 300)) shouldWarns.push(`intro length ${introLen}`)

      // S2) まとめ/次アクション節
      const hasSummary = /^(##\s*(まとめ|結論|次に読む|Next))/m.test(doc.bodyText || plain)
      if (!hasSummary) shouldWarns.push('no summary/next section')

      // S3) sentence length distribution
      const sentences = countSentences(plain)
      if (sentences.length) {
        const long = sentences.filter(s => wordLen(s) > 70).length
        const ratio = (long / sentences.length) * 100
        if (ratio >= 30) shouldWarns.push(`long sentences ${ratio.toFixed(1)}%`)
      }

      // S4) images
      const hasImage = /!\[[^\]]*\]\([^)]+\)|<img\b/i.test(mdRaw)
      if (!hasImage) shouldWarns.push('no images')

      // S5) tags 3–5
      const tags = Array.isArray(doc.tags) ? doc.tags : []
      if (!(tags.length >= 3 && tags.length <= 5)) shouldWarns.push(`tags ${tags.length}`)

      results.push({ path, title, mustFails, shouldWarns })
    }

    const fails = results.filter(r => r.mustFails.length > 0)
    if (fails.length) {
      console.error('\n[QUALITY: FAIL] Must違反が見つかりました')
      console.table(
        fails.map(f => ({ path: f.path, title: f.title, must: f.mustFails.join(', ') }))
      )
      expect(fails, 'Must違反はゼロであること').toEqual([])
    } else {
      console.log('\n[QUALITY: PASS] 全記事のMustを満たしました。スコア表:')
      console.table(
        results.map(r => ({
          path: r.path,
          title: r.title,
          mustFails: 0,
          shouldWarns: r.shouldWarns.length,
        }))
      )
    }

    const warns = results.filter(r => r.shouldWarns.length > 0)
    if (warns.length) {
      console.warn('\n[QUALITY: WARN] Should指標の改善余地があります:')
      console.table(warns.map(w => ({ path: w.path, warns: w.shouldWarns.join(', ') })))
    }
  })
})
