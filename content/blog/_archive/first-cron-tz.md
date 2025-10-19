---
benefits: ""
for: ""
audience: ["初心者","中級者"]
title: 'Cron の DOM×DOW は OR？AND？— タイムゾーン（JST/UTC）の落とし穴と対処法'
description: 'crontabのDOM×DOW（OR/AND）の違いと、JST/UTC変換で起こる境界ズレの典型事故を、設計指針・検証手順・運用チェックリスト付きで解説。GitHub Actions等の実運用で迷わない基礎固め。'
date: '2025-09-20'
published: false
robots: 'noindex,follow'
tags:
  - cron
  - timezone
  - JST
  - UTC
  - scheduler
  - internal
  - archived
draft: false
canonical: 'https://migakiexplorer.jp/blog/first-cron-tz'
---

**対象読者**: CI/CD やサーバのスケジュール実行を JST 前提で運用するエンジニア・SRE。

**この記事で得られること**: DOM×DOW の OR/AND 差異と JST/UTC 変換での落とし穴を避ける設計・検証・運用チェックリストが分かります。

## 用語ミニ辞典（30 秒で把握）

- DOM: day-of-month（「日」フィールド）
- DOW: day-of-week（「曜日」フィールド）
- OR/AND: DOM と DOW を同時指定したときの評価論理（実装により異なる）

## なぜ DOM×DOW が「難しい」のか

伝統的な crontab では、日（DOM: day-of-month）と曜日（DOW: day-of-week）の判定は「OR（どちらか一致で実行）」として扱われる実装が多いです。一方で、一部のジョブスケジューラ／クラウド実行基盤では AND を選べる／既定にしていることもあり、混乱の元になりがちです。本サイトの実装では `dowDomMode: 'OR' | 'AND'` を明示的に切り替えられるようにしています。

## `*` の扱い（OR/AND での意味合い）

- OR モード: `DOM=*` は「日による制約なし」、`DOW=*` も同様。両方 `*` なら常に真（実質的に他フィールドのみ判定）。
- AND モード: `DOM=*` は「常に真」なので DOW 側のみで判定、`DOW=*` も対称。両方 `*` なら常に真。

この違いは、式をリファクタリングするときに意味を変えてしまう典型ポイントです。

## JST/UTC の境界で起きること（具体例）

日本時間（JST=UTC+9）と UTC の日付境界がずれるため、例えば「毎週月曜 0:05（JST）」は UTC では日曜日 15:05 になります。DOM×DOW を併用していると、以下のような落とし穴が生じます。

例: `5 0 1 * MON`（毎月 1 日かつ毎週月曜の 0:05）

- OR モード: 「毎月 1 日 0:05」または「毎週月曜 0:05」のいずれかで実行。JST で合っていても、UTC 換算では前日/翌日に跨いで DOW 判定が想定外になることがある。
- AND モード: 「毎月 1 日 かつ 毎週月曜」の条件が同時に真になる場合のみ実行。JST<->UTC 変換のタイミングで DOM/DOW のどちらかが意図せず外れることがある。

対処の基本は「検算」と「基準タイムゾーンの固定」です。実行環境（サーバ／マネージド基盤）がどの TZ を基準に評価するかを確認し、必要に応じて UTC 固定で式を設計するか、アプリ側で JST/UTC の両観点での次回実行を検証します。

## 運用チェックリスト

- 実行基盤の評価タイムゾーン（UTC/JST）を把握したか
- DOM×DOW の論理（OR/AND）と `*` の意味がチームで共有されているか
- 月またぎ／週またぎ／年末年始など境界ケースを具体時刻で検算したか
- 監視やリトライ方針（1 回漏れても検知できるか）を決めているか

## サンプル（JST 前提での平日朝実行）

```text
0 9 * * 1-5
```

## 関連リンク

- 内部: [Cron JST ツール](/tools/cron-jst)
- 内部: [本シリーズの導入編](/blog/cron-jst-intro)
- 外部: [crontab(5) — Linux man-pages](https://man7.org/linux/man-pages/man5/crontab.5.html)

JST の 9:00 に平日実行。UTC では 0:00 実行として解釈されるため、UTC 基盤に載せる場合は 0:00 に設定するか、アプリ側で TZ 変換を前提に設計します。
