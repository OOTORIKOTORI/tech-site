import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TopCharts from '../../components/TopCharts.vue'
import { serializeSvgWithPadding } from '../../utils/top-export'

// Helper to build minimal snapshots
const makeSnaps = () => [
  {
    ts: Date.now(),
    cpu: { id: 90 }, // so cpuUsed = 10
    load: { one: 1.2, five: 0, fifteen: 0 },
    mem: { total: 2048, used: 1024, free: 1024, buffCache: 0 },
    procs: [],
  } as any,
]

describe('Top Analyzer export (regression)', () => {
  describe('SVG serialize with padding (viewBox/size)', () => {
    it('includes expected viewBox/width/height with padding=12', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '800')
      svg.setAttribute('height', '160')
      // let getBBox throw to use width/height fallback or rely on default
      const xml = serializeSvgWithPadding(svg, 12)
      expect(xml).toMatch(/viewBox="-12 -12 824 184"/)
      expect(xml).toMatch(/width="824"/)
      expect(xml).toMatch(/height="184"/)
    })
  })

  describe('PNG export paints white background and filename pattern', () => {
    const origImage = (globalThis as any).Image
    const origCreateObjectURL = URL.createObjectURL
    const origRevokeObjectURL = URL.revokeObjectURL
    let origGetContext: any
    let origToDataURL: any

    let createdDownloads: string[]

    let lastCtx: any
    beforeEach(() => {
      createdDownloads = []
      lastCtx = undefined

      // Mock Image to trigger onload immediately
      class MockImage {
        onload: null | (() => void) = null
        width = 800
        height = 160
        set src(_v: string) {
          // immediately call onload
          this.onload && this.onload()
        }
      }
      (globalThis as any).Image = MockImage

      // Mock URL blob handlers
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock') as any
      URL.revokeObjectURL = vi.fn() as any

      // Hook all canvas getContext calls globally to capture the 2D context
      origGetContext = (HTMLCanvasElement.prototype as any).getContext
      HTMLCanvasElement.prototype.getContext = vi
        .fn()
        .mockImplementation(function (this: HTMLCanvasElement, type: string) {
          if (type !== '2d') return null
          const ctx = {
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          } as any
          lastCtx = ctx
          return ctx
        }) as any

      // Some environments lack toDataURL; stub to a constant PNG data URL
      origToDataURL = (HTMLCanvasElement.prototype as any).toDataURL
      HTMLCanvasElement.prototype.toDataURL = vi
        .fn()
        .mockReturnValue('data:image/png;base64,xxx') as any

      // Intercept canvas and anchor creation to ensure consistent behavior across environments
      const origCreate = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
        const t = String(tagName).toLowerCase()
        if (t === 'canvas') {
          // Provide a stable mock canvas regardless of jsdom's implementation
          const ctx = {
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          } as any
          lastCtx = ctx
          const c: any = {
            _width: 0,
            _height: 0,
            get width() {
              return this._width
            },
            set width(v: number) {
              this._width = v
            },
            get height() {
              return this._height
            },
            set height(v: number) {
              this._height = v
            },
            getContext: vi.fn().mockImplementation((kind: string) => (kind === '2d' ? ctx : null)),
            toDataURL: vi.fn().mockReturnValue('data:image/png;base64,xxx'),
          }
          return c
        }
        if (t === 'a') {
          const a: any = {
            href: '',
            download: '',
            click: vi.fn(),
            remove: vi.fn(),
          }
          Object.defineProperty(a, 'download', {
            set(v: string) {
              createdDownloads.push(v)
            },
            get() {
              return createdDownloads.at(-1) || ''
            },
          })
          return a
        }
        return origCreate(tagName)
      })
    })

    afterEach(() => {
      (globalThis as any).Image = origImage
      URL.createObjectURL = origCreateObjectURL
      URL.revokeObjectURL = origRevokeObjectURL
      if (origGetContext !== undefined) {
        HTMLCanvasElement.prototype.getContext = origGetContext
      }
      if (origToDataURL !== undefined) {
        HTMLCanvasElement.prototype.toDataURL = origToDataURL
      }
      vi.restoreAllMocks()
    })

    it('fills white background before drawing and sets filename with date pattern', async () => {
      const wrapper = mount(TopCharts as any, {
        attachTo: document.body,
        props: { snapshots: makeSnaps() },
      })

      // Ensure there is an SVG element to export under data-chart="cpu"
      const root = wrapper.element.querySelector('[data-chart="cpu"]')!
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '800')
      svg.setAttribute('height', '160')
      root.appendChild(svg)

      // Click the primary Save button (default exportFormat is 'png')
      const saveBtn = wrapper.get(
        'figure[aria-label="CPU usage chart"] [data-save-menu] button:first-child'
      )
      await saveBtn.trigger('click')
      // Allow microtasks and timers to flush (image onload -> draw -> download name)
      await Promise.resolve()
      await new Promise(r => setTimeout(r, 0))

      // Find the mocked canvas context used inside export
      expect(lastCtx).toBeDefined()
      // Verify background fill was called with white
      expect(lastCtx.fillStyle).toBe('#fff')
      expect(lastCtx.fillRect).toHaveBeenCalled()

      // Verify a download filename with a loose date pattern exists
      const name = createdDownloads.at(-1) || ''
      expect(name.startsWith('top')).toBe(true)
      expect(name).toMatch(/\d{8}-\d{4}/) // YYYYMMDD-HHMM (seconds may follow)
    })
  })
})
