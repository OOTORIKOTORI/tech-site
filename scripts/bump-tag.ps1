
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

$LAST = (git describe --tags --abbrev=0 2>$null)
$NEXT = Get-NextVersion $LAST $bump

Write-Host "Last: $LAST -> Next: $NEXT (bump=$bump)"

# 既存なら何もしない（冪等）
if (git rev-parse -q --verify "refs/tags/$NEXT" 1>$null 2>$null) {
  Write-Host "Tag $NEXT already exists; skipping."
  exit 0
}

# Annotated tag を作成して push（※ -a が重要）
git tag -a $NEXT -m "$NEXT"
git push origin $NEXT
