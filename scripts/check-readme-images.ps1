<#
.SYNOPSIS
    Checks the README screenshot links and the docs/screenshots folder before committing.

.DESCRIPTION
    1. Finds every image link of the form ](docs/screenshots/...) in README.md and reports OK or MISSING.
    2. Scans text-searchable files in docs/screenshots for JWT tokens (eyJ...), password
       assignments and e-mail addresses. Binary images (PNG, GIF, JPG, ...) cannot be
       inspected here, so they are reported and must be checked by eye.
    3. Warns about any file in docs/screenshots larger than 10 MB.

    Exits with code 1 if any linked image is MISSING.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/check-readme-images.ps1
#>

$ErrorActionPreference = 'Stop'

$repoRoot   = Split-Path -Parent $PSScriptRoot
$readmePath = Join-Path $repoRoot 'README.md'
$shotsDir   = Join-Path $repoRoot 'docs/screenshots'
$maxBytes   = 10MB

$binaryExtensions = @('.png', '.gif', '.jpg', '.jpeg', '.webp', '.mp4', '.mov', '.pdf', '.ico')
$textExtensions   = @('.svg', '.txt', '.md', '.json', '.html', '.htm', '.csv', '.log', '.xml')

$missing  = 0
$warnings = 0

# 1. Image links in README.md
$readme   = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8
$linkMatches = [regex]::Matches($readme, '\]\((docs/screenshots/[^)\s]+)\)')
$expected    = @($linkMatches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)

Write-Host 'Image links in README.md:'
if ($expected.Count -eq 0) {
    Write-Host '  (no docs/screenshots links found)'
}
foreach ($link in $expected) {
    $fullPath = Join-Path $repoRoot $link
    if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
        Write-Host "  OK       $link"
    } else {
        Write-Host "  MISSING  $link"
        $missing++
    }
}

# 2. Files actually present in docs/screenshots
Write-Host ''
Write-Host 'Files in docs/screenshots:'
$files = @()
if (Test-Path -LiteralPath $shotsDir -PathType Container) {
    $files = @(Get-ChildItem -LiteralPath $shotsDir -File | Where-Object { $_.Name -ne '.gitkeep' })
}
if ($files.Count -eq 0) {
    Write-Host '  (no files yet)'
}
foreach ($file in $files) {
    $sizeMb = [math]::Round($file.Length / 1MB, 2)
    $ext    = $file.Extension.ToLowerInvariant()

    if ($file.Length -gt $maxBytes) {
        Write-Host "  WARN     $($file.Name) is $sizeMb MB (larger than 10 MB)"
        $warnings++
    }

    if ($binaryExtensions -contains $ext) {
        Write-Host "  WARN     $($file.Name): binary image, cannot inspect its content. Check it by eye."
        $warnings++
        continue
    }

    if ($textExtensions -notcontains $ext) {
        Write-Host "  SKIP     $($file.Name): not a known text format, not scanned"
        continue
    }

    $content  = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    $findings = @()
    if ($content -cmatch 'eyJ[A-Za-z0-9_-]{10,}')                                  { $findings += 'possible JWT (eyJ...)' }
    if ($content -match '(?i)password\s*[:=]')                                     { $findings += 'password assignment' }
    if ($content -match '(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b')           { $findings += 'e-mail address' }

    if ($findings.Count -gt 0) {
        Write-Host "  WARN     $($file.Name): $($findings -join ', ')"
        $warnings++
    } else {
        Write-Host "  OK       $($file.Name) (text scan clean)"
    }
}

# 3. Manual check reminder
Write-Host ''
Write-Host 'Manual check: open every screenshot and every frame of demo.gif and confirm that no JWT token (eyJ...),'
Write-Host 'password or personal e-mail address is visible.'

Write-Host ''
if ($missing -gt 0) {
    Write-Host "$missing image(s) MISSING. Add them to docs/screenshots and run this script again."
    exit 1
}
Write-Host "All README image links resolve. Warnings: $warnings"
exit 0
