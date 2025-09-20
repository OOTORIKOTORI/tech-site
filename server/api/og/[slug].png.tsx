// @ts-nocheck
/* eslint-disable import/no-extraneous-dependencies */
import { defineEventHandler, getRouterParam, getMethod } from '#imports'
import { resolveSiteUrl } from '../../../utils/siteUrl'

export const runtime = 'edge'

export default defineEventHandler(async event => {
  const raw = getRouterParam(event, 'slug') || ''
  const siteUrl = resolveSiteUrl(event).replace(/\/$/, '')

  const redirectDefault = () => {
    const res = Response.redirect(`${siteUrl}/og-default.png`, 302)
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-OG-Fallback', '1')
    return res
  }

  // HEAD は本文生成を行わず、デフォ画像へフォールバック
  const method = (
    typeof getMethod === 'function' ? getMethod(event) : event?.node?.req?.method || 'GET'
  ).toUpperCase()
  if (method === 'HEAD') return redirectDefault()

  try {
    // Import dynamically; throw-through on failure handled by catch
    let ImageResponse
    ;({ ImageResponse } = await import('@vercel/og'))

    // Decode/validate slug minimally
    const decoded = decodeURIComponent(raw || '')
    const title = (decoded || 'OG').replace(/\s+/g, ' ').slice(0, 120)
    if (!title.trim() || /[\u0000-\u001F\u007F]/.test(title)) throw new Error('invalid-title')

    // Minimal JSX, no Node APIs
    const img = new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            color: '#111827',
            fontFamily: 'sans-serif',
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          {title}
        </div>
      ),
      { width: 1200, height: 630 }
    )
    if (img && typeof img.headers?.set === 'function') img.headers.set('Cache-Control', 'no-store')
    return img
  } catch {
    return redirectDefault()
  }
})
