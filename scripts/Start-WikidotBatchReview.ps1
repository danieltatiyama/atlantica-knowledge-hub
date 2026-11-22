<#
.SYNOPSIS
  Stage 20.19: discover up to 20 historical Wikidot item sources per batch.
.DESCRIPTION
  Offline by default; -Online explicitly opts in to bounded, robots-respecting
  downloads. The output is a PRIVATE historical research proposal; nothing
  is automatically approved, committed or published.
.EXAMPLE
  .\scripts\Start-WikidotBatchReview.ps1 -Online -Count 5 -StartIndex 0
.EXAMPLE
  .\scripts\Start-WikidotBatchReview.ps1 -HtmlDir ".\Wikidot_HTML" -Count 5
#>
[CmdletBinding()]
param(
  [Parameter()][switch]$Online,
  [Parameter()][string]$HtmlDir,
  [Parameter()][ValidateRange(1,20)][int]$Count=5,
  [Parameter()][ValidateRange(0,60000)][int]$StartIndex=0,
  [Parameter()][ValidateRange(3,600)][double]$DelaySeconds=3,
  [Parameter()][switch]$NoOpen
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$queue=Join-Path $root 'Miner_Item_Article_Queue_20_16.json'
$audit=Join-Path $root 'Miner_Wikidot_Audit_20_17.json'
$review=Join-Path $root 'tools\wikidot-batch-review.html'
if($Online -and $HtmlDir){
  throw '[IC] Escolha apenas -Online OU -HtmlDir.'
}
if(-not $Online -and -not $HtmlDir){
  throw '[IC] Escolha -Online para auditoria curta ou -HtmlDir para HTML salvo localmente.'
}
Push-Location $root
try{
  & node (Join-Path $root 'scripts\build-item-article-review-queue.mjs') --output $queue
  if($LASTEXITCODE -ne 0){throw '[IC] Falha ao montar a fila de equipamentos.'}
  $argsList=@($queue)
  if($Online){
    $argsList+=@('--fetch')
  }else{
    $resolvedHtml=if([IO.Path]::IsPathRooted($HtmlDir)){$HtmlDir}else{Join-Path $root $HtmlDir}
    if(-not (Test-Path -LiteralPath $resolvedHtml -PathType Container)){
      throw '[IC] Diretório de HTML não encontrado. Use -Online ou salve arquivos <ID>.html.'
    }
    $argsList+=@('--html-dir',$resolvedHtml)
  }
  $argsList+=@('--max-pages',"$Count",'--start',"$StartIndex",
    '--delay',"$DelaySeconds",'--output',$audit)
  & py (Join-Path $root 'scripts\audit-wikidot-item-pages.py') @argsList
  if($LASTEXITCODE -ne 0){throw '[IC] Auditoria bloqueada; confira robots.txt, rede e limites.'}
  Write-Host '[IC] Auditoria PRIVADA:' $audit
  Write-Host '[IC] As páginas consultadas são históricas e ainda NÃO estão aprovadas.'
  if(-not $NoOpen){
    Start-Process -FilePath $review
    Write-Host '[IC] Selecione o JSON acima no navegador e revise item por item.'
  }
}finally{
  Pop-Location
}
