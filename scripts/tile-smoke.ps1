#requires -Version 5.1
param(
    [string]$Template = 'http://localhost:4000/tiles/{z}/{x}/{y}.png',
    [string]$Coords,
    [Nullable[int]]$Timeout,
    [Nullable[int]]$Retries,
    [Nullable[int]]$Delay,
    [switch]$Json,
    [string]$LogFile
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
$nodeScript = Join-Path $repoRoot 'scripts/tile-smoke.js'

$arguments = @($nodeScript, $Template)
if ($PSBoundParameters.ContainsKey('Coords')) {
    $arguments += @('--coords', $Coords)
}
if ($PSBoundParameters.ContainsKey('Timeout')) {
    $arguments += @('--timeout', $Timeout)
}
if ($PSBoundParameters.ContainsKey('Retries')) {
    $arguments += @('--retries', $Retries)
}
if ($PSBoundParameters.ContainsKey('Delay')) {
    $arguments += @('--delay', $Delay)
}
if ($Json) {
    $arguments += '--json'
}

$timestamp = Get-Date -Format 's'
$output = $null
$exitCode = 0

Push-Location $repoRoot
try {
    $output = & node @arguments 2>&1
    $exitCode = $LASTEXITCODE
}
catch {
    $exitCode = 2
    $output = $_.Exception.Message
}
finally {
    Pop-Location
}

if ($LogFile) {
    $logHeader = "[$timestamp] smoke:tiles exit=$exitCode"
    $logHeader | Out-File -FilePath $LogFile -Encoding utf8 -Append
    if ($output) {
        $output | Out-File -FilePath $LogFile -Encoding utf8 -Append
    }
} else {
    if ($output) {
        $output | ForEach-Object { Write-Host $_ }
    }
}

exit $exitCode