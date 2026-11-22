<#
.SYNOPSIS
  Stage 20.10 — recheck human approvals and prepare a local curated Wiki diff.
.DESCRIPTION
  Safe dry-run by default. With -WriteCurated, edits only the tracked
  approved-equipment-metadata.json after Python/Node source + schema checks.
  Does NOT commit, push, merge, deploy, or touch the original SQLite.
#>
[CmdletBinding()]
param(
    [Parameter()]
    [string]$Database = 'D:\Documentos\Games\Atlantica Online\Data Mining\Atlantica_Data_Miner_v0.2\AtlanticaDataMiner\atlantica.sqlite3',
    [Parameter()]
    [ValidateRange(1, 2147483647)]
    [int]$Snapshot = 1,
    [Parameter()]
    [string]$Approvals = 'Miner_Equipment_Approvals_20_5.json',
    [Parameter()]
    [switch]$WriteCurated
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$approvalPath = if ([IO.Path]::IsPathRooted($Approvals)) {
    $Approvals
} else {
    Join-Path $repo $Approvals
}
$privateReview = Join-Path $repo 'Miner_Equipment_Private_Review_20_5.json'
$aggregate = Join-Path $repo 'Miner_Review_20_5.json'
$approved = Join-Path $repo 'Miner_Equipment_Approved_20_5.json'

if (-not (Test-Path -LiteralPath $Database -PathType Leaf)) {
    throw '[IC] SQLite não encontrado. Confira -Database.'
}
if (-not (Test-Path -LiteralPath $approvalPath -PathType Leaf)) {
    throw '[IC] Manifesto de aprovações não encontrado. Exporte-o pelo workbench offline.'
}

function Assert-ExitCode {
    param([string]$Step)
    if ($LASTEXITCODE -ne 0) {
        throw "[IC] $Step falhou; nenhuma publicação será efetuada."
    }
}

Push-Location $repo
try {
    $reconcile = Join-Path $repo 'scripts\reconcile-miner-equipment.py'
    $attest = Join-Path $repo 'scripts\verify-approved-equipment-against-sqlite.py'
    $contract = Join-Path $repo 'scripts\validate-game-dataset.mjs'
    $gate = Join-Path $repo 'scripts\check-curated-equipment.mjs'
    $promote = Join-Path $repo 'scripts\promote-approved-equipment.mjs'

    & py $reconcile $Database --snapshot "$Snapshot" --private-review $privateReview --report $aggregate --approvals $approvalPath --approved-output $approved
    Assert-ExitCode 'Geração do conjunto aprovado'

    & py $attest $Database $approved --snapshot "$Snapshot"
    Assert-ExitCode 'Conferência contra o SQLite original'

    & node $contract $approved --public
    Assert-ExitCode 'Contrato público v1.0'

    & node $gate $approved
    Assert-ExitCode 'Política restrita de metadados da Wiki'

    & node $promote $approved
    Assert-ExitCode 'Simulação de importação'

    if (-not $WriteCurated) {
        Write-Host '[IC] MODO SIMULAÇÃO: todos os controles passaram; nenhum arquivo público foi modificado.'
        Write-Host '[IC] Confira os itens; depois execute com -WriteCurated para editar o JSON local.'
        return
    }

    & node $promote $approved --write
    Assert-ExitCode 'Importação local'

    & node $gate
    Assert-ExitCode 'Revalidação do JSON público'

    & npm run build
    Assert-ExitCode 'Build Astro'

    Write-Host '[IC] Alterações locais prontas para revisão. Nenhum commit, push ou deploy foi realizado.'
    Write-Host '[IC] Revise o diff antes de abrir uma Pull Request.'
    & git diff -- 'src/data/approved-equipment-metadata.json'
    Assert-ExitCode 'Visualização do diff'
} finally {
    Pop-Location
}
