#!/usr/bin/env python3
"""Stage 20.31: read-only source stats candidate for ALL named client item IDs.

The full client item index is already source-matched. This script opens the
original Miner SQLite in query-only mode and extracts the Items.csv numeric
columns by exact Unique + EnglishName identity. Contradictory source names
quarantine an ID; missing fields are not replaced with zero. The output is
an explicitly reviewed PUBLIC CANDIDATE, never an automatic publication.

Run from the repository root (Windows):
  py scripts/export-full-client-stats.py "D:\\...\\atlantica.sqlite3"

The script writes Miner_AllStats_PublicCandidate_20_31/ and aggregate report.
Only after review should the candidate stats/ directory be copied under
public/data/client-items/stats/. No source game assets, paths or raw text are
included in the candidate.
"""
from __future__ import annotations
import argparse
from collections import Counter,defaultdict
import json
from pathlib import Path
import re
import sqlite3
import sys

ID=re.compile(r'^[1-9][0-9]{0,12}$')
NUMBER=re.compile(r'^-?(?:0|[1-9][0-9]{0,15})(?:\.[0-9]{1,8})?$')
ALLOWED=(
 'MinDamage','MaxDamage','AC','MagicDef','EV','MoveSpeed',
 'Str','Dex','Vit','Mag','HitRate','CriticalPlus','MagicSkillPlus',
 'Critical','Attack','Defence','Intl','Int','Dodge',
 'ActivePower','Magic_Damage','Critical_Damage','BuffUpPercentage',
)


def parse_numeric_fields(raw):
    results={}
    for key in ALLOWED:
        val=raw.get(key)
        if isinstance(val,bool) or val is None:continue
        if type(val) in (int,float):
            if isinstance(val,float) and (val!=val or abs(val)==float('inf')):
                continue
            val=str(val)
        if isinstance(val,str) and NUMBER.fullmatch(val.strip()):
            results[key]=val.strip()
    return results


def load_index(source):
    manifest=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
    if manifest.get('schemaVersion')!='1.0' or manifest.get('dataset')!='all-client-items' or manifest.get('snapshotId')!=1 or manifest.get('totalIds')!=23586 or manifest.get('namedIds')!=22702:
        raise ValueError('Full item index schema or Miner snapshot mismatch')
    rows=[]
    for name in manifest['indexShards']:
        if not re.fullmatch(r'index-[0-9]{2}\.json',name):raise ValueError('Untrusted index shard path')
        chunk=json.loads((source/name).read_text(encoding='utf-8'))
        if chunk.get('snapshotId')!=1 or chunk.get('schemaVersion')!='1.0':raise ValueError('Source shard snapshot mismatch')
        rows.extend(chunk['rows'])
    if len(rows)!=23586 or len({row[0] for row in rows})!=len(rows):
        raise ValueError('Incomplete original source item ID registry')
    names={str(row[0]):row[1] for row in rows if row[6]=='named'}
    if len(names)!=22702 or any(not isinstance(name,str) or not name.strip() for name in names.values()):
        raise ValueError('Missing official English client names')
    return manifest,names


