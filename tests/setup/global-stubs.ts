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

type MockFn = ReturnType<typeof vi.fn>

type CanvasRenderingContext2DMock = {
  canvas: HTMLCanvasElement
  fillStyle: string
  fillRect: MockFn
  drawImage: MockFn
  clearRect: MockFn
  save: MockFn
  restore: MockFn
  globalCompositeOperation: string
}

const originalCanvasGetContext =
  typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement.prototype.getContext : undefined
const originalCanvasToDataURL =
  typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement.prototype.toDataURL : undefined

const canvasContextMap =
  typeof WeakMap !== 'undefined'
    ? new WeakMap<HTMLCanvasElement, CanvasRenderingContext2DMock>()
    : (new Map() as unknown as WeakMap<HTMLCanvasElement, CanvasRenderingContext2DMock>)

const canvasContextRecords: Array<{
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2DMock
}> = []

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

  if (typeof HTMLCanvasElement !== 'undefined') {
    const proto = HTMLCanvasElement.prototype as any

    const ensureContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2DMock => {
      const cached = canvasContextMap.get(canvas)
      if (cached) return cached
      const ctx: CanvasRenderingContext2DMock = {
        canvas,
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        globalCompositeOperation: 'source-over',
      }
      canvasContextMap.set(canvas, ctx)
      canvasContextRecords.push({ canvas, ctx })
      return ctx
    }

    proto.getContext = vi.fn(function (this: HTMLCanvasElement, type: string) {
      if (type !== '2d') {
        return originalCanvasGetContext ? originalCanvasGetContext.call(this, type) : null
      }
      return ensureContext(this)
    }) as any

    const pngDataUrl = `data:image/png;base64,${
      typeof Buffer !== 'undefined' ? Buffer.from('dummy').toString('base64') : 'ZHVtbXk='
    }`

    proto.toDataURL = vi.fn(function (this: HTMLCanvasElement, type?: string) {
      void type
      return pngDataUrl
    }) as any

    vi.stubGlobal('__canvas2dMockRecords', canvasContextRecords)
  }

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
  if (typeof HTMLCanvasElement !== 'undefined') {
    if (originalCanvasGetContext) {
      HTMLCanvasElement.prototype.getContext = originalCanvasGetContext
    } else {
      delete (HTMLCanvasElement.prototype as any).getContext
    }
    if (originalCanvasToDataURL) {
      HTMLCanvasElement.prototype.toDataURL = originalCanvasToDataURL
    } else {
      delete (HTMLCanvasElement.prototype as any).toDataURL
    }
    delete (globalThis as any).__canvas2dMockRecords
  }
  vi.restoreAllMocks()
})
