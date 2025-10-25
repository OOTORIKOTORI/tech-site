// utils/cron.ts

/**
 * Cron 単一フィールドの内部表現
 * - values: 許容される数値リスト（昇順・重複なし）
 * - star: ワイルドカード（`*`）指定か
 */
export type CronField = { values: number[]; star: boolean }

/**
 * Cron 全体の内部表現（minute/hour/dom/month/dow）
 *
 * メモ:
 * - DOW は 0-6（0=Sun）。7 は非対応（エラー想定）。
 * - DOM×DOW は dowDomMode ('OR'|'AND') で切替。'*' は OR=unrestricted/AND=always-true。
 * - 名前トークン（JAN..DEC, SUN..SAT）は大小文字を無視。
 * - ステップ指定（例: asterisk/5, a-b/2）に対応。0 以下のステップは不正。
 * - 基準の秒・ミリ秒があるときは“次の分”に切り上げ。ちょうど分なら包括開始。
 */
export type CronSpec = {
  /** 秒（6フィールド版サポート: 省略時は 0 固定） */
  second: CronField
  minute: CronField
  hour: CronField
  dom: CronField
  month: CronField
  dow: CronField
  /**
   * DOM×DOW 判定モード: 'OR'|'AND'（未指定は 'OR'）
   */
  dowDomMode: 'OR' | 'AND'
  /** 入力が6フィールド（秒あり）だったかのフラグ */
  hasSeconds: boolean
}

function expandField(src: string, min: number, max: number): number[] {
  const parts = src.split(',')
  const set = new Set<number>()
  for (const partRaw of parts) {
    const [rawRange0, rawStep0] = partRaw.split('/')
    const rawRange = (rawRange0 ?? '*').trim()
    const stepNum = rawStep0 === undefined ? 1 : Number(rawStep0)
    if (!Number.isFinite(stepNum) || stepNum <= 0) {
      throw new Error('Step must be a positive integer')
    }
    const step = Math.floor(stepNum)

    if (rawRange === '*' && step > 1) {
      // ステップ計算: DOM では 1 から開始
      for (let v = min; v <= max; v += step) {
        set.add(v)
      }
    } else {
      const range = rawRange === '*' ? `${min}-${max}` : rawRange
      const [startStr, endStr] = range.includes('-') ? range.split('-') : [range, range]
      let start = Number(startStr)
      let end = Number(endStr ?? startStr)
      start = Math.max(min, Math.min(max, start))
      end = Math.max(min, Math.min(max, end))
      if (start > end) [start, end] = [end, start]
      for (let v = start; v <= end; v += step) set.add(v)
    }
  }
  return Array.from(set).sort((a, b) => a - b)
}

function makeField(src: string, min: number, max: number): CronField {
  return { values: expandField(src, min, max), star: src.trim() === '*' }
}

function makeDowField(src: string): CronField {
  const s = src.trim()
  if (s === '*') {
    return { values: [0, 1, 2, 3, 4, 5, 6], star: true }
  }
  // expandFieldで一旦数値化
  const vals = expandField(src, 0, 7)
  // 7が含まれていたらエラー
  if (vals.some(v => v === 7)) throw new Error('DOW supports 0-6 (0=Sun). 7 is not supported.')
  // 0..6以外は除外し、重複排除・昇順
  const uniq = Array.from(
    new Set(vals.map(v => (v >= 0 && v <= 6 ? v : undefined)).filter(v => v !== undefined))
  ).sort((a, b) => a - b)
  return { values: uniq as number[], star: false }
}

const MON_NAME: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

const DOW_NAME: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

function mapNamedTokens(src: string, dict: Record<string, number>): string {
  return src
    .split(',')
    .map(tk => {
      const [rng, step] = tk.split('/')
      const r = (rng ?? '*').trim().toUpperCase()
      if (r === '*') return step ? `*/${step}` : '*'
      if (r === '') return `${r}/${step ?? ''}`.replace(/\/$/, '')
      if (r.includes('-')) {
        const pair = r.split('-')
        const a = pair[0] ?? ''
        const b = pair[1] ?? ''
        const aa = a && a in dict ? String(dict[a]) : a
        const bb = b && b in dict ? String(dict[b]) : b
        return `${aa}-${bb}${step ? '/' + step : ''}`
      } else {
        const v = r in dict ? String(dict[r]) : r
        return `${v}${step ? '/' + step : ''}`
      }
    })
    .join(',')
  // 名前トークンは必ず0..6にマップ
}

