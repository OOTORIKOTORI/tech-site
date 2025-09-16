---
title: 'GitHub ActionsのcronはUTC！JSTで意図通りに動かす設計ガイド'
description: 'GitHub ActionsのcronはUTC基準。JST運用のための設計・変換・チェックリストを解説。'
date: '2025-09-16'
tags:
  - GitHubActions
  - cron
  - UTC
  - JST
  - 運用
  - 設計
---

GitHub Actions の cron は「UTC」基準です。JST で意図通りに動かすにはどう設計すればよいでしょうか？

# 仕様

cron 式はすべて UTC で解釈されます。JST で「毎日 9 時」に動かしたい場合、`0 0 * * *` ではなく `0 0 * * *`（JST→UTC 変換）に注意。

# 変換の勘所

JST(UTC+9)で 9 時 →UTC では 0 時。-9 時間シフトが必要です。

# 実例

```yaml
on:
  schedule:
    - cron: '0 0 * * *' # JST 9時にしたい場合は '0 0 * * *'（UTC 0時）
```

# よくある誤解

「JST で書けば自動で変換される」と思い込むと事故の元です。

# チェックリスト

- cron 式は必ず UTC 換算で記述
- テストや検証は[Cron JST ツール](/tools/cron-jst)で！
