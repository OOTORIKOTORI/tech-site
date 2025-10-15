export interface CpuStats {
  us: number
  sy: number
  ni: number
  id: number
  wa?: number
  hi?: number
  si?: number
  st?: number
}
export interface MemStats {
  total: number
  used: number
  free: number
  buff?: number
  cache?: number
  swapTotal?: number
  swapUsed?: number
}
export interface LoadAvg {
  one: number
  five: number
  fifteen: number
}
export interface ProcessRow {
  pid: number
  user?: string
  cpu?: number
  mem?: number
  time?: string
  command?: string
}

export interface TopSnapshot {
  ts: string // ISO or 'YYYY-MM-DD HH:mm:ss'
  load?: LoadAvg
  cpu?: CpuStats
  mem?: MemStats
  procs?: ProcessRow[] // optional, first N rows
}