/**
 * Cron 式を解析して `CronSpec` に変換します。
 *
 * 仕様要点:
 * - フィールドは `minute hour dom month dow` の 5 つ。
 * - DOW: 0-6（0=Sun）。7 は非対応（エラー想定）。
 * - DOM×DOW は dowDomMode ('OR'|'AND') で切替。'*' は OR=unrestricted/AND=always-true。
 * - 名前トークン（JAN..DEC, SUN..SAT）は大小文字を無視。
 * - ステップ指定（例: asterisk/5, a-b/5）で 0 以下や NaN は不正。
 *
 * 例:
 * - asterisk/5 9-18 * * 1-5
 * - 0 0 1 JAN *
 */
export function parseCron(expr: string, opts?: { dowDomMode?: 'OR' | 'AND' }): CronSpec {
  const norm = normalizeAlias(expr.trim())
  const tokens = norm.split(/\s+/)
  if (tokens.length !== 5 && tokens.length !== 6) {
    throw new Error('Cron expression must have 5 or 6 fields')
  }
  const hasSeconds = tokens.length === 6
  const [s, m, h, dom, mon, dow] = hasSeconds
    ? (tokens as [string, string, string, string, string, string])
    : (['0', ...tokens] as [string, string, string, string, string, string])
  const second = makeField(s, 0, 59)
  const minute = makeField(m, 0, 59)
  const hour = makeField(h, 0, 23)
  const d = makeField(dom, 1, 31)
  const mo = /[A-Za-z]/.test(mon)
    ? makeField(mapNamedTokens(mon, MON_NAME), 1, 12)
    : makeField(mon, 1, 12)
  const dw = /[A-Za-z]/.test(dow) ? makeDowField(mapNamedTokens(dow, DOW_NAME)) : makeDowField(dow)
  const mode = opts?.dowDomMode === 'AND' ? 'AND' : 'OR'
  // INFOログ（テスト環境では抑制）
  if (
    typeof console !== 'undefined' &&
    console.info &&
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'test' &&
    process.env.NODE_ENV !== 'production'
  ) {
    console.info(`[cron] dowDomMode: ${mode}`)
  }
  return { second, minute, hour, dom: d, month: mo, dow: dw, dowDomMode: mode, hasSeconds }
}

function partsInTZ(date: Date, tz: 'Asia/Tokyo' | 'UTC') {
  if (tz === 'UTC') {
    return {
      second: date.getUTCSeconds(),
      minute: date.getUTCMinutes(),
      hour: date.getUTCHours(),
      dom: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      dow: date.getUTCDay(),
    }
  } else {
    const jstMs = date.getTime() + 9 * 3600000
    const jst = new Date(jstMs)
    return {
      second: jst.getUTCSeconds(),
      minute: jst.getUTCMinutes(),
      hour: jst.getUTCHours(),
      dom: jst.getUTCDate(),
      month: jst.getUTCMonth() + 1,
      dow: jst.getUTCDay(),
    }
  }
}

function matchesParts(
  spec: CronSpec,
  p: { second: number; minute: number; hour: number; dom: number; month: number; dow: number }
): boolean {
  const inSet = (f: CronField, v: number) => f.star || f.values.includes(v)

  // 基本フィールドチェック
  if (
    !inSet(spec.second, p.second) ||
    !inSet(spec.minute, p.minute) ||
    !inSet(spec.hour, p.hour) ||
    !inSet(spec.month, p.month)
  ) {
    return false
  }

  // DOM×DOW 判定
  const mode = spec.dowDomMode === 'AND' ? 'AND' : 'OR'
  const domHit = inSet(spec.dom, p.dom)
  const dowHit = inSet(spec.dow, p.dow)

  if (mode === 'AND') {
    // AND モード: 両方が true (star は常時 true)
    return (spec.dom.star || domHit) && (spec.dow.star || dowHit)
  } else {
    // OR モード: どちらかが true または両方が star
    if (spec.dom.star && spec.dow.star) {
      return true // 両方が * なら常に true
    }
    if (spec.dom.star) {
      return dowHit // dom=* なら dow のみチェック
    }
    if (spec.dow.star) {
      return domHit // dow=* なら dom のみチェック
    }
    return domHit || dowHit // 通常の OR
  }
}

