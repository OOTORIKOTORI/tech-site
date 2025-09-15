// utils/cron.ts
// Cron 5フィールド（分 時 日 月 曜日）をパース & 次回時刻を算出
// 仕様: 数値, 範囲 a-b, ステップ */s および a-b/s, カンマ区切り, '*' サポート
// DOW: 0=日(7も日として扱う) 1=月 ... 6=土

export type CronSpec = {
  mins: number[]
  hours: number[]
  dom: number[]       // 1..31
  months: number[]    // 1..12
  dow: number[]       // 0..6 (0 or 7 は 0 に正規化)
}

/** 重複排除して昇順に整列 */
function uniqSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => a - b)
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/** 1..N の配列 */
function range(lo: number, hi: number, step = 1) {
  const out: number[] = []
  for (let v = lo; v <= hi; v += step) out.push(v)
  return out
}

/** 1トークンを展開（例: "*", "*/5", "10", "10-20", "10-20/2"） */
function expandToken(
  tok: string,
  lo: number,
  hi: number
): number[] {
  if (tok === '*') return range(lo, hi)

  // */s
  const stepOnly = tok.match(/^\*\/(\d+)$/)
  if (stepOnly) {
    const s = Math.max(1, Number(stepOnly[1]))
    return range(lo, hi, s)
  }

  // a-b(/s)?
  const m = tok.match(/^(\d+)-(\d+)(?:\/(\d+))?$/)
  if (m) {
    const a = clamp(Number(m[1]), lo, hi)
    const b = clamp(Number(m[2]), lo, hi)
    const s = Math.max(1, Number(m[3] ?? 1))
    const from = Math.min(a, b)
    const to = Math.max(a, b)
    return range(from, to, s)
  }

  // 単一数値
  const n = Number(tok)
  if (Number.isFinite(n)) return [clamp(n, lo, hi)]

  return []
}

/** フィールド文字列を配列へ展開（カンマでマージ） */
function expandField(s: string, lo: number, hi: number): number[] {
  const parts = s.split(',').map(t => t.trim()).filter(Boolean)
  const all: number[] = []
  for (const p of parts) all.push(...expandToken(p, lo, hi))
  return uniqSorted(all.length ? all : range(lo, hi))
}

/** public: Cron文字列を構造体へ */
export function parseCron(expr: string): CronSpec {
  const f = expr.trim().split(/\s+/)
  if (f.length < 5) {
    throw new Error('cron 式は「分 時 日 月 曜日」の5フィールドが必要です')
  }
  const [minS, hourS, domS, monS, dowS] = f as [string, string, string, string, string]

  const mins   = expandField(minS, 0, 59)
  const hours  = expandField(hourS, 0, 23)
  const dom    = expandField(domS, 1, 31)
  const months = expandField(monS, 1, 12)
  // 0/7=Sun として 7→0 に正規化
  const dow0to6 = expandField(dowS, 0, 7).map(n => (n === 7 ? 0 : n))
  const dow = uniqSorted(dow0to6)

  return { mins, hours, dom, months, dow }
}

// ---- 次回実行算出 ------------------------------------------------------------

const WEEKIDX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
}

const dtfCache = new Map<string, Intl.DateTimeFormat>()
function getDtf(tz: string) {
  let dtf = dtfCache.get(tz)
  if (!dtf) {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    })
    dtfCache.set(tz, dtf)
  }
  return dtf
}

/** 与えた UTC Date の各フィールドを「tz」視点で取り出す */
function partsInTz(d: Date, tz: string) {
  const dtf = getDtf(tz)
  const parts = dtf.formatToParts(d)
  let minute = 0, hour = 0, day = 1, month = 1, dow = 0
  for (const p of parts) {
    if (p.type === 'minute') minute = Number(p.value)
    else if (p.type === 'hour') hour = Number(p.value)
    else if (p.type === 'day') day = Number(p.value)
    else if (p.type === 'month') month = Number(p.value)
    else if (p.type === 'weekday') dow = WEEKIDX[p.value as keyof typeof WEEKIDX] ?? 0
  }
  return { minute, hour, day, month, dow }
}

/**
 * public: 次回「n」件の実行時刻（UTC Date配列）を返す
 * @param spec parseCron の戻り値
 * @param baseFrom 基準の瞬間（この時刻以降）
 * @param tz "Asia/Tokyo" など IANA TZ
 * @param n 件数（上限 200 程度想定）
 */
export function nextRuns(
  spec: CronSpec,
  baseFrom: Date,
  tz: string,
  n: number
): Date[] {
  const out: Date[] = []
  // 秒を切り上げて次の分から探索
  const start = new Date(baseFrom.getTime())
  if (start.getSeconds() > 0 || start.getMilliseconds() > 0) {
    start.setUTCMinutes(start.getUTCMinutes() + 1, 0, 0)
  } else {
    start.setUTCSeconds(0, 0)
  }

  let cur = start
  const limit = 525600 /* 1年分 */  // 安全弁
  let steps = 0

  while (out.length < n && steps < limit) {
    const p = partsInTz(cur, tz)
    if (
      spec.mins.includes(p.minute) &&
      spec.hours.includes(p.hour) &&
      spec.dom.includes(p.day) &&
      spec.months.includes(p.month) &&
      spec.dow.includes(p.dow)
    ) {
      out.push(new Date(cur.getTime()))
      // 次の分へ
      cur = new Date(cur.getTime() + 60_000)
      cur.setUTCSeconds(0, 0)
    } else {
      // 1分ずつ進める（200件程度なら十分高速）
      cur = new Date(cur.getTime() + 60_000)
      cur.setUTCSeconds(0, 0)
    }
    steps++
  }
  return out
}
