import { resolveSiteUrl } from '../../utils/siteUrl'

export default function () {
  try {
    const url = resolveSiteUrl()
    // One-time info log for SSR boot
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'production') {
      console.info('[url]', process.env.VERCEL_ENV, url)
    }
  } catch {
    // ignore
  }
}
