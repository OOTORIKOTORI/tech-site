import { config } from '@vue/test-utils'
import { vi, beforeAll, afterAll } from 'vitest'

config.global.stubs = {
  NuxtPage: { template: '<div><slot /></div>' },
  NuxtLayout: { template: '<div><slot /></div>' },
}

class IOStub {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_cb?: any, _opts?: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords?(): any[] {
    return []
  }
}
class ROStub {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_cb?: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

const fixedNow = 1735689600000 /* 2025-01-01T00:00:00.000Z 相当 */
const fixedRandom = 0.123456789

beforeAll(() => {
  // analytics / ads など（存在しなくてもOK）
  vi.stubGlobal('gtag', vi.fn())
  vi.stubGlobal('dataLayer', [])
  vi.stubGlobal('__ADS__', { push: vi.fn() })

  // Nuxt auto-imports
  vi.stubGlobal('definePageMeta', vi.fn())

  // 観測系
  vi.stubGlobal('IntersectionObserver', IOStub as any)
  vi.stubGlobal('ResizeObserver', ROStub as any)

  // メディアクエリ
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {}, // 古いAPI互換
    removeListener: () => {}, // 古いAPI互換
    dispatchEvent: () => false,
  }))

  // rAF を即時化
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(globalThis?.performance?.now?.() ?? 0), 0)
  )

  // 非決定的を固定
  vi.spyOn(Date, 'now').mockImplementation(() => fixedNow)
  vi.spyOn(Math, 'random').mockReturnValue(fixedRandom)

  // （必要時のみ有効化）グローバル fetch を最小モック
  // 環境変数 TEST_ENABLE_FETCH_STUB が '1' のときだけ差し替える
  if ((globalThis as any)?.process?.env?.TEST_ENABLE_FETCH_STUB === '1') {
    const ok = (body = 'OK', status = 200) => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => String(body),
      json: async () => {
        try {
          return JSON.parse(String(body))
        } catch {
          return {}
        }
      },
    })
    if (!('fetch' in globalThis)) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ok())
      )
    } else {
      vi.spyOn(globalThis as any, 'fetch').mockImplementation(async () => ok() as any)
    }
  }
})

afterAll(() => {
  vi.restoreAllMocks()
})
