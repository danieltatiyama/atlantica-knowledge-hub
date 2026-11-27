#!/usr/bin/env python3
"""Import the audited, converted map library. No game decoder or raw sources are published."""
import argparse, hashlib, json, shutil
from pathlib import Path
from collections import defaultdict

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('library',type=Path);args=p.parse_args()
 root=Path(__file__).resolve().parents[1];source=args.library.resolve()
 original=json.loads((source/'catalogo.json').read_text())
 maps=json.loads((root/'public/data/client-maps/catalog.json').read_text())['maps']
 rows=[];assets={};candidates=defaultdict(set)
 for rec in original['images']:
  if rec['status']!='converted':continue
  key=rec['pixelHash'];assert len(key)==64 and all(c in '0123456789abcdef' for c in key)
  for kind,field in [('images','image'),('thumbs','thumbnail')]:
   path=source/rec[field];assert path.resolve().parent==source/kind
   blob=path.read_bytes()
   if kind=='images':assert len(blob)==rec['webpBytes'] and hashlib.sha256(blob).hexdigest()==rec['webpSha256']
   dest=root/'public/images/map-library'/kind/path.name;dest.parent.mkdir(parents=True,exist_ok=True)
   if not dest.exists():shutil.copyfile(path,dest)
  asset={'id':key,'src':'/images/map-library/'+rec['image'],'thumbnail':'/images/map-library/'+rec['thumbnail'],'width':rec['width'],'height':rec['height'],'bytes':rec['webpBytes'],'sha256':rec['webpSha256']}
  assets[key]=asset
  candidate_ids=[int(k) for k,m in maps.items() if (m.get('type') or '').casefold()==rec['folder'].casefold()] if rec['scope']=='NMap' else []
  rows.append({'index':rec['index'],'sourcePath':rec['sourcePath'],'scope':rec['scope'],'folder':rec['folder'],'filename':rec['filename'],'sourceSha256':rec['sourceSha256'],'sourceBytes':rec['sourceBytes'],'assetId':key,'mapIds':candidate_ids})
  for mid in candidate_ids:candidates[str(mid)].add(key)
 # Multiple distinct pixel images are ambiguous, even when filenames look canonical.
 index={mid:sorted(ids) for mid,ids in candidates.items()}
 report={k:original['report'][k] for k in ['sourceFiles','converted','uniquePixelImages','duplicatePixelCopies']}
 report.update(failed=[{'sourcePath':r['sourcePath'],'sourceSha256':r['sourceSha256'],'sourceBytes':r['sourceBytes'],'reason':'truncated-image-data'} for r in original['report']['failed']],uniqueMapMatches=sum(len(v)==1 for v in index.values()),ambiguousMapMatches=sum(len(v)>1 for v in index.values()))
 manifest={'schemaVersion':1,'report':report,'assets':assets,'origins':rows,'mapCandidates':index,'mapNames':{k:m['name'] for k,m in maps.items() if k in index},'associationRule':'Exact case-insensitive NMap folder = MapInfo MapTypeCode. Single distinct pixel image only; shared types remain unverified client associations. NBattleMap never assigned to field maps.'}
 (root/'public/data/client-maps/images.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
 print(json.dumps(report))
if __name__=='__main__':main()
