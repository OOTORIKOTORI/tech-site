# HANDBOOK — Migaki Explorer

## 1. Git 運用

- コミット/プッシュ/タグは **手動**（Copilot はコミット禁止）
- Commit msg: `feat|fix|docs|chore|ci: summary`（SemVer 連動）
- 小さく安全に、1 トピック=1 コミット

## 2. ブランチ/PR

- 基本ブランチ: `main`
- 原則小さめ PR（直 push 許容の場合も最小差分を徹底）

## 3. ドキュメント権威

- 正: `PROJECT_SPEC.md`／要点: `README.md`
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
- Lighthouse Accessibility ≥ 95（CI でチェック）

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
- Health checks: CI 全緑（typecheck/lint/test/build/postbuild --check-only/smoke:og/LHCI≥95）。ORIGIN/プレビュー noindex も確認。
- Ops rules: 本 HANDBOOK のルールに逸脱がないか。必要なら本書を最小更新。
- Comms: PR 本文に「Handover Summary（Done/Next/Ops/Checks）」を記載（テンプレ参照）。
- Versioning: 変更内容に応じて SemVer を決定（feat=MINOR, fix/docs/ci=PATCH, 破壊的=MAJOR）。
- Release: 手動で `git tag vX.Y.Z && git push --follow-tags`。ノートは簡潔に。
- Optional: Manifest（`name`/`short_name`）のブランド準拠を確認（任意）。
- Logging: 機密を出さない。`LOG_OG=1` は短時間スポットのみ。
