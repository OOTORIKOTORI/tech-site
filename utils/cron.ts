// utils/cron.ts - strict, no deps, JST-aware matching

export type ParsedField = { values: number[]; isStar: boolean }
export type CronSpec = {
  min: ParsedField
  hour: ParsedField
  day: ParsedField
  month: ParsedField
  week: ParsedField
}

const BOUNDS = [
  [0, 59], // min
  [0, 23], // hour
  [1, 31], // day
  [1, 12], // month
  [0, 6], // week (0=Sun)
] as const
const [MIN, HOUR, DAY, MONTH, WEEK] = BOUNDS

const isStar = (s: string) => s.trim() === '*'

function parseField(expr: string, idx: number): ParsedField {
  const [lo, hi] = BOUNDS[idx]
  if (isStar(expr)) return { values: [], isStar: true }

  const out: number[] = []
  const push = (v: number) => {
    if (v < lo || v > hi) throw new Error(`値が範囲外です: ${v} (許容 ${lo}-${hi})`)
    if (!out.includes(v)) out.push(v)
  }

  // 要素は「,」区切り
  for (const part of expr.split(',')) {
    const p = part.trim()
    if (!p) continue

    // step: "*/5" or "10-30/5"
    const [rangePart, stepPart] = p.split('/')
    const step = stepPart ? Number(stepPart) : 1
    if (!Number.isInteger(step) || step <= 0) {
      throw new Error(`不正なステップです: ${p}`)
    }

    // 範囲指定 "a-b" もしくは単値 "x" / "*/n"
    if (rangePart === '*') {
      for (let v = lo; v <= hi; v += step) push(v)
      continue
    }

    const range = rangePart.split('-')
    if (range.length === 1) {
      const v = Number(range[0])
      if (!Number.isInteger(v)) throw new Error(`数値ではありません: ${range[0]}`)
      push(v)
      continue
    }

    if (range.length === 2) {
      const a = Number(range[0])
      const b = Number(range[1])
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        throw new Error(`不正な範囲です: ${rangePart}`)
      }
      if (a > b) throw new Error(`範囲の下限/上限が逆です: ${rangePart}`)
      for (let v = a; v <= b; v += step) push(v)
      continue
    }

    throw new Error(`不正なトークンです: ${p}`)
  }

  out.sort((a, b) => a - b)
  return { values: out, isStar: false }
}

export function parseCron(expr: string): CronSpec {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    throw new Error('crontab は「分 時 日 月 曜日」の5要素です')
  }
  const [mi, ho, da, mo, we] = parts
  return {
    min: parseField(mi, 0),
    hour: parseField(ho, 1),
    day: parseField(da, 2),
    month: parseField(mo, 3),
    week: parseField(we, 4),
  }
}

function inSet(field: ParsedField, v: number): boolean {
  return field.isStar || field.values.includes(v)
}

function nextMinute(dt: Date): Date {
  const d = new Date(dt.getTime())
  d.setUTCSeconds(0, 0)
  d.setUTCMinutes(d.getUTCMinutes() + 1)
  return d
}

/** dt(UTC) が spec(JST基準) を満たすか */
export function matches(spec: CronSpec, dt: Date, tz: 'Asia/Tokyo' | 'UTC'): boolean {
  // 表示TZではなく「評価用TZ」を JST に固定（仕様）
  // 評価時刻の各成分を JST で取り出す
  const z = 'Asia/Tokyo'
  const get = (opt: Intl.DateTimeFormatOptions) =>
    Number(new Intl.DateTimeFormat('en-GB', { timeZone: z, ...opt }).format(dt))

  const m = get({ minute: '2-digit' })
  const h = get({ hour: '2-digit', hour12: false })
  const D = get({ day: '2-digit' })
  const M = get({ month: '2-digit' })
  // Sunday=0…Saturday=6
  const w = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: z, weekday: 'short' })
      .formatToParts(dt)
      .find(p => p.type === 'weekday')?.value
  )
  // Intlでは曜日数字が直接取れないのでJS DateをJSTに補正して使う
  const js = new Date(dt.toLocaleString('en-US', { timeZone: z }))
  const W = js.getDay()

  return (
    inSet(spec.min, m) &&
    inSet(spec.hour, h) &&
    inSet(spec.day, D) &&
    inSet(spec.month, M) &&
    inSet(spec.week, W)
  )
}

/** 次の n 件を返す（from を評価基準に、JST評価） */
export function nextRuns(
  spec: CronSpec,
  from: Date,
  _displayTz: 'Asia/Tokyo' | 'UTC',
  n: number
): Date[] {
  const out: Date[] = []
  // from の「次の分」からスタート
  let cur = nextMinute(new Date(from.getTime()))
  for (; out.length < n; ) {
    if (matches(spec, cur, 'Asia/Tokyo')) {
      out.push(new Date(cur.getTime()))
    }
    cur = nextMinute(cur)
    // 念のため無限ループガード（1年分で打ち切り）
    if (cur.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) break
  }
  return out
}
