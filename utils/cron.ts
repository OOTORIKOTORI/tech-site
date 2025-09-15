// utils/cron.ts - strict, no deps, JST-aware matching

const FIELD_RANGES = [
  [0, 59], // 分
  [0, 23], // 時
  [1, 31], // 日(DoM)
  [1, 12], // 月
  [0, 6], // 曜日(0=日)
] as const

const CRON_DEBUG = typeof process !== 'undefined' && (process as any).env?.CRON_DEBUG

type CronSpec = {
  minute: number[]
  hour: number[]
  dom: number[]
  month: number[]
  dow: number[]
  domStar: boolean
  dowStar: boolean
}

type ParsedField = { values: number[]; isStar: boolean }

// これを追加（または既存の位置に）
type FieldIndex = 0 | 1 | 2 | 3 | 4

function fullRange(idx: number): number[] {
  const [min, max] = FIELD_RANGES[idx]
  const arr: number[] = []
  for (let v = min; v <= max; v++) arr.push(v)
  return arr
}

function parseField(part: string, idx: FieldIndex) {
  const [MIN, MAX] = FIELD_RANGES[idx] // ← undefined にならない
  const values = new Set<number>()

  if (expr === '*') {
    return { values: fullRange(idx), isStar: true }
  }

  for (const part of expr.split(',')) {
    // */n
    const starStep = part.match(/^\*\/(\d+)$/)
    if (starStep) {
      const step = Number(starStep[1])
      if (!Number.isInteger(step) || step <= 0) {
        throw new Error(`フィールド${idx + 1}のステップ「${part}」が不正です`)
      }
      for (let v = min; v <= max; v += step) values.add(v)
      continue
    }

    // a-b(/n)? or 単一値
    const m = part.match(/^([0-9]+)(?:-([0-9]+))?(?:\/(\d+))?$/)
    if (!m) throw new Error(`フィールド${idx + 1}の値「${part}」が不正です`)
    const s = Number(m[1])
    const e = m[2] ? Number(m[2]) : s
    const st = m[3] ? Number(m[3]) : 1

    if (
      !Number.isInteger(s) ||
      !Number.isInteger(e) ||
      !Number.isInteger(st) ||
      st <= 0 ||
      s < min ||
      e > max ||
      s > e
    ) {
      throw new Error(`フィールド${idx + 1}の範囲「${part}」が不正です`)
    }

    for (let v = s; v <= e; v += st) values.add(v)
  }

  const arr = Array.from(values).sort((a, b) => a - b)
  if (arr.length === 0) throw new Error(`フィールド${idx + 1}が空です`)
  return { values: arr, isStar: false }
}

function parseCron(expr: string): CronSpec {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    throw new Error('crontab は「分 時 日 月 曜日」の5フィールドで指定してください')
  }

  // ここを追加（as でタプル固定）
  const [minS, hourS, domS, monthS, dowS] = parts as [string, string, string, string, string]

  return {
    minute: parseField(minS, 0),
    hour: parseField(hourS, 1),
    dom: parseField(domS, 2),
    month: parseField(monthS, 3),
    dow: parseField(dowS, 4),
  }
}

// JST の年月日/時分/曜日(0=Sun)を、Intlで安全に取り出す
function getTZParts(
  dt: Date,
  tz: string
): { y: number; mo: number; d: number; h: number; m: number; wd: number } {
  // ここがポイント: hourCycle:'h23' を強制して 00..23 に揃える
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    hourCycle: 'h23',
    weekday: 'short',
  })

  const parts = fmt.formatToParts(dt)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value ?? ''

  const y = Number(get('year'))
  const mo = Number(get('month'))
  const d = Number(get('day'))
  let h = Number(get('hour')) // h23 なので 0..23 が保証される
  h = Math.min(23, Number(get('hour')) | 0)
  const m = Number(get('minute'))

  const wdName = get('weekday') // Sun, Mon, ...
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const wd = wdMap[wdName] ?? 0

  return { y, mo, d, h, m, wd }
}

// Vixie cron の DoM/DOW 合成規則
function dayMatches(spec: CronSpec, d: number, wd: number): boolean {
  if (spec.domStar && spec.dowStar) return true
  if (spec.domStar) return spec.dow.includes(wd)
  if (spec.dowStar) return spec.dom.includes(d)
  return spec.dom.includes(d) || spec.dow.includes(wd)
}

