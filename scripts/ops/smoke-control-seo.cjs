#!/usr/bin/env node

/**
 * Smoke test for control/robots and feed/sitemap validation
 * - /blog/_control should have <meta name="robots" content="noindex,follow">
 * - /blog/jwt-basics and /blog should NOT have <meta name="robots"
 * - /feed.xml and /sitemap.xml should NOT contain "_control"
 */

const base = process.env.BASE_URL || 'http://127.0.0.1:3000'

async function get(path) {
  const url = base + path
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`)
    }
    return await response.text()
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`)
  }
}

async function main() {
  try {
    // 1. /blog/_control should have noindex,follow meta
    console.log('Checking /blog/_control robots meta...')
    const controlHtml = await get('/blog/_control')
    const hasNoindexMeta = controlHtml
      .toLowerCase()
      .includes('<meta name="robots" content="noindex,follow">')
    if (!hasNoindexMeta) {
      console.error('NG: /blog/_control missing <meta name="robots" content="noindex,follow">')
      process.exit(1)
    }

    // 2. /blog/jwt-basics should NOT have robots meta
    console.log('Checking /blog/jwt-basics robots meta...')
    const jwtBasicsHtml = await get('/blog/jwt-basics')
    const hasRobotsMeta1 = jwtBasicsHtml.toLowerCase().includes('<meta name="robots"')
    if (hasRobotsMeta1) {
      console.error('NG: /blog/jwt-basics should NOT have <meta name="robots"')
      process.exit(1)
    }

    // 3. /blog should NOT have robots meta
    console.log('Checking /blog robots meta...')
    const blogIndexHtml = await get('/blog')
    const hasRobotsMeta2 = blogIndexHtml.toLowerCase().includes('<meta name="robots"')
    if (hasRobotsMeta2) {
      console.error('NG: /blog should NOT have <meta name="robots"')
      process.exit(1)
    }

    // 4. /feed.xml should NOT contain "_control"
    console.log('Checking /feed.xml content...')
    const feedXml = await get('/feed.xml')
    if (feedXml.includes('_control')) {
      console.error('NG: /feed.xml should NOT contain "_control"')
      process.exit(1)
    }

    // 5. /sitemap.xml should NOT contain "_control"
    console.log('Checking /sitemap.xml content...')
    const sitemapXml = await get('/sitemap.xml')
    if (sitemapXml.includes('_control')) {
      console.error('NG: /sitemap.xml should NOT contain "_control"')
      process.exit(1)
    }

    console.log('OK: smoke passed')
    process.exit(0)
  } catch (error) {
    console.error(`NG: ${error.message}`)
    process.exit(1)
  }
}

main()