def export(database:Path,index_dir:Path,output_dir:Path,report_path:Path,overwrite=False):
    manifest,names=load_index(index_dir)
    if output_dir.resolve()==database.resolve() or report_path.resolve()==database.resolve() or report_path.resolve()==index_dir.resolve():
        raise ValueError('Input/output path collision')
    with sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True) as db:
        db.execute('PRAGMA query_only=ON')
        if not db.execute('SELECT 1 FROM snapshots WHERE id=?',(manifest['snapshotId'],)).fetchone():
            raise ValueError('Original Miner snapshot not present in local DB')
        columns={row[1] for row in db.execute("PRAGMA table_info('reference_rows')")}
        if not {'dataset','row_num','data'}.issubset(columns):
            raise ValueError('Missing Miner reference_rows source schema')
        seen_rows=set()
        by_item=defaultdict(list)
        count=Counter()
        for row_id,raw in db.execute(
            'SELECT row_num,data FROM reference_rows WHERE dataset=? ORDER BY row_num',('Items.csv',)):
            count['rowsInspected']+=1
            if count['rowsInspected']>1000000:raise ValueError('Unexpected huge source dataset')
            if not isinstance(row_id,int) or row_id<=0 or row_id in seen_rows:
                raise ValueError('Invalid or duplicate original Items.csv row number')
            seen_rows.add(row_id)
            if not isinstance(raw,str) or len(raw)>500000:
                count['invalidJsonRows']+=1;continue
            try:record=json.loads(raw)
            except json.JSONDecodeError:
                count['invalidJsonRows']+=1;continue
            if not isinstance(record,dict):count['invalidJsonRows']+=1;continue
            uid=record.get('Unique')
            uid=str(uid).strip() if isinstance(uid,(str,int)) and not isinstance(uid,bool) else ''
            if not ID.fullmatch(uid):count['invalidItemIds']+=1;continue
            if uid not in names:
                count['unresolvedIdentitySourceRows']+=1
                continue
            name=record.get('EnglishName')
            matching=isinstance(name,str) and name==names[uid]
            by_item[uid].append((row_id,matching,parse_numeric_fields(record)))
    stats=defaultdict(dict)
    public_ids=0
    public_rows=0
    field_counts=Counter()
    collisions=0
    no_fields=0
    for uid,records in by_item.items():
        if any(not matching for _rowid,matching,_fields in records):
            collisions+=1
            continue
        rows=[[row_id,fields] for row_id,_matching,fields in records if fields]
        if not rows:
            no_fields+=1
            continue
        public_ids+=1
        public_rows+=len(rows)
        for _source_row,fields in rows:field_counts.update(fields.keys())
        stats[int(uid)//1000][uid]=rows
    stats_manifest={'schemaVersion':'1.0','dataset':'all-client-item-raw-stats',
                    'snapshotId':1,'itemIds':public_ids,'sourceRows':public_rows,
                    'dataSource':'game-client-extracted:Items.csv',
                    'notice':'Raw source fields, not server measurements. +1..+10 scaling requires separate historic model; fixed EV/MoveSpeed/MagicDef never multiply.',
                    'files':[f'{b:02d}.json' for b in sorted(stats)]}
    report={'reportVersion':'20.31-aggregate','snapshotId':1,'rowsInspected':count['rowsInspected'],
            'invalidJsonRows':count['invalidJsonRows'],'invalidItemIds':count['invalidItemIds'],
            'unresolvedIdentitySourceRows':count['unresolvedIdentitySourceRows'],
            'namedIdsWithSourceRows':len(by_item),'sourceNameCollisionIdsHeld':collisions,
            'namedIdsWithNoNumericFields':no_fields,'publishedCandidateIds':public_ids,
            'publishedCandidateSourceRows':public_rows,'numericFieldCoverage':dict(sorted(field_counts.items())),
            'privacy':'Aggregate only: no source names, original record values or paths'}
    if count['rowsInspected']<20000 or not stats:
        raise ValueError('Original Items.csv source dataset appears incomplete')
    if output_dir.exists() and not overwrite:raise FileExistsError(output_dir)
    output_dir.mkdir(parents=True,exist_ok=True)
    if report_path.exists() and not overwrite:raise FileExistsError(report_path)
    def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    write(output_dir/'manifest.json',stats_manifest)
    for b,items in sorted(stats.items()):
        write(output_dir/f'{b:02d}.json',{'schemaVersion':'1.0','snapshotId':1,'bucket':b,'items':items})
    write(report_path,report)
    print('[IC] Original Items.csv rows inspected:',count['rowsInspected'])
    print('[IC] Named item IDs with source stats:',public_ids)
    print('[IC] Original numeric source rows:',public_rows)
    print('[IC] ID/name collisions held from public candidate:',collisions)
    print('[IC] Public CANDIDATE (not auto deployed):',output_dir)
    print('[IC] Aggregate report:',report_path)
    return report


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('database',type=Path)
    p.add_argument('--index-dir',type=Path,default=Path('public/data/client-items'))
    p.add_argument('--output',type=Path,default=Path('Miner_AllStats_PublicCandidate_20_31'))
    p.add_argument('--report',type=Path,default=Path('Miner_AllStats_Report_20_31.json'))
    p.add_argument('--overwrite',action='store_true')
    args=p.parse_args(argv)
    try:
        export(args.database,args.index_dir,args.output,args.report,args.overwrite)
        return 0
    except (OSError,ValueError,KeyError,TypeError,sqlite3.Error) as exc:
        print('[IC] ERROR: read-only complete stats source export blocked:',str(exc)[:220],file=sys.stderr)
        return 1

if __name__=='__main__':raise SystemExit(main())