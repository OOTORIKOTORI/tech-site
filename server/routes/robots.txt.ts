export default defineEventHandler(e => {
  setHeader(e, 'Content-Type', 'text/plain; charset=utf-8')
  // LF 改行を明示
  return ['User-agent: *', 'Allow: /', 'Sitemap: https://migakiexplorer.jp/sitemap.xml'].join('\n')
})
