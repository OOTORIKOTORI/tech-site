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

type MockFn = ReturnType<typeof vi.fn>

type CanvasMockRecord = {
  canvas: HTMLCanvasElement
  ctx: {
    fillStyle: string
    fillRect: MockFn
    drawImage: MockFn
    clearRect: MockFn
    save: MockFn
    restore: MockFn
    globalCompositeOperation: string
  }
}

const getCanvasRecords = () =>
  ((globalThis as any).__canvas2dMockRecords as CanvasMockRecord[] | undefined) ?? []

describe('Top Analyzer export (regression)', () => {
  describe('export: svg margin regression', () => {
    it('adds at least 12px padding when viewBox is absent', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '100')
      svg.setAttribute('height', '50')

      const xml = serializeSvgWithPadding(svg, 12)
      const viewBoxMatch = xml.match(/viewBox="([^"]+)"/)
      expect(viewBoxMatch).not.toBeNull()
      if (!viewBoxMatch) throw new Error('viewBox missing in serialized SVG')
      const viewBoxValue = viewBoxMatch[1]
      if (!viewBoxValue) throw new Error('viewBox values missing in serialized SVG')
      const [minX, minY, width, height] = viewBoxValue.split(/\s+/).map(Number)
      expect(minX).toBeLessThanOrEqual(0)
      expect(minY).toBeLessThanOrEqual(0)
      expect(width).toBeGreaterThanOrEqual(124)
      expect(height).toBeGreaterThanOrEqual(74)
      const widthMatch = xml.match(/width="([^"]+)"/)
      const heightMatch = xml.match(/height="([^"]+)"/)
      expect(widthMatch).not.toBeNull()
      expect(heightMatch).not.toBeNull()
      if (!widthMatch || !heightMatch) throw new Error('width/height missing in serialized SVG')
      const widthValue = widthMatch[1]
      const heightValue = heightMatch[1]
      if (!widthValue || !heightValue)
        throw new Error('width/height capture missing in serialized SVG')
      expect(Number(widthValue)).toBeGreaterThanOrEqual(124)
      expect(Number(heightValue)).toBeGreaterThanOrEqual(74)
    })

    it('retains or expands margins when viewBox already exists', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '100')
      svg.setAttribute('height', '50')
      svg.setAttribute('viewBox', '0 0 100 50')

      const xml = serializeSvgWithPadding(svg, 12)
      const viewBoxMatch = xml.match(/viewBox="([^"]+)"/)
      expect(viewBoxMatch).not.toBeNull()
      if (!viewBoxMatch) throw new Error('viewBox missing in serialized SVG')
      const viewBoxValue = viewBoxMatch[1]
      if (!viewBoxValue) throw new Error('viewBox values missing in serialized SVG')
      const [minX, minY, width, height] = viewBoxValue.split(/\s+/).map(Number)
      expect(minX).toBeLessThanOrEqual(0)
      expect(minY).toBeLessThanOrEqual(0)
      expect(width).toBeGreaterThanOrEqual(100)
      expect(height).toBeGreaterThanOrEqual(50)
      const widthMatch = xml.match(/width="([^"]+)"/)
      const heightMatch = xml.match(/height="([^"]+)"/)
      expect(widthMatch).not.toBeNull()
      expect(heightMatch).not.toBeNull()
      if (!widthMatch || !heightMatch) throw new Error('width/height missing in serialized SVG')
      const widthValue = widthMatch[1]
      const heightValue = heightMatch[1]
      if (!widthValue || !heightValue)
        throw new Error('width/height capture missing in serialized SVG')
      expect(Number(widthValue)).toBeGreaterThanOrEqual(100)
      expect(Number(heightValue)).toBeGreaterThanOrEqual(50)
    })
  })

  describe('export: png white background regression', () => {
    let origImage: any
    let origCreateObjectURL: typeof URL.createObjectURL
    let origRevokeObjectURL: typeof URL.revokeObjectURL
    let createdDownloads: string[]
    let createElementSpy: { mockRestore(): void } | undefined

    beforeEach(() => {
      createdDownloads = []

      origImage = (globalThis as any).Image
      class MockImage {
        onload: null | (() => void) = null
        width = 124
        height = 74
        set src(_value: string) {
          if (this.onload) this.onload()
        }
      }
      (globalThis as any).Image = MockImage

      origCreateObjectURL = URL.createObjectURL
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock') as any
      origRevokeObjectURL = URL.revokeObjectURL
      URL.revokeObjectURL = vi.fn() as any

      const origCreate = document.createElement.bind(document)
      createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
        const lower = String(tagName).toLowerCase()
        if (lower === 'a') {
          const link: any = {
            href: '',
            click: vi.fn(),
            remove: vi.fn(),
          }
          Object.defineProperty(link, 'download', {
            configurable: true,
            set(v: string) {
              createdDownloads.push(v)
            },
            get() {
              return createdDownloads.at(-1) ?? ''
            },
          })
          return link
        }
        return origCreate(tagName)
      })
    })

    afterEach(() => {
      (globalThis as any).Image = origImage
      URL.createObjectURL = origCreateObjectURL
      URL.revokeObjectURL = origRevokeObjectURL
      createElementSpy?.mockRestore()
    })

    it('fills exported PNGs with an opaque white background', async () => {
      const startCount = getCanvasRecords().length

      const wrapper = mount(TopCharts as any, {
        attachTo: document.body,
        props: { snapshots: makeSnaps() },
      })

      const root = wrapper.element.querySelector('[data-chart="cpu"]')!
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '100')
      svg.setAttribute('height', '50')
      root.appendChild(svg)

      const saveBtn = wrapper.get(
        'figure[aria-label="CPU usage chart"] [data-save-menu] button:first-child'
      )
      await saveBtn.trigger('click')
      await Promise.resolve()
      await new Promise(resolve => setTimeout(resolve, 0))

      const newRecords = getCanvasRecords().slice(startCount)
      expect(newRecords.length).toBeGreaterThan(0)
      const recorded =
        newRecords.find(r => r.ctx.fillRect.mock.calls.length > 0) ?? newRecords.at(-1)!
      const { canvas, ctx } = recorded

      expect(ctx.fillRect).toHaveBeenCalled()
      const fillRectArgs = ctx.fillRect.mock.calls[0]
      expect(fillRectArgs).toBeDefined()
      const [x, y, w, h] = fillRectArgs as [number, number, number, number]
      expect(x).toBe(0)
      expect(y).toBe(0)
      expect(w).toBe(canvas.width)
      expect(h).toBe(canvas.height)

      const normalizedFill = ctx.fillStyle?.toLowerCase()
      expect(['#fff', '#ffffff', 'white']).toContain(normalizedFill)

      const toDataURLMock = HTMLCanvasElement.prototype.toDataURL as MockFn
      const callIndex = toDataURLMock.mock.instances.findIndex(instance => instance === canvas)
      expect(callIndex).toBeGreaterThanOrEqual(0)
      const toDataUrlArgs = toDataURLMock.mock.calls[callIndex]
      if (toDataUrlArgs && toDataUrlArgs.length) {
        const [requestedType] = toDataUrlArgs as [string]
        expect(requestedType).toBe('image/png')
      }
      const result = toDataURLMock.mock.results[callIndex]
      const dataUrl = result && result.type === 'return' ? result.value : ''
      expect(dataUrl).toMatch(/^data:image\/png;base64,/)

      const downloadName = createdDownloads.at(-1) ?? ''
      expect(downloadName).toMatch(/^top-analyzer-cpu-\d{8}-\d{6}\.png$/)

      wrapper.unmount()
    })
  })
})
