// @ts-nocheck
/* eslint-disable import/no-extraneous-dependencies */
import { ImageResponse } from '@vercel/og'
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

  let decoded = ''
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return redirectDefault()
  }

  const title = (decoded || 'KOTORI Lab').replace(/\s+/g, ' ').slice(0, 120)
  if (!title.trim() || /[\u0000-\u001F\u007F]/.test(title)) {
    return redirectDefault()
  }

  try {
    const fontSize = 64
    const img = new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f3f4f6',
            color: '#111827',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              padding: '0 80px',
              textAlign: 'center',
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: '20px', fontSize: '28px', color: '#4b5563' }}>
            KOTORI Lab — Tech Tools & Notes
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
    // Ensure no-store on successful generation as well
    if (img && typeof img.headers?.set === 'function') {
      img.headers.set('Cache-Control', 'no-store')
    }
    return img
  } catch {
    return redirectDefault()
  }
})
