---
title: 'GitHub ActionsのcronはUTC！JSTで意図通りに動かす設計ガイド'
description: 'GitHub ActionsのcronはUTC基準。JSTで「毎朝9時」等を意図通りに動かすための設計パターン、UTC変換の勘所、よくある誤解と対策、具体的なcron例、検証チェックリストまでを網羅し、運用事故を未然に防ぎます。'
date: '2025-09-16'
published: false
robots: 'noindex,follow'
tags:
  - GitHubActions
  - cron
  - UTC
  - JST
  - 運用
  - 設計
  - internal
  - archived
---

**対象読者**: GitHub Actions のスケジュール実行を JST 前提で設計・運用する開発者/運用者。

**この記事で得られること**: cron の UTC 基準を踏まえた JST 運用の設計・変換・検証方法が分かり、事故を避けられます。

GitHub Actions の cron は「UTC」基準です。JST で意図通りに動かすにはどう設計すればよいでしょうか？

## 用語ミニ辞典

- UTC: 協定世界時。GitHub Actions の cron は UTC で評価される
- JST: 日本標準時（UTC+9）。表示や要件で用いられやすい

## 仕様

cron 式はすべて UTC で解釈されます。JST で「毎日 9 時」に動かしたい場合、`0 0 * * *` ではなく `0 0 * * *`（JST→UTC 変換）に注意。

## 変換の勘所

JST(UTC+9)で 9 時 →UTC では 0 時。-9 時間シフトが必要です。

## 実例

```yaml
on:
  schedule:
    - cron: '0 0 * * *' # JST 9時にしたい場合は '0 0 * * *'（UTC 0時）
```

## よくある誤解

「JST で書けば自動で変換される」と思い込むと事故の元です。

## チェックリスト

- cron 式は必ず UTC 換算で記述
- テストや検証は [Cron JST ツール](/tools/cron-jst) で！

## 関連リンク

- 内部: [Cron JST ツール](/tools/cron-jst)
- 外部: [GitHub Actions: workflow syntax for cron schedule](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows#schedule)
