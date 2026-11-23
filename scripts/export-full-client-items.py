#!/usr/bin/env python3
"""Stage 20.30: produce an audited public, shardable item index from private Miner JSON.

Reads the user's complete offline Miner_ClientFacts_Private_20_23.json and writes
only source-safe ID/name/status/category metadata plus named-ID source details.
Never includes conflicting candidate names, non-English text, private paths,
raw file bytes, source variant gameplay claims or drop rates.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re
import sys

IDENTITIES = {'one-official-English-name':'named','different-base-identities':'collision','no-official-English-name':'unresolved'}
ROLES = {'general','specific'}
INGREDIENT_STATES = {'parsed-client-material','parsed-client-recipe','none','unsupported'}
INDEX_WIDTH = 4000
DETAIL_BUCKET = 1000
ID = re.compile(r'^[1-9][0-9]{0,12}$')
BASENAME = re.compile(r'^[A-Za-z0-9_.-]{1,100}$')


def compact_json(data):
    return json.dumps(data, ensure_ascii=False, separators=(',',':'),allow_nan=False)+'\n'


def exact_string(value, maxlen=130):
    return isinstance(value,str) and bool(value.strip()) and len(value)<=maxlen and '<' not in value and '>' not in value and '\x00' not in value


def consensus(rows,key):
    found={str(v) for s in rows if (v:=s.get(key)) not in ('',None)}
    return next(iter(found)) if len(found)==1 else None


def preferred_category(sources):
    specific={str(s['category']) for s in sources if s['role']=='specific'}
    generic={str(s['category']) for s in sources}
    choices=specific or generic
    return next(iter(choices)) if len(choices)==1 else None


def build_catalog(private):
    if (not isinstance(private,dict) or private.get('reportVersion')!='20.23-private'
        or private.get('dataset')!='all-client-catalog-items'
        or not isinstance(private.get('snapshotId'),int)
        or private['snapshotId']<1 or not isinstance(private.get('items'),list)):
        raise ValueError('Unexpected full private Miner inventory schema')
    seen_ids=set()
    seen_record_ids=set()
    all_entries=[]
    named_details=defaultdict(dict)
    counters=Counter()
    reviewed_ids=set()
    categories=Counter()
    issue_entries=[]
    distinct_name_to_ids=defaultdict(list)
    total_sources=0
    for obj in private['items']:
        item_id=obj.get('itemId')
        if not isinstance(item_id,str) or not ID.fullmatch(item_id) or item_id in seen_ids:
            raise ValueError('Invalid or duplicate client Unique item ID')
        seen_ids.add(item_id)
        state=IDENTITIES.get(obj.get('identityState'))
        if state is None:
            raise ValueError('Unknown client identity state')
        sources=obj.get('sources')
        if not isinstance(sources,list) or not sources:
            raise ValueError('Missing original client source definitions')
        detail_rows=[]
        for source in sources:
            sid=source.get('recordId')
            if not isinstance(sid,int) or sid<1 or sid in seen_record_ids:
                raise ValueError('Duplicate or missing original client record ID')
            seen_record_ids.add(sid)
            filename=source.get('file')
            if not isinstance(filename,str) or not BASENAME.fullmatch(filename):
                raise ValueError('Unexpected original source filename')
            if source.get('role') not in ROLES or not exact_string(source.get('category'),100):
                raise ValueError('Invalid original client category/role')
            status=source.get('ingredientsStatus')
            if status not in INGREDIENT_STATES:
                raise ValueError('Unexpected material parser status')
            mats=source.get('ingredients')
            if not isinstance(mats,list) or (status not in {'parsed-client-material','parsed-client-recipe'} and mats):
                raise ValueError('Unparsed source cannot contain decoded ingredients')
            material_pairs=[]
            for mat in mats:
                if not isinstance(mat,dict) or not isinstance(mat.get('itemId'),str) or not ID.fullmatch(mat['itemId']) or not isinstance(mat.get('quantity'),int) or mat['quantity']<1:
                    raise ValueError('Invalid original client material ID/quantity')
                material_pairs.append([mat['itemId'],mat['quantity']])
            for rawkey in ('workRaw','unitRaw'):
                raw=source.get(rawkey)
                if raw is not None and (not isinstance(raw,int) or isinstance(raw,bool)):
                    raise ValueError('Unexpected raw source workload/unit')
            level=source.get('levelRaw')
            grade=source.get('gradeRaw')
            if level is not None and not isinstance(level,(str,int)):
                raise ValueError('Invalid raw level')
            if grade is not None and not isinstance(grade,(str,int)):
                raise ValueError('Invalid raw grade')
            detail_rows.append([sid,filename,source['role'],source['category'],
                level,grade,source.get('workRaw'),source.get('unitRaw'),status,material_pairs])
        total_sources+=len(sources)
        name=obj.get('officialEnglishName')
        if state=='named':
            if not exact_string(name) or name != name.strip():
                raise ValueError('Named item missing a usable official English source name')
            if obj.get('reviewedEquipmentName') is not None:
                if name!=obj['reviewedEquipmentName']:
                    raise ValueError('Previously reviewed equipment English name no longer matches')
                reviewed_ids.add(item_id)
            distinct_name_to_ids[name].append(item_id)
        else:
            if name is not None or obj.get('reviewedEquipmentName') is not None:
                raise ValueError('Unresolved identity must not gain a fabricated name')
            issue_entries.append({'itemId':item_id,'identityState':obj['identityState'],
                                 'sourceRecordIds':[s['recordId'] for s in sources]})
        cat=preferred_category(sources)
        level=consensus(sources,'levelRaw')
        grade=consensus(sources,'gradeRaw')
        counters[state]+=1
        if cat:categories[cat]+=1
        index_row=[item_id,name if state=='named' else None,cat,level,grade,
                   len(sources),state,int(any(s['ingredients'] for s in sources)),
                   int(item_id in reviewed_ids)]
        all_entries.append(index_row)
        if state=='named':
            # Audit/interpret source variants as source-file groupings ONLY.
            groupings=[]
            rows_set={r[0] for r in detail_rows}
            all_variant_rows=set()
            for group in obj.get('variantSets',[]):
                ids=[r['recordId'] for r in group.get('sourceRows',[])]
                if not ids or not set(ids).issubset(rows_set):
                    raise ValueError('Variant source grouping has unknown original IDs')
                all_variant_rows.update(ids)
                groupings.append(ids)
            if all_variant_rows!=rows_set:
                raise ValueError('Original source grouping does not cover every source record')
            bucket=int(item_id)//DETAIL_BUCKET
            named_details[bucket][item_id]={'s':detail_rows,'v':groupings}
    if len(seen_ids)!=23586 or counters['named']!=22702 or counters['collision']!=290 or counters['unresolved']!=594 or len(reviewed_ids)!=551 or total_sources!=27281:
        raise ValueError('Original snapshot 1 inventory does not match expected audited counts')
    all_entries.sort(key=lambda row:int(row[0]))
    shards=[all_entries[i:i+INDEX_WIDTH] for i in range(0,len(all_entries),INDEX_WIDTH)]
    manifest={'schemaVersion':'1.0','dataset':'all-client-items','snapshotId':private['snapshotId'],
        'source':'game-client-extracted:catalog_items','totalIds':len(all_entries),
        'namedIds':counters['named'],'collisionIds':counters['collision'],
        'unresolvedIds':counters['unresolved'],'reviewedEquipmentIds':len(reviewed_ids),
        'sourceDefinitionRows':total_sources,'categoryCount':len(categories),
        'indexShards':[f'index-{i:02d}.json' for i in range(len(shards))],
        'detailBucketWidth':DETAIL_BUCKET,
        'notice':'A source name/category does not establish game availability, crafting or stats; source groupings are not gameplay variants.'}
    duplicate_english_names={name:ids for name,ids in distinct_name_to_ids.items() if len(ids)>1}
    review={'reportVersion':'20.30-private-review','snapshotId':private['snapshotId'],
        'unresolved':issue_entries,'duplicateEnglishNames':duplicate_english_names,
        'privacy':'Private ID-only unresolved queue and official-name cross-ID duplicates. Do not auto-merge.'}
    return manifest,shards,named_details,review,categories


def export(private_path:Path,target:Path,review_path:Path,overwrite:bool=False):
    source=json.loads(private_path.read_text(encoding='utf-8'))
    manifest,shards,details,review,categories=build_catalog(source)
    target.mkdir(parents=True,exist_ok=True)
    (target/'details').mkdir(exist_ok=True)
    to_write={'manifest.json':manifest}
    for idx,rows in enumerate(shards):
        to_write[f'index-{idx:02d}.json']={'schemaVersion':'1.0','snapshotId':manifest['snapshotId'],
            'rows':rows}
    for bucket,by_id in details.items():
        to_write[f'details/{bucket:02d}.json']={'schemaVersion':'1.0',
            'snapshotId':manifest['snapshotId'],'bucket':bucket,'items':by_id}
    for name,data in sorted(to_write.items()):
        dst=target/name
        if dst.exists() and not overwrite:raise FileExistsError(dst)
        dst.write_text(compact_json(data),encoding='utf-8')
    if review_path.exists() and not overwrite:raise FileExistsError(review_path)
    review_path.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('[IC] Original item IDs:',manifest['totalIds'])
    print('[IC] Published English-named IDs:',manifest['namedIds'])
    print('[IC] Unresolved/identity-collision IDs held:',manifest['unresolvedIds']+manifest['collisionIds'])
    print('[IC] Public index shards:',len(shards),'detail files:',len(details))
    print('[IC] Reviewed equipment identities preserved:',manifest['reviewedEquipmentIds'])
    print('[IC] Source definitions covered:',manifest['sourceDefinitionRows'])
    print('[IC] Raw category families:',manifest['categoryCount'])
    print('[IC] Original duplicate English names across different IDs:',len(review['duplicateEnglishNames']))
    print('[IC] Output:',target)
    return manifest


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('private_full_inventory',type=Path)
    parser.add_argument('--output',type=Path,default=Path('public/data/client-items'))
    parser.add_argument('--private-review',type=Path,default=Path('Miner_FullItem_IdentityReview_Private_20_30.json'))
    parser.add_argument('--overwrite',action='store_true')
    args=parser.parse_args(argv)
    try:
        if args.private_full_inventory.resolve()==args.private_review.resolve():
            raise ValueError('Input and private review output must differ')
        export(args.private_full_inventory,args.output,args.private_review,args.overwrite)
        return 0
    except (OSError,ValueError,KeyError,TypeError,json.JSONDecodeError) as e:
        print('[IC] ERROR: full client inventory export blocked:',str(e)[:250],file=sys.stderr)
        return 1

if __name__=='__main__':raise SystemExit(main())