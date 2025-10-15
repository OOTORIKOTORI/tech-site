---
title: 'LHCIグリーン維持のコツ'
description: 'Lighthouse CIで常にグリーンを保つための運用ポイントを簡潔にまとめました。'
published: true
draft: false
date: '2025-10-15'
tags:
  - 'devlog'
canonical: ''
---

CI の **best-practices** スコアを安定してグリーンに保つための実践メモです（運用寄り）。

## すぐ効くチェック 5 つ

1. **外部リンクの安全性**
   `target="_blank"` には `rel="noopener noreferrer"` を付ける。
   例: `<a href="…" target="_blank" rel="noopener noreferrer">`

2. **非推奨 API を使わない**
   依存パッケージのアップデートで古い API 呼び出しを除去。Lint 警告の放置はスコア低下に直結。

3. **画像の寸法を明記**
   レイアウトシフトを避けるため、`<img>` に **width/height** を付けるか、CSS でアスペクト比を固定。

4. **HTTPS/セキュリティヘッダの確認**
   本番は HTTPS 前提。`X-Content-Type-Options: nosniff` 等が付く構成に。

5. **コンソールエラー/404 の除去**
   参照切れや小さなエラーでも減点対象。リリース前にブラウザのコンソールとネットワークタブを一度空に。

## ローカルで素早く見る

- **デスクトップ/モバイルの設定**は `.lighthouserc.*.json` を利用。
- サーバ起動後に `npx @lhci/cli collect --config .lighthouserc.desktop.json` などで短時間チェックできます。

## 運用のポイント

- 「一度に 100 点」を狙うより、**しきい値を少しずつ上げる**のが安定（例: 0.70 → 0.75）。
- スコアが落ちたら**直近の差分だけ**を疑う（画像追加・外部スクリプト増など）。
- 変更は小さく、**CI がグリーンのうちに早めにタグ**を切る。