function buildDateInTZ(
  parts: { y: number; mon: number; dom: number; hour: number; min: number; sec: number },
  tz: 'Asia/Tokyo' | 'UTC'
): Date {
  const offsetMs = tz === 'Asia/Tokyo' ? 9 * 3600000 : 0
  const ms =
    Date.UTC(parts.y, parts.mon - 1, parts.dom, parts.hour, parts.min, parts.sec, 0) - offsetMs
  return new Date(ms)
}

function yearInTZ(date: Date, tz: 'Asia/Tokyo' | 'UTC'): number {
  if (tz === 'UTC') return date.getUTCFullYear()
  const jstMs = date.getTime() + 9 * 3600000
  return new Date(jstMs).getUTCFullYear()
}

function setInTZ(
  base: Date,
  tz: 'Asia/Tokyo' | 'UTC',
  patch: Partial<{
    y: number
    month: number
    dom: number
    hour: number
    minute: number
    second: number
  }>
): Date {
  const p = partsInTZ(base, tz)
  const y = yearInTZ(base, tz)
  return buildDateInTZ(
    {
      y: patch.y ?? y,
      mon: patch.month ?? p.month,
      dom: patch.dom ?? p.dom,
      hour: patch.hour ?? p.hour,
      min: patch.minute ?? p.minute,
      sec: patch.second ?? p.second,
    },
    tz
  )
}

// --- Timezone helpers (generic IANA TZ support) ---
function tzOffsetMinutes(date: Date, tz: string): number {
  // Derive tz offset by comparing formatted local parts vs actual epoch
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value || '0'
  const y = Number(get('year'))
  const mo = Number(get('month'))
  const da = Number(get('day'))
  const hh = Number(get('hour'))
  const mi = Number(get('minute'))
  const ss = Number(get('second'))
  const asUTC = Date.UTC(y, mo - 1, da, hh, mi, ss)
  const diffMs = asUTC - date.getTime()
  return Math.round(diffMs / 60000) // minutes
}

function partsInAnyTZ(date: Date, tz: string) {
  if (tz === 'UTC' || tz === 'Asia/Tokyo') return partsInTZ(date, tz as 'UTC' | 'Asia/Tokyo')
  const offMin = tzOffsetMinutes(date, tz)
  const local = new Date(date.getTime() + offMin * 60000)
  return {
    second: local.getUTCSeconds(),
    minute: local.getUTCMinutes(),
    hour: local.getUTCHours(),
    dom: local.getUTCDate(),
    month: local.getUTCMonth() + 1,
    dow: local.getUTCDay(),
  }
}

function yearInAnyTZ(date: Date, tz: string): number {
  if (tz === 'UTC' || tz === 'Asia/Tokyo') return yearInTZ(date, tz as 'UTC' | 'Asia/Tokyo')
  const offMin = tzOffsetMinutes(date, tz)
  const local = new Date(date.getTime() + offMin * 60000)
  return local.getUTCFullYear()
}

