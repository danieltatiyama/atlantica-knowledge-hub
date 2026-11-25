#!/usr/bin/env python3
"""Join decoded book restrictions to the private skill identity candidate."""
import argparse, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path

CLASS_FIELDS = tuple(f'Class{i}' for i in range(1,9))
FIELDS = ('Unique','NameTextNum','Nation','bUse','IsShow','Level','MaxLevel','NeedSkill','NeedSkillLevel','SkillKind','DownSkillCode','HeroSolOnly','AllClass',*CLASS_FIELDS,'SkillLimit','Explain')

def export(book, text, skills, dest):
    sources = {k:Path(v).read_bytes() for k,v in [('book',book),('text',text),('skills',skills)]}
    by_skill = {}
    ids = set()
    for s in json.loads(sources['skills']):
        raw = s['rawSkillInfo']
        key = raw[3]
        if len(raw)!=11 or raw[0]!=s['skillIndexName'] or raw[4]!=s['magicKind'] or int(raw[5])!=s['nameTextId'] or not key or key in by_skill or s['skillIndex'] in ids:
            raise ValueError('Invalid or duplicate skill identity')
        by_skill[key] = s
        ids.add(s['skillIndex'])
    texts = {}
    for line in sources['text'].decode('utf-8-sig').splitlines():
        r = line.split('\t')
        if r[0].isdigit():
            if len(r)!=5 or r[0] in texts: raise ValueError('Invalid item text identity')
            texts[r[0]] = r[1]
    lines = [l.split('\t') for l in sources['book'].decode('utf-8-sig').splitlines()]
    start = [i for i,r in enumerate(lines) if r[0]=='<Data>']
    end = [i for i,r in enumerate(lines) if r[0]=='<End>']
    if len(start)!=1 or len(end)!=1 or end[0]<=start[0]+1: raise ValueError('Invalid book markers')
    header = lines[start[0]+1]
    if len(header)!=50 or len(set(header))!=50 or not set(FIELDS)<=set(header): raise ValueError('Unexpected book schema')
    rows=[]; groups=defaultdict(list); all_ids=set(); raw_classes=set()
    for i,r in enumerate(lines[start[0]+2:end[0]],start[0]+3):
        if not r[0] or r[0].startswith('//'): continue
        if len(r)!=len(header): raise ValueError(f'Invalid row width at {i}')
        obj=dict(zip(header,r))
        if not obj['Unique'].isdigit() or obj['NameTextNum'] not in texts: raise ValueError(f'Unresolved item at {i}')
        item=obj['Unique']; groups[item].append(obj)
        if obj['Nation']=='ALL':
            if item in all_ids: raise ValueError('Repeated ALL item '+item)
            all_ids.add(item)
        skill=by_skill.get(obj['SkillKind'])
        if obj['SkillKind']!='NULL' and skill is None: raise ValueError('Unresolved SkillKind '+obj['SkillKind'])
        for field in ('NeedSkill','DownSkillCode'):
            if obj[field]!='NULL' and obj[field] not in by_skill: raise ValueError('Unresolved '+field+' '+obj[field])
        cls=[obj[f] for f in CLASS_FIELDS if obj[f] not in ('','NULL')]
        if skill: raw_classes.update(cls)
        rows.append({'sourceLine':i,'englishItemName':texts[obj['NameTextNum']], 'raw':{f:obj[f] for f in FIELDS},'classTokens':cls,'skill':{k:skill[k] for k in ('skillIndex','magicCode','englishName')} if skill else None})
    skill_rows=[r for r in rows if r['skill'] is not None]
    if all_ids!=set(groups): raise ValueError('ItemID without ALL definition')
    variants=[{'itemId':k,'nations':[r['Nation'] for r in v],'differentFields':[f for f in header if len({r[f] for r in v})>1]} for k,v in groups.items() if len(v)>1]
    audit={'schemaVersion':1,'publicationStatus':'private-review-candidate','sha256Inputs':{k:hashlib.sha256(v).hexdigest() for k,v in sources.items()},'counts':{'bookRows':len(rows),'itemIds':len(groups),'skillRows':len(skill_rows),'skillItemIds':len({r['raw']['Unique'] for r in skill_rows}),'skillKinds':len({r['raw']['SkillKind'] for r in skill_rows}),'classTokens':len(raw_classes),'regionalVariantIds':len(variants),'blankClassRows':sum(any(r['raw'][f]=='' for f in CLASS_FIELDS) for r in skill_rows)},'nations':dict(Counter(r['raw']['Nation'] for r in rows)),'skillLimits':dict(Counter(r['raw']['SkillLimit'] for r in skill_rows)),'limitations':['Book use restrictions, not exhaustive mercenary skill ownership or server enforcement.','Class token to character identity not reconciled.','Regional variants retained; ALL is a source label, not verified server selection.','Book SkillLimit is distinct from stored Magic Grade.']}
    dest=Path(dest); dest.mkdir(parents=True,exist_ok=False)
    for name,data in [('book-restrictions',rows),('regional-variants',variants),('audit',audit)]:
        (dest/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return audit

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ('book','text','skills','destination'): p.add_argument(arg)
    a=p.parse_args(); print(json.dumps(export(a.book,a.text,a.skills,a.destination),indent=2))
