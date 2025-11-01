#requires -Version 5.1
param(
    [switch]$SkipBackup,
    [switch]$SkipSmoke,
    [string]$Template,
    [string]$Coords,
    [Nullable[int]]$Timeout,
    [Nullable[int]]$Retries,
    [Nullable[int]]$Delay,
    [switch]$Json,
    [string]$LogFile,
    [switch]$CompressLog,
    [string]$CompressLogPath,
    [string]$MetricsFile,
    [string]$MetricsUrl,
    [string]$MetricsLabels,
    [Nullable[int]]$RetainBackups,
    [string]$BackupDir,
    [string]$ArchivePath,
    [string]$ArchiveNotes,
    [string]$NotifyWebhook,
    [string]$NotifyToken,
    [string]$UploadUri,
    [switch]$FailFast,
    [switch]$DryRun
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
$nodeScript = Join-Path $repoRoot 'scripts/maintenance.js'

$arguments = @($nodeScript)
if ($SkipBackup) { $arguments += '--skip-backup' }
if ($SkipSmoke) { $arguments += '--skip-smoke' }
if ($Template) { $arguments += @('--template', $Template) }
if ($Coords) { $arguments += @('--coords', $Coords) }
if ($Timeout) { $arguments += @('--timeout', $Timeout) }
if ($Retries) { $arguments += @('--retries', $Retries) }
if ($Delay) { $arguments += @('--delay', $Delay) }
if ($Json) { $arguments += '--json' }
if ($LogFile) { $arguments += @('--log', $LogFile) }
if ($CompressLogPath) {
    $arguments += @('--compress-log', $CompressLogPath)
} elseif ($CompressLog) {
    $arguments += '--compress-log'
}
if ($MetricsFile) { $arguments += @('--metrics-file', $MetricsFile) }
if ($MetricsUrl) { $arguments += @('--metrics-url', $MetricsUrl) }
if ($MetricsLabels) { $arguments += @('--metrics-labels', $MetricsLabels) }
if ($null -ne $RetainBackups) { $arguments += @('--retain-backups', $RetainBackups) }
if ($BackupDir) { $arguments += @('--backup-dir', $BackupDir) }
if ($ArchivePath) { $arguments += @('--archive', $ArchivePath) }
if ($ArchiveNotes) { $arguments += @('--archive-notes', $ArchiveNotes) }
if ($NotifyWebhook) { $arguments += @('--notify-webhook', $NotifyWebhook) }
if ($NotifyToken) { $arguments += @('--notify-token', $NotifyToken) }
if ($UploadUri) { $arguments += @('--upload', $UploadUri) }
if ($FailFast) { $arguments += '--fail-fast' }
if ($DryRun) { $arguments += '--dry-run' }

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
    $logHeader = "[$timestamp] maintenance exit=$exitCode"
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
