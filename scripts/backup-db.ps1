param(
    [string]$DbPath = "../server/data.db",
    [string]$BackupDir = "../backups"
)

$env:DB_PATH = (Resolve-Path -Path $DbPath)
$env:BACKUP_DIR = (Resolve-Path -Path $BackupDir)

node "$PSScriptRoot/backup-db.js"