function buildDateInAnyTZ(
  parts: { y: number; mon: number; dom: number; hour: number; min: number; sec: number },
  tz: string
): Date {
  if (tz === 'UTC' || tz === 'Asia/Tokyo') return buildDateInTZ(parts, tz as 'UTC' | 'Asia/Tokyo')
  // Initial naive guess: as if tz offset were 0
  const guessMs0 = Date.UTC(parts.y, parts.mon - 1, parts.dom, parts.hour, parts.min, parts.sec, 0)
  // Compute offset at guess and adjust
  let off = tzOffsetMinutes(new Date(guessMs0), tz)
  let ms = guessMs0 - off * 60000
  // Re-evaluate once in case crossing DST boundary changed offset
  const off2 = tzOffsetMinutes(new Date(ms), tz)
  if (off2 !== off) {
    off = off2
    ms = guessMs0 - off * 60000
  }
  // As a safety, if parts don't match (DST gaps), nudge forward by 1h up to 2 steps
  for (let i = 0; i < 2; i++) {
    const p = partsInAnyTZ(new Date(ms), tz)
    if (
      p.month === parts.mon &&
      p.dom === parts.dom &&
      p.hour === parts.hour &&
      p.minute === parts.min &&
      p.second === parts.sec
    ) {
      break
    }
    ms += 3600000
  }
  return new Date(ms)
}

function setInAnyTZ(
  base: Date,
  tz: string,
  patch: Partial<{
    y: number
    month: number
    dom: number
    hour: number
    minute: number
    second: number
  }>
): Date {
  if (tz === 'UTC' || tz === 'Asia/Tokyo') return setInTZ(base, tz as 'UTC' | 'Asia/Tokyo', patch)
  const p = partsInAnyTZ(base, tz)
  const y = yearInAnyTZ(base, tz)
  return buildDateInAnyTZ(
    {
      y: patch.y ?? y,
      mon: patch.month ?? p.month,
      dom: patch.dom ?? p.dom,
      hour: patch.hour ?? p.hour,
      min: patch.minute ?? p.minute,
      sec: patch.second ?? p.second,
    },
    tz
  )
}

