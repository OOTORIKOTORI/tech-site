/* eslint-disable import/no-extraneous-dependencies */
import { ImageResponse } from '@vercel/og'
import type { H3Event } from 'h3'
import { defineEventHandler, getRouterParam } from 'h3'

export const runtime = 'edge'

export default defineEventHandler(async (event: H3Event) => {
  const slug = getRouterParam(event, 'slug') || 'KOTORI Lab'
  const title = decodeURIComponent(slug).replace(/\s+/g, ' ').slice(0, 120)

  try {
    const fontSize = 64
    return new ImageResponse(
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
  } catch {
    const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
    return Response.redirect(`${siteUrl}/og-default.png`, 302)
  }
})
