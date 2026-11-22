<#
.SYNOPSIS
  Read all client item facts from the local Miner SQLite, without modifying it.
.DESCRIPTION
  Always exports full private source inventory + aggregate report + a bounded
  candidate for currently reviewed equipment IDs. Validates the candidate.
  -PreparePublic copies the validated candidate to the tracked public
  JSON, runs Astro build and shows the diff. Never commits, pushes or deploys.
.EXAMPLE
  .\scripts\Start-ClientEquipmentImport.ps1 -Database "D:\path\atlantica.sqlite3"
.EXAMPLE
  .\scripts\Start-ClientEquipmentImport.ps1 -Database "D:\path\atlantica.sqlite3" -PreparePublic
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$Database,
  [Parameter()][ValidateRange(1,100000)][int]$Snapshot=1,
  [Parameter()][switch]$PreparePublic
)
Set-StrictMode -Version Latest
$ErrorActionPreference="Stop"
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$source=(Resolve-Path -LiteralPath $Database -ErrorAction Stop).Path
$private=Join-Path $root 'Miner_ClientFacts_Private_20_23.json'
$report=Join-Path $root 'Miner_ClientFacts_Report_20_23.json'
$candidate=Join-Path $root 'Miner_ClientFacts_PublicCandidate_20_23.json'
$target=Join-Path $root 'src\data\client-equipment-facts.json'
$registry=Join-Path $root 'src\data\equipment-item-names-en.ts'

function Assert-Command{
  param([string]$Name)
  if($LASTEXITCODE -ne 0){throw "[IC] Falha durante: $Name"}
}
if(-not (Test-Path -LiteralPath $source -PathType Leaf)){
  throw '[IC] Arquivo SQLite inexistente.'
}
Push-Location $root
try{
  $arguments=@((Join-Path $root 'scripts\export-client-equipment-facts.py'),$source,
    '--snapshot',"$Snapshot",'--registry',$registry,
    '--private-output',$private,'--report',$report,'--public-output',$candidate)
  & py @arguments
  Assert-Command 'Exportação somente leitura dos arquivos do cliente'

  & node (Join-Path $root 'scripts\check-client-equipment-facts.mjs') $candidate
  Assert-Command 'Validação de dados extraídos para publicação'

  Write-Host '[IC] Inventário privado de todos os IDs:' $private
  Write-Host '[IC] Relatório agregado seguro:' $report
  Write-Host '[IC] Candidato público, ainda NÃO integrado:' $candidate

  if(-not $PreparePublic){
    Write-Host '[IC] DRY RUN. Nenhuma fonte do site foi alterada.'
    Write-Host '[IC] Para incorporar na branch local com Git diff use -PreparePublic.'
    return
  }

  Copy-Item -LiteralPath $candidate -Destination $target
  & node (Join-Path $root 'scripts\check-client-equipment-facts.mjs')
  Assert-Command 'Validação do dataset público preparado'

  & npm run build
  Assert-Command 'Astro build'
  & git diff -- 'src/data/client-equipment-facts.json'
  Assert-Command 'Inspeção do diff gerado'

  Write-Host '[IC] Apenas a branch local foi alterada. Não houve commit, push ou deploy.'
  Write-Host '[IC] Valores do Miner são EXTRACTED, não confirmação independente de atributos do jogo.'
}finally{
  Pop-Location
}
