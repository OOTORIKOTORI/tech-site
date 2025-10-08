param(
  [Parameter(Mandatory=$true)][string]$Tag
)

Write-Host "[rollback] Fetching all tags..."
git fetch --all --tags
if ($LASTEXITCODE -ne 0) { Write-Error "[rollback] git fetch failed"; exit 1 }

Write-Host "[rollback] Restoring worktree and index from $Tag..."
git restore --source $Tag --worktree --staged .
if ($LASTEXITCODE -ne 0) { Write-Error "[rollback] git restore failed"; exit 1 }

Write-Host "[rollback] Installing dependencies..."
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Error "[rollback] pnpm install failed"; exit 1 }

Write-Host "[rollback] Committing snapshot revert..."
git commit -am "revert(snapshot): restore repository tree to $Tag"
if ($LASTEXITCODE -ne 0) { Write-Error "[rollback] git commit failed (no changes?)"; exit 1 }

Write-Host "[rollback] Pushing to remote..."
git push
if ($LASTEXITCODE -ne 0) { Write-Error "[rollback] git push failed"; exit 1 }

Write-Host "[rollback] Done. Repository restored to $Tag and pushed."
