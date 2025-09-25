// '#content' からの直接 import を usePosts.ts から外すための仲介モジュール
// 型解決で問題が出る場合は ts-ignore で抑制
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { queryContent } from '#content'

export const contentQuery = queryContent
