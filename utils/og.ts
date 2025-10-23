export async function tryHeadReachable(
  url: string,
  timeoutMs = 8000
): Promise<{ ok: boolean; status?: number }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const resp = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    clearTimeout(timeout)
    let status = resp.status
    if (status === 405) {
      const controller2 = new AbortController()
      const timeout2 = setTimeout(() => controller2.abort(), timeoutMs)
      const resp2 = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller2.signal,
      })
      clearTimeout(timeout2)
      status = resp2.status
    }
    return { ok: status > 0 && status < 400, status }
  } catch {
    return { ok: false }
  }
}

export function recommendOgImageSize(width: number, height: number): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  const notes: string[] = []
  if (width < 600 || height < 315) notes.push('画像が小さい可能性（推奨: 1200x630 以上）')
  const ratio = width / Math.max(1, height)
  if (Math.abs(ratio - 1.91) / 1.91 > 0.1) notes.push('推奨比率(1.91:1)から外れ')
  return notes.length ? notes.join(' / ') : null
}
