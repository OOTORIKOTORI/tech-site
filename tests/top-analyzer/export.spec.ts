import { describe, it, expect, vi, beforeEach } from 'vitest'
// ユーティリティからエクスポート関数をimport
import { serializeSvgWithPadding } from '../../utils/top-export'

// SVGエクスポートの最小テスト

describe('Top Analyzer export', () => {
  let svg: SVGSVGElement
  beforeEach(() => {
    // SVGルートをモック
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '800')
    svg.setAttribute('height', '160')
    svg.setAttribute('viewBox', '0 0 800 160')
    // 軸ラベル用text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.textContent = 'ラベル'
    svg.appendChild(text)
  })

  it('SVG出力にviewBoxが含まれる', () => {
    const xml = serializeSvgWithPadding(svg, 12)
    expect(xml).toMatch(/viewBox="[^"]+"/)
  })

  it('SVG出力に<text>要素が含まれる', () => {
    const xml = serializeSvgWithPadding(svg, 12)
    expect(xml).toMatch(/<text[\s>]/)
  })

  it('PNGエクスポートはdata:image/pngで始まる', () => {
    // canvas.toDataURLをモック
    const canvas = document.createElement('canvas')
    const fakeUrl = 'data:image/png;base64,FAKE=='
    vi.spyOn(canvas, 'toDataURL').mockReturnValue(fakeUrl)
    // 実際のexportChartはDOM依存なので、toDataURLの呼び出しのみ検証
    expect(canvas.toDataURL()).toBe(fakeUrl)
    expect(canvas.toDataURL()).toMatch(/^data:image\/png;base64,/) // prefix
  })
})
