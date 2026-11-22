<#
.SYNOPSIS
  Stage 20.20 — audit historical category index tables for base +0 stats.
.DESCRIPTION
  Source indexes can reveal 20 reviewed items in one small batch, even if
  individual item detail pages are missing. Output is private and explicitly
  unapproved. Default is offline; use -Online for at most five category GETs
  with robots.txt checks and >=3 second request pacing.
.EXAMPLE
  .\scripts\Start-WikidotCategoryReview.ps1 -Online -Categories 'axe,armor,gun'
.EXAMPLE
  .\scripts\Start-WikidotCategoryReview.ps1 -HtmlDir '.\Wikidot_Index_HTML' -Categories 'axe,armor' -Offset 20
#>
[CmdletBinding()]
param(
  [Parameter()][switch]$Online,
  [Parameter()][string]$HtmlDir,
  [Parameter()][string]$Categories='axe,armor,gun',
  [Parameter()][ValidateRange(1,20)][int]$Count=20,
  [Parameter()][ValidateRange(0,60000)][int]$Offset=0,
  [Parameter()][ValidateRange(3,600)][double]$DelaySeconds=3,
  [Parameter()][switch]$NoOpen
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$queue=Join-Path $root 'Miner_Item_Article_Queue_20_16.json'
$audit=Join-Path $root 'Miner_Wikidot_Audit_20_17.json'
$review=Join-Path $root 'tools\wikidot-batch-review.html'
if($Online -and $HtmlDir){throw '[IC] Escolha -Online OU -HtmlDir.'}
if(-not $Online -and -not $HtmlDir){
  throw '[IC] Especifique -Online ou -HtmlDir com páginas de índice salvas.'
}
Push-Location $root
try{
  & node (Join-Path $root 'scripts\build-item-article-review-queue.mjs') --output $queue
  if($LASTEXITCODE -ne 0){throw '[IC] Não foi possível gerar a fila de 551 IDs.'}
  $argsList=@($queue,'--categories',$Categories,
    '--max-entries',"$Count",'--offset',"$Offset",
    '--delay',"$DelaySeconds",'--output',$audit)
  if($Online){
    $argsList+=@('--fetch')
  }else{
    $folder=if([IO.Path]::IsPathRooted($HtmlDir)){$HtmlDir}else{Join-Path $root $HtmlDir}
    if(-not (Test-Path -LiteralPath $folder -PathType Container)){
      throw '[IC] Diretório de índices históricos não encontrado.'
    }
    $argsList+=@('--html-dir',$folder)
  }
  & py (Join-Path $root 'scripts\audit-wikidot-category-index.py') @argsList
  if($LASTEXITCODE -ne 0){throw '[IC] Coleta por categoria bloqueada. Confira acesso, títulos e limites.'}
  Write-Host '[IC] Itens com atributos históricos +0 encontrados na tabela (arquivo PRIVADO):' $audit
  Write-Host '[IC] As classes e a fabricação não são inferidas de um índice.'
  if(-not $NoOpen){
    Start-Process -FilePath $review
    Write-Host '[IC] Carregue o JSON de auditoria, revise somente seções disponíveis e exporte aprovações.'
  }
}finally{Pop-Location}
