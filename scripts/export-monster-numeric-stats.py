#!/usr/bin/env python3
"""Export numeric monster fields by exact global MONSTER Char identity; no decoder required."""
from pathlib import Path
import json,csv,re,hashlib,collections,argparse
parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
src=args.source
r=list(csv.reader(src.open(errors='replace'),delimiter='\t'));h=r[6];by={}
for line,v in enumerate(r[7:],8):
 if len(v)!=len(h):continue
 d=dict(zip(h,v))
 if d['Nation']=='ALL' and 'MONSTER' in d['Atb'].split('+'):
  assert v[0] not in by
  by[v[0]]=(line,d)
idx=sum([json.loads(p.read_text())['rows'] for p in (root/'public/data/client-monsters').glob('index-*.json')],[])
selected=[by[x[3]][1] for x in idx if x[3] in by]
fields=[k for k in h[1:] if any(re.fullmatch(r'-?\d+(?:\.\d+)?',d[k]) for d in selected) and all(d[k] in ('','NULL') or re.fullmatch(r'-?\d+(?:\.\d+)?',d[k]) for d in selected)]
# NameTextNum is an identity reference, not a combat statistic; retained under additional parameters.
out=root/'public/data/client-monster-stats';out.mkdir(exist_ok=True)
for bucket in range(9):
 items={}
 for x in idx:
  if int(x[0])//1000!=bucket:continue
  found=by.get(x[3]);items[x[0]]=None if not found else {'kind':x[3],'line':found[0],'values':[None if found[1][k] in ('','NULL') else int(found[1][k]) if re.fullmatch(r'-?\d+',found[1][k]) else float(found[1][k]) for k in fields]}
 (out/f'{bucket:02}.json').write_text(json.dumps({'schemaVersion':1,'columns':fields,'items':items},separators=(',',':'))+'\n')
(out/'manifest.json').write_text(json.dumps({'schemaVersion':1,'source':'CharAttackInfo.ndt','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'filter':{'Nation':'ALL','AtbToken':'MONSTER'},'catalogCount':len(idx),'matchedCount':len(selected),'missingIds':[x[0] for x in idx if x[3] not in by],'columns':fields},indent=2)+'\n')
