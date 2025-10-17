---
title: Internal Control (Renderer/Body/Route)
description: 常時検証用の制御記事（一覧/詳細の健全性チェックに使用）
date: 2025-01-01
draft: false
published: true
tags: [internal, control]
robots: 'noindex,follow'
canonical:
audience: 'サイト運用・開発者（まずは最短で直したい人）'
---

この投稿は、/blog 詳細ページの **1 経路取得**・**`doc?.body` の存在**・**`<ContentRenderer :value="doc" />` の固定描画**を検証するための制御記事です。

本文は 2 段落構成のみ。表示できれば「白紙なし」が満たされ、未知 slug では 404 になることと合わせて、E2E で恒常チェックします。
