/// <reference lib="webworker" />
import { parseTopText } from '@/utils/top/parse'

self.onmessage = (e: MessageEvent<{ text: string }>) => {
  const { text } = e.data
  const result = parseTopText(text) as {
    snapshots: import('@/types/top').TopSnapshot[]
    warnings: string[]
  }
  ;(self as DedicatedWorkerGlobalScope).postMessage(result)
}
