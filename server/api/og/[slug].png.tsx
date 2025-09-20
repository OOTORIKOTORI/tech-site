// @ts-nocheck
/* eslint-disable import/no-extraneous-dependencies */
import { defineEventHandler, getMethod, getRequestURL } from '#imports'

// runtime can be 'edge' or 'node'; keep 'edge' by default
export const runtime = 'edge'

// Minimal implementation: always redirect to default OGP
// Note: Dynamic generation is disabled for stability. Re-enable behind a flag later if needed.
export default defineEventHandler(async event => {
  const origin = getRequestURL(event).origin
  const loc = `${origin}/og-default.png`
  // Both GET and HEAD follow the same path
  void getMethod(event) // accessed to mirror existing usage if needed; not strictly required
  /*
   * TODO(og): 将来的に動的OGP生成を再有効化する際は、
   * process.env.ENABLE_DYNAMIC_OG === '1' のときのみ実行する。
   * 以下は雛形（コメントアウトのまま保持）。
   *
   * if (process.env.ENABLE_DYNAMIC_OG === '1') {
   *   try {
   *     const { ImageResponse } = await import('@vercel/og')
   *     const title = 'OG'
   *     const img = new ImageResponse(
   *       <div style={{
   *         width: '1200px', height: '630px', display: 'flex',
   *         alignItems: 'center', justifyContent: 'center',
   *         background: '#ffffff', color: '#111827', fontFamily: 'sans-serif',
   *         fontSize: 64, fontWeight: 800,
   *       }}> {title} </div>,
   *       { width: 1200, height: 630 }
   *     )
   *     if (img && typeof img.headers?.set === 'function') {
   *       img.headers.set('Cache-Control', 'no-store')
   *     }
   *     return img
   *   } catch {
   *     // フォールバック: 下の 302 リダイレクトへ
   *   }
   * }
   */
  return new Response(null, {
    status: 302,
    headers: {
      Location: loc,
      'Cache-Control': 'no-store',
      'X-OG-Fallback': '1',
    },
  })
})
