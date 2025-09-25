// 再エクスポート用：ここで #content から読み出し、一箇所に閉じ込める
// 実際には build 後 .nuxt/imports.d.ts により unimport 対象になる想定
// 型衝突・未解決の場合は ts-ignore で逃がし最小差分対応
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export { queryContent } from '#content'
