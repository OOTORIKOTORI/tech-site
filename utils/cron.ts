// utils/cron.ts

export type CronField = { values: number[]; star: boolean }

export type CronSpec = {
  minute: CronField
  hour: CronField
  dom: CronField
  month: CronField
  dow: CronField
}

function expandField(src: string, min: number, max: number): number[] {
  const parts = src.split(',')
  const set = new Set<number>()
  for (const partRaw of parts) {
    const [rawRange0, rawStep0] = partRaw.split('/')
    const rawRange = (rawRange0 ?? '*').trim()
    const stepNum = Number(rawStep0)
    const step = rawStep0 && Number.isFinite(stepNum) && stepNum > 0 ? Math.floor(stepNum) : 1
    const range = rawRange === '*' ? `${min}-${max}` : rawRange
    const [startStr, endStr] = range.includes('-') ? range.split('-') : [range, range]
    let start = Number(startStr)
    let end = Number(endStr ?? startStr)
    start = Math.max(min, Math.min(max, start))
    end = Math.max(min, Math.min(max, end))
    if (start > end) [start, end] = [end, start]
    for (let v = start; v <= end; v += step) set.add(v)
  }
  return Array.from(set).sort((a, b) => a - b)
}

function makeField(src: string, min: number, max: number): CronField {
  return { values: expandField(src, min, max), star: src.trim() === '*' }
}

function makeDowField(src: string): CronField {
  const vals = expandField(src, 0, 7).map(v => (v === 7 ? 0 : v))
  const uniq = Array.from(new Set(vals))
    .filter(v => v >= 0 && v <= 6)
    .sort((a, b) => a - b)
  return { values: uniq, star: src.trim() === '*' }
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
}

export function parseCron(expr: string): CronSpec {
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
  return { minute, hour, dom: d, month: mo, dow: dw }
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
  let dayOk: boolean
  if (spec.dom.star && spec.dow.star) dayOk = true
  else if (spec.dom.star) dayOk = inSet(spec.dow, p.dow)
  else if (spec.dow.star) dayOk = inSet(spec.dom, p.dom)
  else dayOk = inSet(spec.dom, p.dom) || inSet(spec.dow, p.dow)
  return (
    inSet(spec.minute, p.minute) && inSet(spec.hour, p.hour) && inSet(spec.month, p.month) && dayOk
  )
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

    // 日（OR）: 不一致なら日単位の小ループ（DOWのみ:7, それ以外:31）
    const inSet = (f: CronField, v: number) => f.star || f.values.includes(v)
    const domDowOk = (pp: { dom: number; dow: number }) =>
      (spec.dom.star && spec.dow.star) ||
      (spec.dom.star && inSet(spec.dow, pp.dow)) ||
      (spec.dow.star && inSet(spec.dom, pp.dom)) ||
      inSet(spec.dom, pp.dom) ||
      inSet(spec.dow, pp.dow)
    let ok = domDowOk(p)
    if (!ok) {
      cur = setInTZ(cur, tz, { hour: hourFirst, minute: minFirst })
      const maxSteps = spec.dom.star && !spec.dow.star ? 7 : 31
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

  return out
}