export function nextRuns(spec: CronSpec, baseFrom: Date, tz: string, count: number): Date[] {
  const out: Date[] = []
  let cur = new Date(baseFrom.getTime())
  if (spec.hasSeconds) {
    // 秒指定あり: ミリ秒があれば次の秒、なければその秒から包括開始
    if (cur.getMilliseconds() !== 0) {
      const p0 = partsInAnyTZ(cur, tz)
      cur = setInAnyTZ(cur, tz, { second: p0.second + 1 })
      cur.setUTCMilliseconds(0)
    } else {
      cur.setUTCMilliseconds(0)
    }
  } else {
    // 従来通り: 秒・ミリ秒があれば次の分に切り上げ、分ちょうどは包括
    if (cur.getSeconds() !== 0 || cur.getMilliseconds() !== 0) {
      const p0 = partsInAnyTZ(cur, tz)
      cur = setInAnyTZ(cur, tz, { minute: p0.minute + 1, second: 0 })
      cur.setUTCMilliseconds(0)
    } else {
      cur.setUTCSeconds(0, 0)
    }
  }

  const secFirst = spec.second.values[0] ?? 0
  const minFirst = spec.minute.values[0] ?? 0
  const hourFirst = spec.hour.values[0] ?? 0
  const guardLimit = 5 * 366
  let dayGuard = 0

  while (out.length < count && dayGuard < guardLimit) {
    // 月そろえ
    let p = partsInAnyTZ(cur, tz)
    if (!spec.month.star && !spec.month.values.includes(p.month)) {
      const nextMon = spec.month.values.find(v => v >= p.month) ?? spec.month.values[0]!
      let y = yearInAnyTZ(cur, tz)
      if (nextMon < p.month) y += 1
      cur = buildDateInAnyTZ(
        { y, mon: nextMon, dom: 1, hour: hourFirst, min: minFirst, sec: secFirst },
        tz
      )
      p = partsInAnyTZ(cur, tz)
    }

    // 日（DOM×DOW）: dowDomMode に応じて判定
    const inSet = (f: CronField, v: number) => f.star || f.values.includes(v)
    const domDowOk = (pp: { dom: number; dow: number }) => {
      // 実在日チェック: 日付が存在しない場合は false
      const pFull = partsInAnyTZ(cur, tz)
      const actualDate = new Date(yearInAnyTZ(cur, tz), pFull.month - 1, pp.dom)
      if (actualDate.getDate() !== pp.dom) return false

      const mode = spec.dowDomMode === 'AND' ? 'AND' : 'OR'
      const domHit = inSet(spec.dom, pp.dom)
      const dowHit = inSet(spec.dow, pp.dow)

      if (mode === 'AND') {
        return (spec.dom.star || domHit) && (spec.dow.star || dowHit)
      } else {
        // OR モード: どちらかが true または両方が star
        if (spec.dom.star && spec.dow.star) {
          return true // 両方が * なら常に true
        }
        if (spec.dom.star) {
          return dowHit // dom=* なら dow のみチェック
        }
        if (spec.dow.star) {
          return domHit // dow=* なら dom のみチェック
        }
        return domHit || dowHit // 通常の OR
      }
    }
    let ok = domDowOk(p)
    if (!ok) {
      cur = setInAnyTZ(cur, tz, { hour: hourFirst, minute: minFirst, second: secFirst })
      const maxSteps =
        spec.dow.star && !spec.dom.star ? 62 : spec.dom.star && !spec.dow.star ? 7 : 31
      let steps = 0
      while (!ok && steps < maxSteps && dayGuard < guardLimit) {
        const pp = partsInAnyTZ(cur, tz)
        cur = setInAnyTZ(cur, tz, {
          dom: pp.dom + 1,
          hour: hourFirst,
          minute: minFirst,
          second: secFirst,
        })
        dayGuard++
        steps++
        p = partsInAnyTZ(cur, tz)
        ok = domDowOk(p)
      }
      if (!ok) continue
    }

    // 時
    p = partsInAnyTZ(cur, tz)
    const nextHour = spec.hour.values.find(v => v >= p.hour)
    if (nextHour === undefined) {
      cur = setInAnyTZ(cur, tz, {
        dom: p.dom + 1,
        hour: hourFirst,
        minute: minFirst,
        second: secFirst,
      })
      dayGuard++
      continue
    }
    if (nextHour !== p.hour)
      cur = setInAnyTZ(cur, tz, { hour: nextHour, minute: minFirst, second: secFirst })

    // 分
    p = partsInAnyTZ(cur, tz)
    const nextMin = spec.minute.values.find(v => v >= p.minute)
    if (nextMin === undefined) {
      const nh = spec.hour.values.find(v => v >= p.hour + 1)
      if (nh !== undefined)
        cur = setInAnyTZ(cur, tz, { hour: nh, minute: minFirst, second: secFirst })
      else {
        cur = setInAnyTZ(cur, tz, {
          dom: p.dom + 1,
          hour: hourFirst,
          minute: minFirst,
          second: secFirst,
        })
        dayGuard++
      }
      continue
    }
    if (nextMin !== p.minute) cur = setInAnyTZ(cur, tz, { minute: nextMin, second: secFirst })
    p = partsInAnyTZ(cur, tz)

    // 秒（6フィールド対応）
    const nextSec = spec.second.values.find(v => v >= p.second)
    if (nextSec === undefined) {
      // 次の分へ
      const nm = spec.minute.values.find(v => v >= p.minute + 1)
      if (nm !== undefined) cur = setInAnyTZ(cur, tz, { minute: nm, second: secFirst })
      else {
        const nh = spec.hour.values.find(v => v >= p.hour + 1)
        if (nh !== undefined)
          cur = setInAnyTZ(cur, tz, { hour: nh, minute: minFirst, second: secFirst })
        else {
          cur = setInAnyTZ(cur, tz, {
            dom: p.dom + 1,
            hour: hourFirst,
            minute: minFirst,
            second: secFirst,
          })
          dayGuard++
        }
      }
      continue
    }
    if (nextSec !== p.second) cur = setInAnyTZ(cur, tz, { second: nextSec })
    p = partsInAnyTZ(cur, tz)

    if (matchesParts(spec, p)) {
      out.push(new Date(cur.getTime()))
      if (spec.hasSeconds) {
        // 次の秒へ
        cur = setInAnyTZ(cur, tz, { second: p.second + 1 })
      } else {
        // 次の分へ
        cur = setInAnyTZ(cur, tz, { minute: p.minute + 1, second: 0 })
      }
    } else {
      if (spec.hasSeconds) {
        cur = setInAnyTZ(cur, tz, { second: p.second + 1 })
      } else {
        cur = setInAnyTZ(cur, tz, { minute: p.minute + 1, second: 0 })
      }
    }
  }

  // 最終的に重複排除（getTimeで一意化）
  return Array.from(new Map(out.map(d => [d.getTime(), d])).values())
}

