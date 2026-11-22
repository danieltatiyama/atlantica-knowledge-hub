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
$attributesPrivate=Join-Path $root 'Miner_ClientAttributes_Private_20_25.json'
$attributesReport=Join-Path $root 'Miner_ClientAttributes_Report_20_25.json'
$attributesCandidate=Join-Path $root 'Miner_ClientAttributes_PublicCandidate_20_25.json'
$attributesTarget=Join-Path $root 'src\data\client-item-attributes.json'
$legendaryReport=Join-Path $root 'Miner_Legendary_Client_20_24.json'
$referenceFields=Join-Path $root 'Miner_ReferenceFields_20_24.json'
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

  & node (Join-Path $root 'scripts\build-legendary-client-report.mjs') $private --output $legendaryReport
  Assert-Command 'Cruzamento dos 47 lendários com inventário completo'

  & py (Join-Path $root 'scripts\profile-miner-reference-fields.py') $source --output $referenceFields
  Assert-Command 'Descoberta dos campos disponíveis em todos os datasets de referência'

  & py (Join-Path $root 'scripts\export-client-item-attributes.py') $source --snapshot $Snapshot --registry $registry --private-output $attributesPrivate --report $attributesReport --public-output $attributesCandidate
  Assert-Command 'Extração de MinDamage, MaxDamage, AC, MagicDef e atributos brutos de Items.csv'

  & node (Join-Path $root 'scripts\check-client-item-attributes.mjs') $attributesCandidate
  Assert-Command 'Validação de atributos brutos com identidade e referência de origem'

  & node (Join-Path $root 'scripts\check-client-equipment-facts.mjs') $candidate
  Assert-Command 'Validação de dados extraídos para publicação'

  Write-Host '[IC] Inventário privado de todos os IDs:' $private
  Write-Host '[IC] Relatório agregado seguro:' $report
  Write-Host '[IC] Candidato público, ainda NÃO integrado:' $candidate
  Write-Host '[IC] Correspondências lendárias privadas:' $legendaryReport
  Write-Host '[IC] Campos identificados nos dados completos do Miner:' $referenceFields
  Write-Host '[IC] Inventário privado de todos os campos de atributos:' $attributesPrivate
  Write-Host '[IC] Relatório agregado dos atributos:' $attributesReport
  Write-Host '[IC] Candidato público de atributos brutos:' $attributesCandidate

  if(-not $PreparePublic){
    Write-Host '[IC] DRY RUN. Nenhuma fonte do site foi alterada.'
    Write-Host '[IC] Para incorporar na branch local com Git diff use -PreparePublic.'
    return
  }

  Copy-Item -LiteralPath $candidate -Destination $target
  Copy-Item -LiteralPath $attributesCandidate -Destination $attributesTarget
  & node (Join-Path $root 'scripts\check-client-equipment-facts.mjs')
  Assert-Command 'Validação do dataset público preparado'

  & node (Join-Path $root 'scripts\check-client-item-attributes.mjs')
  Assert-Command 'Validação dos atributos públicos preparados'

  & npm run build
  Assert-Command 'Astro build'
  & git diff -- 'src/data/client-equipment-facts.json' 'src/data/client-item-attributes.json'
  Assert-Command 'Inspeção do diff gerado'

  Write-Host '[IC] Apenas a branch local foi alterada. Não houve commit, push ou deploy.'
  Write-Host '[IC] Valores do Miner são EXTRACTED, não confirmação independente de atributos do jogo.'
}finally{
  Pop-Location
}
