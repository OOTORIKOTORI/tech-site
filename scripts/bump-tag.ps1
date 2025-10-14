git tag -a $NEXT -m "$NEXT"
git push origin $NEXT
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Param(
  [ValidateSet('patch','minor','major')]
  [string]$bump = 'patch'
)

function Get-NextVersion([string]$last, [string]$bump) {
  if (-not $last) { $last = 'v0.0.0' }
  $v = [Version]($last.TrimStart('v'))
  switch ($bump) {
    'major' { $v = [Version]::new($v.Major + 1, 0, 0) }
    'minor' { $v = [Version]::new($v.Major, $v.Minor + 1, 0) }
    default { $v = [Version]::new($v.Major, $v.Minor, $v.Build + 1) }
  }
  return "v$($v.Major).$($v.Minor).$($v.Build)"
}

# 直近タグを取得（無ければ v0.0.0 扱い）
$LAST = (git describe --tags --abbrev=0 2>$null)
if (-not $LAST) { $LAST = 'v0.0.0' }
$NEXT = Get-NextVersion $LAST $bump

Write-Host "Last: $LAST -> Next: $NEXT (bump=$bump)"

# 既存チェック（パース安定のため、括弧 if (...) ではなく $LASTEXITCODE を使う）
$null = git rev-parse -q --verify "refs/tags/$NEXT" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $NEXT already exists; skipping."
  exit 0
}

# annotated tag を作成して push
git tag -a $NEXT -m "$NEXT"
git push origin $NEXT
