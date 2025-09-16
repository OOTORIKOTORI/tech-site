// tests/utils/time.ts
// タイムゾーン指定で曜日(0=Sun..6=Sat)を返すユーティリティ
export function getWeekdayInTZ(date: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' })
  const wd = fmt.format(date) // 'Sun'..'Sat'
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)
}
