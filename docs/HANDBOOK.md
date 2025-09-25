# HANDBOOK — Migaki Explorer

## Copilot 運用ガイド（最小差分）

- 目的: README / PROJECT_SPEC / HANDBOOK の整合と軽微リファクタ（重複削減/誤記修正/テスト補完）を高速支援すること。
- 範囲: docs 変更・小さなテスト/型補助のみ。アプリ本体の大規模改変・設定変更（CI/ビルド/Tailwind/tsconfig）は人間レビュー前提で自動提案しない。
- 制約:
  - コード全文/巨大ファイルは貼らず必要最小断片のみ。
  - 既存ポリシー（OGP 既定 302 / ORIGIN 一元化 / SemVer 判定）を変更しない。
  - 既存見出しアンカーは維持（挿入は既存節の直後に最小追記）。
  - 差分は最小（不要な再整形・語順変更禁止）。
- 受け入れ基準 (AC):
  - `pnpm typecheck && pnpm lint -f unix && pnpm test -- --run` が green。
  - 3 文書間の事実（ORIGIN 値/CI 手順/OGP 既定動作）が矛盾しない。
  - 変更範囲は docs（src/\* 非変更）か、変更理由が明示された軽微テストのみ。
- 禁止事項:
  - 無断コミット/タグ/バージョン付与。
  - 大量リライト（主観的言い換え/語調統一目的のみの変更）。
  - 秘密情報/環境変数値の生成・埋め込み。
  - 不要な依存追加・設定ファイル新設。
- 作業指針:
  1.  変更意図を 1 行で明示。
  2.  対象ファイルを読み取り → 最小差分パッチ → 自己検証（typecheck/lint/test）。
  3.  失敗時はログ要約 → 原因仮説 → 最大 2 回まで再試行。以降は人間判断へ委ねる。
- ロールバック方針: lint/typecheck/test 失敗時は当該差分を revert し、失敗再現手順を記述。
- 品質メモ: ドキュメント間の冗長は HANDBOOK=恒久規約 / PROJECT_SPEC=正準仕様 / README=要点 の序列で集約する（下位で詳細を重複させない）。

## 1. Git 運用

- コミット/プッシュ/タグは **手動**（Copilot はコミット禁止）
- Commit msg: `feat|fix|docs|chore|ci: summary`（SemVer 連動）
- 小さく安全に、1 トピック=1 コミット

## 2. ブランチ/PR

- 基本ブランチ: `main`
- 原則小さめ PR（直 push 許容の場合も最小差分を徹底）

## 3. ドキュメント権威

- 正: `PROJECT_SPEC.md` ／ 要点: `README.md` ／ 恒久規約: `docs/HANDBOOK.md`
- 見出し・アンカー維持、文面は必要最小限のみ変更

## 4. ORIGIN/公開

- `NUXT_PUBLIC_SITE_ORIGIN=https://migakiexplorer.jp`
- Preview(`*.vercel.app`)は `X-Robots-Tag: noindex, nofollow`

## 5. OGP

- 既定: 302 → `/og-default.png`
- `ENABLE_DYNAMIC_OG=1` で動的 PNG、`LOG_OG=1` はスポットのみ

## 6. 構造化データ

- Organization.logo / BlogPosting.publisher.logo は絶対 URL
- BreadcrumbList: `/blog`, `/blog/[slug]`

## 7. a11y

- `.focus-ring` 統一
- Lighthouse Accessibility ≥ 90（閾値は `PROJECT_SPEC.md` の正準値に準拠）

## 8. CI パイプライン & ブロッカー

- `install → typecheck → lint → test → build → postbuild(--check-only) → smoke:og → LHCI`
- CI 失敗は出荷ブロック

## 9. リリース/タグ

- SemVer: feat=MINOR / fix|docs|ci=PATCH / 破壊的=MAJOR
- 手動タグ `vX.Y.Z`、簡潔なリリースノート

## 10. ログ/秘密

- Secrets は環境変数にのみ。リポジトリ禁止
- PII/トークンのログ出力禁止。漏えい疑いは即ローテート

## Handover Checklist

- Spec sync: `PROJECT_SPEC.md`（正）と `README.md`（要点）に差分がないか。必要なら最小追記。
- Health checks: CI 全緑（typecheck/lint/test/build/postbuild --check-only/smoke:og/LHCI≥90）。ORIGIN/プレビュー noindex も確認。
- Ops rules: 本 HANDBOOK のルールに逸脱がないか。必要なら本書を最小更新。
- Comms: PR 本文に「Handover Summary（Done/Next/Ops/Checks）」を記載（テンプレ参照）。
- Versioning: 変更内容に応じて SemVer を決定（feat=MINOR, fix/docs/ci=PATCH, 破壊的=MAJOR）。
- Release: 手動で `git tag vX.Y.Z && git push --follow-tags`。ノートは簡潔に。
- Optional: Manifest（`name`/`short_name`）のブランド準拠を確認（任意）。
- Logging: 機密を出さない。`LOG_OG=1` は短時間スポットのみ。

### PR 本文テンプレ（コピペ用）

```
### Handover Summary
Done:
- （例）README の 3 文サマリ追加 / 重複節統合

Now:
- （例）次リリースタグ検討中（feat 1 件 → MINOR 想定）

Next:
- （例）/tools 新規ツールの軽量 PoC（未着手）

Ops:
- ORIGIN= https://migakiexplorer.jp / Preview noindex 動作確認済み
- OGP API 既定 302 / 動的 OFF（想定どおり）

Checks:
- typecheck / lint / test / build / postbuild(--check-only) / smoke:og / LHCI ≥ 基準 green
- sitemap/robots ホスト一致ログ OK
```
