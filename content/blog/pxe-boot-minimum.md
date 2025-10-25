---
title: PXEブート最小セット：これだけ押さえる
description: DHCP/TFTP/NFS の役割と、最小セットアップの道筋だけ。
tags:
  - pxe
  - boot
  - infra
date: 2025-10-15T00:00:00.000Z
draft: true
audience: キッティング担当・インフラ初学者（PXEで最小ブートだけしたい人）
type: guide
visibility: hidden
robots: noindex
---
> **この記事はこういう人におすすめ**: （for）
> **この記事で得られること**: （benefits）


## 全体像（最短）

- DHCP=IP/ブート先通知、TFTP=ブートローダ配布、NFS=ルート fs 共有（環境により HTTP/Samba 可）。

## 最小セットアップ

1. DHCP で `next-server` と `filename` を配布（例: `pxelinux.0`）。
2. TFTP にブートローダと設定（`pxelinux.cfg/default`）を置く。必要に応じて NFS/HTTP でカーネル/イメージ提供。

## つまずきポイント

- UDP/67,69, TCP/2049 等の開放、L2 セグメント越えのブロードキャスト制約に注意。
