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
  $major = [int]$Matches.maj
  $minor = [int]$Matches.min
  $patch = [int]$Matches.patch
  switch ($bump) {
    'major' { $major++; $minor = 0; $patch = 0 }
    'minor' { $minor++; $patch = 0 }
    default { $patch++ }
  }
  return "v$major.$minor.$patch"
}


$tags = git tag --list "v*.*.*"
Write-Host "[DEBUG] tags: $tags"
if ($tags) {
  $latest = $tags | Sort-Object { [version]($_ -replace '^v','') } -Descending | Select-Object -First 1
  $LAST = $latest
} else {
  $LAST = 'v0.0.0'
}
$NEXT = Get-NextVersion $LAST $bump

Write-Host "Last: $LAST -> Next: $NEXT (bump=$bump)"

# Skip if tag already exists locally
$null = git rev-parse -q --verify "refs/tags/$NEXT" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $NEXT already exists locally; skipping."
  exit 0
}

# Create annotated tag
git tag -a $NEXT -m "$NEXT"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to create tag $NEXT" -ForegroundColor Red
  exit 1
}

# Check if tag already exists on remote
$null = git ls-remote --tags origin "refs/tags/$NEXT" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "Tag $NEXT already exists on remote; skipping push."
  Write-Host "✓ Tag created locally: $NEXT" -ForegroundColor Green
  exit 0
}

# Push only that tag
git push origin $NEXT
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Created and pushed tag: $NEXT" -ForegroundColor Green
} else {
  Write-Host "Failed to push tag $NEXT" -ForegroundColor Red
  exit 1
}
