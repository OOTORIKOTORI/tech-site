Param(
  [ValidateSet('patch','minor','major')]
  [string]$bump = 'patch'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-NextVersion([string]$last, [string]$bump) {
  if (-not $last) { $last = 'v0.0.0' }
  # Strictly parse vX.Y.Z
  if ($last -notmatch '^v(?<maj>\d+)\.(?<min>\d+)\.(?<patch>\d+)$') {
    throw "Last tag '$last' is not semver (vX.Y.Z)"
  }
  $M = [int]$Matches.maj
  $m = [int]$Matches.min
  $p = [int]$Matches.patch
  switch ($bump) {
    'major' { $M++; $m = 0; $p = 0 }
    'minor' { $m++; $p = 0 }
    default { $p++ }
  }
  return "v$M.$m.$p"
}

# Get last tag (if none, treat as v0.0.0)
$LAST = (git describe --tags --abbrev=0 2>$null)
if (-not $LAST) { $LAST = 'v0.0.0' }
$NEXT = Get-NextVersion $LAST $bump

Write-Host "Last: $LAST -> Next: $NEXT (bump=$bump)"

# Skip if tag already exists
$null = git rev-parse -q --verify "refs/tags/$NEXT" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $NEXT already exists; skipping."
  exit 0
}

# Create annotated tag and push only that tag
git tag -a $NEXT -m "$NEXT"
git push origin $NEXT
