<#
.SYNOPSIS
  Stage 20.19: validate historical manually reviewed items, with optional local write.
.DESCRIPTION
  Always generates a private draft and validates it. Default is DRY RUN.
  -WriteReviewed updates only the tracked review-profile JSON, runs Astro
  build and shows diff. Does not commit, push, merge or deploy.
.EXAMPLE
  .\scripts\Finalize-WikidotBatchReview.ps1
.EXAMPLE
  .\scripts\Finalize-WikidotBatchReview.ps1 -WriteReviewed
#>
[CmdletBinding()]
param(
  [Parameter()][string]$Audit='Miner_Wikidot_Audit_20_17.json',
  [Parameter()][string]$Approvals='Miner_Wikidot_Approvals_20_18.json',
  [Parameter()][switch]$WriteReviewed
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$auditPath=if([IO.Path]::IsPathRooted($Audit)){$Audit}else{Join-Path $root $Audit}
$approvedPath=if([IO.Path]::IsPathRooted($Approvals)){$Approvals}else{Join-Path $root $Approvals}
$draft=Join-Path $root 'Miner_Wikidot_Draft_20_18.json'
if(-not (Test-Path -LiteralPath $auditPath -PathType Leaf)){
  throw '[IC] Auditoria privada não encontrada. Execute Start-WikidotBatchReview primeiro.'
}
if(-not (Test-Path -LiteralPath $approvedPath -PathType Leaf)){
  throw '[IC] Arquivo de aprovações não encontrado. Exporte-o no workbench offline.'
}

function Assert-Result{
  param([string]$Step)
  if($LASTEXITCODE -ne 0){throw "[IC] $Step falhou. Nenhum conteúdo deve ser publicado."}
}
Push-Location $root
try{
  & node (Join-Path $root 'scripts\build-historical-item-profile-draft.mjs') $auditPath $approvedPath --output $draft
  Assert-Result 'Construção do rascunho privado'

  & node (Join-Path $root 'scripts\check-reviewed-item-profiles.mjs') $draft
  Assert-Result 'Contrato das fichas históricas'

  & node (Join-Path $root 'scripts\promote-reviewed-wikidot-batch.mjs') $auditPath $approvedPath
  Assert-Result 'Simulação de promoção'

  if(-not $WriteReviewed){
    Write-Host '[IC] DRY RUN: nenhum arquivo público alterado.'
    Write-Host '[IC] Rascunho privado validado:' $draft
    Write-Host '[IC] Revise os itens e fontes. Use -WriteReviewed para preparar um diff local.'
    return
  }

  & node (Join-Path $root 'scripts\promote-reviewed-wikidot-batch.mjs') $auditPath $approvedPath --write
  Assert-Result 'Atualização local das fichas aprovadas'

  & node (Join-Path $root 'scripts\check-reviewed-item-profiles.mjs')
  Assert-Result 'Revalidação das fichas locais'

  & npm run build
  Assert-Result 'Build Astro'

  & git diff -- 'src/data/reviewed-equipment-profiles.json'
  Assert-Result 'Visualização do diff'
  Write-Host '[IC] Alteração local preparada e testada. Nenhum commit, push ou deploy foi realizado.'
}finally{
  Pop-Location
}
