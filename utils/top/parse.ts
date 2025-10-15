import type { TopSnapshot, CpuStats, MemStats, LoadAvg } from '../../types/top'

export function parseTopText(text: string): { snapshots: TopSnapshot[]; warnings: string[] } {
  const lines = text.split(/\r?\n/)
  const snaps: TopSnapshot[] = []
  const warns: string[] = []

  let i = 0
  while (i < lines.length) {
    const cur = lines[i]
    if (!cur || !/^top\s+-\s+/.test(cur)) {
      i++
      continue
    }
    const head = lines[i++] ?? '' // "top - 10:23:45 up ... load average: 0.12, 0.10, 0.08"

    // time
    const mTime = head.match(/top\s+-\s+(\d{1,2}:\d{2}:\d{2})/)
    const now = new Date()
    const iso = mTime ? `${now.toISOString().slice(0, 10)} ${mTime[1]}` : now.toISOString()

    // load avg
    let load: LoadAvg | undefined
    const mLoad = head.match(/load average:\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (mLoad && mLoad[1] && mLoad[2] && mLoad[3])
      load = { one: +mLoad[1], five: +mLoad[2], fifteen: +mLoad[3] }

    const snap: TopSnapshot = { ts: iso }
    if (load) snap.load = load

    // scan until next 'top -'
    while (i < lines.length) {
      const line = lines[i]
      if (!line || /^top\s+-\s+/.test(line)) break
      i++

      // CPU
      const mCpu = line.match(
        /Cpu\(s\):\s*([\d.]+)%us,\s*([\d.]+)%sy,\s*([\d.]+)%ni,\s*([\d.]+)%id(?:,\s*([\d.]+)%wa)?(?:,\s*([\d.]+)%hi)?(?:,\s*([\d.]+)%si)?(?:,\s*([\d.]+)%st)?/i
      )
      if (mCpu && mCpu[1] && mCpu[2] && mCpu[3] && mCpu[4]) {
        const cpu: CpuStats = {
          us: +mCpu[1],
          sy: +mCpu[2],
          ni: +mCpu[3],
          id: +mCpu[4],
          wa: mCpu[5] ? +mCpu[5] : undefined,
          hi: mCpu[6] ? +mCpu[6] : undefined,
          si: mCpu[7] ? +mCpu[7] : undefined,
          st: mCpu[8] ? +mCpu[8] : undefined,
        }
        snap.cpu = cpu
        continue
      }

      // Mem (KiB/MiB both)
      const mMem = line.match(
        /(KiB|MiB)\s+Mem\s*:\s*([\d,]+)\s+total,\s*([\d,]+)\s+used,\s*([\d,]+)\s+free(?:,\s*([\d,]+)\s+buffers?)?(?:,\s*([\d,]+)\s+cached)?/i
      )
      if (mMem && mMem[2] && mMem[3] && mMem[4]) {
        const scale = mMem[1] === 'MiB' ? 1024 : 1 // KiB基準
        const mem: MemStats = {
          total: +mMem[2].replace(/,/g, '') * scale,
          used: +mMem[3].replace(/,/g, '') * scale,
          free: +mMem[4].replace(/,/g, '') * scale,
          buff: mMem[5] ? +mMem[5].replace(/,/g, '') * scale : undefined,
          cache: mMem[6] ? +mMem[6].replace(/,/g, '') * scale : undefined,
        }
        snap.mem = mem
        continue
      }

      // Swap
      const mSwap = line.match(/(KiB|MiB)\s+Swap\s*:\s*([\d,]+)\s+total,\s*([\d,]+)\s+used/i)
      if (mSwap && mSwap[2] && mSwap[3]) {
        const scale = mSwap[1] === 'MiB' ? 1024 : 1
        snap.mem = snap.mem ?? { total: 0, used: 0, free: 0 }
        snap.mem.swapTotal = +mSwap[2].replace(/,/g, '') * scale
        snap.mem.swapUsed = +mSwap[3].replace(/,/g, '') * scale
        continue
      }
    }

    snaps.push(snap)
  }

  if (!snaps.length)
    warns.push('No snapshots detected. Check that the file contains lines starting with "top - "')
  return { snapshots: snaps, warnings: warns }
}
