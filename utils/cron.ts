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
  minute: CronField
  hour: CronField
  dom: CronField
  month: CronField
  dow: CronField
  /**
   * DOM×DOW 判定モード: 'OR'|'AND'（未指定は 'OR'）
   */
  dowDomMode: 'OR' | 'AND'
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
  const fields = expr.trim().split(/\s+/)
  if (fields.length !== 5) throw new Error('Cron expression must have exactly 5 fields')
  const [m, h, dom, mon, dow] = fields as [string, string, string, string, string]
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
    process.env.NODE_ENV !== 'test'
  ) {
    console.info(`[cron] dowDomMode: ${mode}`)
  }
  return { minute, hour, dom: d, month: mo, dow: dw, dowDomMode: mode }
}

function partsInTZ(date: Date, tz: 'Asia/Tokyo' | 'UTC') {
  if (tz === 'UTC') {
    return {
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
  p: { minute: number; hour: number; dom: number; month: number; dow: number }
): boolean {
  const inSet = (f: CronField, v: number) => f.star || f.values.includes(v)

  // 基本フィールドチェック
  if (!inSet(spec.minute, p.minute) || !inSet(spec.hour, p.hour) || !inSet(spec.month, p.month)) {
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
  parts: { y: number; mon: number; dom: number; hour: number; min: number },
  tz: 'Asia/Tokyo' | 'UTC'
): Date {
  const offsetMs = tz === 'Asia/Tokyo' ? 9 * 3600000 : 0
  const ms = Date.UTC(parts.y, parts.mon - 1, parts.dom, parts.hour, parts.min, 0, 0) - offsetMs
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
  patch: Partial<{ y: number; month: number; dom: number; hour: number; minute: number }>
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
    },
    tz
  )
}

export function nextRuns(
  spec: CronSpec,
  baseFrom: Date,
  tz: 'UTC' | 'Asia/Tokyo',
  count: number
): Date[] {
  const out: Date[] = []
  let cur = new Date(baseFrom.getTime())
  if (cur.getSeconds() !== 0 || cur.getMilliseconds() !== 0) {
    const p0 = partsInTZ(cur, tz)
    cur = setInTZ(cur, tz, { minute: p0.minute + 1 })
    cur.setUTCSeconds(0, 0)
  } else {
    cur.setUTCSeconds(0, 0)
  }

  const minFirst = spec.minute.values[0] ?? 0
  const hourFirst = spec.hour.values[0] ?? 0
  const guardLimit = 5 * 366
  let dayGuard = 0

  while (out.length < count && dayGuard < guardLimit) {
    // 月そろえ
    let p = partsInTZ(cur, tz)
    if (!spec.month.star && !spec.month.values.includes(p.month)) {
      const nextMon = spec.month.values.find(v => v >= p.month) ?? spec.month.values[0]!
      let y = yearInTZ(cur, tz)
      if (nextMon < p.month) y += 1
      cur = buildDateInTZ({ y, mon: nextMon, dom: 1, hour: hourFirst, min: minFirst }, tz)
      p = partsInTZ(cur, tz)
    }

    // 日（DOM×DOW）: dowDomMode に応じて判定
    const inSet = (f: CronField, v: number) => f.star || f.values.includes(v)
    const domDowOk = (pp: { dom: number; dow: number }) => {
      // 実在日チェック: 日付が存在しない場合は false
      const pFull = partsInTZ(cur, tz)
      const actualDate = new Date(yearInTZ(cur, tz), pFull.month - 1, pp.dom)
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
      cur = setInTZ(cur, tz, { hour: hourFirst, minute: minFirst })
      const maxSteps =
        spec.dow.star && !spec.dom.star ? 62 : spec.dom.star && !spec.dow.star ? 7 : 31
      let steps = 0
      while (!ok && steps < maxSteps && dayGuard < guardLimit) {
        const pp = partsInTZ(cur, tz)
        cur = setInTZ(cur, tz, { dom: pp.dom + 1, hour: hourFirst, minute: minFirst })
        dayGuard++
        steps++
        p = partsInTZ(cur, tz)
        ok = domDowOk(p)
      }
      if (!ok) continue
    }

    // 時
    p = partsInTZ(cur, tz)
    const nextHour = spec.hour.values.find(v => v >= p.hour)
    if (nextHour === undefined) {
      cur = setInTZ(cur, tz, { dom: p.dom + 1, hour: hourFirst, minute: minFirst })
      dayGuard++
      continue
    }
    if (nextHour !== p.hour) cur = setInTZ(cur, tz, { hour: nextHour, minute: minFirst })

    // 分
    p = partsInTZ(cur, tz)
    const nextMin = spec.minute.values.find(v => v >= p.minute)
    if (nextMin === undefined) {
      const nh = spec.hour.values.find(v => v >= p.hour + 1)
      if (nh !== undefined) cur = setInTZ(cur, tz, { hour: nh, minute: minFirst })
      else {
        cur = setInTZ(cur, tz, { dom: p.dom + 1, hour: hourFirst, minute: minFirst })
        dayGuard++
      }
      continue
    }
    if (nextMin !== p.minute) cur = setInTZ(cur, tz, { minute: nextMin })
    p = partsInTZ(cur, tz)

    if (matchesParts(spec, p)) {
      out.push(new Date(cur.getTime()))
      cur = setInTZ(cur, tz, { minute: p.minute + 1 })
      cur.setUTCSeconds(0, 0)
    } else {
      cur = setInTZ(cur, tz, { minute: p.minute + 1 })
    }
  }

  // 最終的に重複排除（getTimeで一意化）
  return Array.from(new Map(out.map(d => [d.getTime(), d])).values())
}
