<#
.SYNOPSIS
  Stage 20.10 — generate private Miner equipment review and open offline UI.
.DESCRIPTION
  Read-only SQLite access. Never publishes or uploads game-client data.
  Stop the Miner (or use a consistent offline SQLite copy) before running.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$Database = 'D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3',
    [Parameter()]
    [ValidateRange(1, 2147483647)]
    [int]$Snapshot = 1,
    [Parameter()]
    [switch]$NoOpen
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$review = Join-Path $repo 'Miner_Equipment_Private_Review_20_5.json'
$report = Join-Path $repo 'Miner_Review_20_5.json'
$workbench = Join-Path $repo 'tools\equipment-review-workbench.html'
$script = Join-Path $repo 'scripts\reconcile-miner-equipment.py'

if (-not (Test-Path -LiteralPath $Database -PathType Leaf)) {
    throw '[IC] SQLite não encontrado. Confira o parâmetro -Database.'
}
if (-not (Test-Path -LiteralPath $workbench -PathType Leaf)) {
    throw '[IC] Workbench offline não encontrado. Atualize a branch da Wiki.'
}

Push-Location $repo
try {
    & py $script $Database --snapshot "$Snapshot" --private-review $review --report $report
    if ($LASTEXITCODE -ne 0) {
        throw '[IC] Falha na geração da fila privada; nenhuma revisão foi iniciada.'
    }
    Write-Host '[IC] Fila privada gerada (não publicar):' $review
    Write-Host '[IC] Relatório agregado:' $report
    if (-not $NoOpen) {
        Start-Process -FilePath $workbench
        Write-Host '[IC] Selecione o arquivo de revisão na janela do navegador.'
        Write-Host '[IC] Revise e exporte Miner_Equipment_Approvals_20_5.json.'
    } else {
        Write-Host '[IC] Abra tools\equipment-review-workbench.html quando desejar.'
    }
} finally {
    Pop-Location
}
