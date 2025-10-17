export function serializeSvgWithPadding(svg: SVGSVGElement, padding = 12): string {
  // clone to avoid mutating the original
  const cloned = svg.cloneNode(true) as SVGSVGElement

  // compute bbox safely
  let bbox: DOMRect
  try {
    bbox = svg.getBBox()
  } catch {
    // fallback to viewBox or width/height
    const vb = svg.viewBox?.baseVal
    const w = vb?.width || parseFloat(svg.getAttribute('width') || '800') || 800
    const h = vb?.height || parseFloat(svg.getAttribute('height') || '160') || 160
    bbox = new DOMRect(0, 0, w, h)
  }
  const w = Math.ceil(bbox.width + padding * 2)
  const h = Math.ceil(bbox.height + padding * 2)
  const minX = Math.floor((bbox.x ?? 0) - padding)
  const minY = Math.floor((bbox.y ?? 0) - padding)

  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  cloned.setAttribute('version', '1.1')
  cloned.setAttribute('width', String(w))
  cloned.setAttribute('height', String(h))
  cloned.setAttribute('viewBox', `${minX} ${minY} ${w} ${h}`)
  cloned.setAttribute('overflow', 'visible')

  // white background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('x', String(minX))
  bg.setAttribute('y', String(minY))
  bg.setAttribute('width', String(w))
  bg.setAttribute('height', String(h))
  bg.setAttribute('fill', 'white')
  cloned.insertBefore(bg, cloned.firstChild)

  return new XMLSerializer().serializeToString(cloned)
}
