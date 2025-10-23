// utils/timestamp.ts
// Epoch ⇄ Date 変換ユーティリティ（Intl/Date 標準APIのみ）

export type Tz = 'UTC' | 'Asia/Tokyo'
export type Unit = 's' | 'ms' | 'auto'

// 桁数で秒/ミリ秒を自動判定（10=秒, 13=ミリ秒 それ以外はヒューリスティック）
export function detectUnitByLength(input: string | number): 's' | 'ms' {
  const s = String(input).trim()
  if (/^-?\d{13}$/.test(s)) return 'ms'
  if (/^-?\d{10}$/.test(s)) return 's'
  // ざっくり: 12桁以上はms、11桁以下は秒として扱う
  return s.replace(/^-/, '').length >= 12 ? 'ms' : 's'
}

export function epochToDate(value: string | number, unit: Unit = 'auto'): Date | null {
  if (value === '' || value === null || value === undefined) return null
  const raw = Number(String(value).trim())
  if (!Number.isFinite(raw)) return null
  const u = unit === 'auto' ? detectUnitByLength(value) : unit
  const ms = u === 'ms' ? raw : raw * 1000
  return new Date(ms)
}

export function dateToEpoch(d: Date, unit: Exclude<Unit, 'auto'> = 's'): number {
  const ms = d.getTime()
  return unit === 'ms' ? ms : Math.floor(ms / 1000)
}

// toLocaleString での表示用フォーマッタ
export function formatInTZ(d: Date, tz: Tz): string {
  return d.toLocaleString('ja-JP', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// 'YYYY-MM-DDTHH:mm' を「壁時計」の JST/UTC として解釈し、UTC の瞬間へ正規化
export function parseDateTimeLocal(input: string, tz: Tz): Date | null {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!m) return null
  const yy = Number(m[1])
  const MM = Number(m[2])
  const dd = Number(m[3])
  const HH = Number(m[4])
  const mm = Number(m[5])
  const d = new Date(Date.UTC(yy, MM - 1, dd, HH, mm, 0, 0))
  if (tz === 'Asia/Tokyo') d.setUTCHours(d.getUTCHours() - 9)
  return d
}

// datetime-local に戻すための値を生成
function pad(n: number) {
  return String(n).padStart(2, '0')
}
export function toDateTimeLocalValue(d: Date, tz: Tz): string {
  const y = tz === 'UTC' ? d.getUTCFullYear() : d.getFullYear()
  const mo = pad((tz === 'UTC' ? d.getUTCMonth() : d.getMonth()) + 1)
  const da = pad(tz === 'UTC' ? d.getUTCDate() : d.getDate())
  const hh = pad(tz === 'UTC' ? d.getUTCHours() : d.getHours())
  const mi = pad(tz === 'UTC' ? d.getUTCMinutes() : d.getMinutes())
  return `${y}-${mo}-${da}T${hh}:${mi}`
}