function* nextRunGen(spec: CronSpec, from: Date, tz: string): Generator<Date> {
  if (tz !== 'Asia/Tokyo') throw new Error('Asia/Tokyoのみ対応')

  // from直後の1分から探索（「直近以降」定義）
  const dt = new Date(from.getTime())
  dt.setSeconds(0, 0)
  dt.setMinutes(dt.getMinutes() + 1)

  // 年越しでも見つかるよう上限を拡張（600,000分 ≈ 416日）
  for (let i = 0; i < 600000; i++) {
    const { mo, d, h, m, wd } = getTZParts(dt, tz)

    if (
      spec.minute.includes(m) &&
      spec.hour.includes(h) &&
      spec.month.includes(mo) &&
      dayMatches(spec, d, wd)
    ) {
      yield new Date(dt.getTime())
    }

    dt.setMinutes(dt.getMinutes() + 1)
  }
}

// 追加ヘルパー
const JST_OFFSET = 9
function makeDateJST(y: number, mo: number, d: number, h: number, m: number): Date {
  // JST の y/mo/d h:m を表す Date を作る（内部は UTC）
  return new Date(Date.UTC(y, mo - 1, d, h - JST_OFFSET, m, 0, 0))
}
function daysInMonth(y: number, mo: number): number {
  // mo: 1..12
  return new Date(Date.UTC(y, mo, 0)).getUTCDate()
}
function rangeSize(idx: number): number {
  const [min, max] = FIELD_RANGES[idx]
  return max - min + 1
}
function isAll(values: number[], idx: number): boolean {
  return values.length === rangeSize(idx)
}

// ★ getTZParts は hourCycle: 'h23' を使う版にしておいてね（前回入れていればOK）

// ここから置換
export function nextRuns(spec: CronSpec, now: Date, tz: string, count = 5): Date[] {
  if (tz !== 'Asia/Tokyo') throw new Error('Asia/Tokyoのみ対応')

  // 探索開始基準（秒以下は切り捨て）
  const start = new Date(now.getTime())
  start.setSeconds(0, 0)

  const { y: sy, mo: smo, d: sd, h: sh, m: sm } = getTZParts(start, tz)

  const domAll = isAll(spec.dom, 2)
  const dowAll = isAll(spec.dow, 4)

  const months = spec.month.slice().sort((a, b) => a - b)
  const hours = spec.hour.slice().sort((a, b) => a - b)
  const minutes = spec.minute.slice().sort((a, b) => a - b)

  const out: Date[] = []

  // 最大2年先まで見れば 1/1 系でも必ず見つかる
  for (let y = sy; y <= sy + 2 && out.length < count; y++) {
    for (const mo of months) {
      if (y === sy && mo < smo) continue

      const dim = daysInMonth(y, mo)
      const dayStart = y === sy && mo === smo ? sd : 1

      for (let d = dayStart; d <= dim && out.length < count; d++) {
        // JST のその日の曜日（正午基準でズレ対策）
        const wd = new Date(Date.UTC(y, mo - 1, d, 12 - JST_OFFSET)).getUTCDay()

        const domMatch = spec.dom.includes(d)
        const dowMatch = spec.dow.includes(wd)

        // cron の DOM/DOW ルール:
        // - どちらも * なら毎日
        // - DOM が * なら DOW のみ見る
        // - DOW が * なら DOM のみ見る
        // - どちらも指定なら OR
        const allowDay =
          domAll && dowAll ? true : domAll ? dowMatch : dowAll ? domMatch : domMatch || dowMatch

        if (!allowDay) continue

        const hourStart = y === sy && mo === smo && d === sd ? sh : 0
        for (const h of hours) {
          if (h < hourStart) continue

          const minuteStart = y === sy && mo === smo && d === sd && h === sh ? sm + 1 : 0
          for (const m of minutes) {
            if (m < minuteStart) continue

            const cand = makeDateJST(y, mo, d, h, m)
            if (cand.getTime() <= start.getTime()) continue
            if (CRON_DEBUG) console.debug('CAND', { y, mo, d, h, m, iso: cand.toISOString() })
            out.push(cand)
            if (out.length >= count) break
          }
        }
      }
    }
  }

  return out
}