// --- エイリアスの正規化（@hourly など） ---
function normalizeAlias(expr: string): string {
  if (!expr.startsWith('@')) return expr
  const k = expr.toLowerCase()
  switch (k) {
    case '@yearly':
    case '@annually':
      return '0 0 1 1 *'
    case '@monthly':
      return '0 0 1 * *'
    case '@weekly':
      return '0 0 * * 0'
    case '@daily':
    case '@midnight':
      return '0 0 * * *'
    case '@hourly':
      return '0 * * * *'
    case '@minutely':
      return '* * * * *'
    default:
      throw new Error(`Unsupported alias: ${expr}`)
  }
}

// --- 簡易 humanize（日本語） ---
function toTimeLabel(spec: CronSpec): string {
  const mm = spec.minute.values
  const hh = spec.hour.values
  const ss = spec.second.values
  const isSingle = (arr: number[]) => arr.length === 1
  if (isSingle(hh) && isSingle(mm) && isSingle(ss)) {
    return `${hh[0]!}:${String(mm[0]!).padStart(2, '0')}:${String(ss[0]!).padStart(2, '0')}`
  }
  if (isSingle(hh) && isSingle(mm)) {
    return `${hh[0]!}:${String(mm[0]!).padStart(2, '0')}`
  }
  if (isSingle(hh) && mm.length > 1 && mm[0] === 0 && mm[mm.length - 1] === 55) {
    // 毎分相当
    return `${hh[0]!}時台 毎分`
  }
  // 分ステップの検出（*/n）
  const stepMin = detectStep(mm)
  if (isSingle(hh) && stepMin) {
    return `${hh[0]!}時台 の毎${stepMin}分`
  }
  if (hh.length > 1 && stepMin) {
    return `${hh[0]}-${hh[hh.length - 1]}時 の毎${stepMin}分`
  }
  return 'スケジュール'
}

function detectStep(values: number[]): number | null {
  if (values.length < 2) return null
  const step = values[1]! - values[0]!
  for (let i = 2; i < values.length; i++) {
    if (values[i]! - values[i - 1]! !== step) return null
  }
  return step > 0 ? step : null
}

function dowLabel(spec: CronSpec): string {
  const v = spec.dow
  if (v.star) return ''
  const vals = v.values
  if (vals.length === 5 && vals.join(',') === '1,2,3,4,5') return '平日'
  if (vals.length === 2 && vals.join(',') === '0,6') return '週末'
  if (vals.length === 1) return ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'][vals[0]!]!
  return `${vals.map(n => ['日', '月', '火', '水', '木', '金', '土'][n] + '曜').join('・')}`
}

/**
 * 人間可読の日本語説明（タイムゾーン非依存の表現）。
 */
export function humanizeCron(spec: CronSpec): string
export function humanizeCron(spec: CronSpec, opts?: { tz?: string }): string
export function humanizeCron(expr: string): string
export function humanizeCron(expr: string, opts?: { tz?: string }): string
export function humanizeCron(specOrExpr: CronSpec | string, opts?: { tz?: string }): string {
  const spec = typeof specOrExpr === 'string' ? parseCron(specOrExpr) : specOrExpr
  // Keep API surface (opts.tz) without changing legacy output semantics
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void opts?.tz
  const dayPart = (() => {
    if (!spec.dom.star && spec.dow.star) {
      // 毎月X日
      const vs = spec.dom.values
      if (vs.length === 1) return `毎月${vs[0]}日`
      return `毎月 ${vs.join('・')}日`
    }
    const dlab = dowLabel(spec)
    if (dlab) return dlab
    return '毎日'
  })()
  const t = toTimeLabel(spec)
  // 既定は従来互換（tz指定があっても表示には影響させない：最小差分）
  return `${dayPart} ${t}`.trim()
}
