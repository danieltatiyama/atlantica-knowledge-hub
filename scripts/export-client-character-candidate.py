#!/usr/bin/env python3
"""Audit decoded character data against previously reconciled private candidates."""
import argparse, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path


def export(attack, text, evolution, classes, skills, destination):
    sources = {k: Path(v).read_bytes() for k, v in [('attack', attack), ('text', text), ('evolution', evolution), ('classes', classes), ('skills', skills)]}
    lines = [s.split('\t') for s in sources['attack'].decode('utf-8-sig').splitlines()]
    start = [i for i,r in enumerate(lines) if r[0]=='<Data>']
    end = [i for i,r in enumerate(lines) if r[0]=='<End>']
    if len(start)!=1 or len(end)!=1 or end[0]<=start[0]+1: raise ValueError('Invalid markers')
    h = lines[start[0]+1]
    if len(h)!=108 or len(set(h))!=108: raise ValueError('Invalid character schema')
    rows = []
    for i,r in enumerate(lines[start[0]+2:end[0]], start[0]+3):
        if not r[0] or r[0].startswith('//'): continue
        if len(r)!=len(h): raise ValueError(f'Invalid row at {i}')
        rows.append((i,dict(zip(h,r))))
    by_char=defaultdict(list)
    for i,r in rows: by_char[r['Char']].append((i,r))
    texts={}
    for line in sources['text'].decode('utf-8-sig').splitlines():
        r=line.split('\t')
        if r[0].isdigit():
            if len(r)!=5 or r[0] in texts: raise ValueError('Invalid text identity')
            texts[r[0]]=r[1]
    cls={r['classToken']:r for r in json.loads(sources['classes'])}
    magic=defaultdict(list)
    for r in json.loads(sources['skills']): magic[r['magicKind']].append(r['skillIndex'])
    profiles=[]; seen=set(); magic_keys=set(); slots=0
    for evo in json.loads(sources['evolution'])['records']:
        key=evo['raw'][0]
        if key in seen or len(by_char[key])!=1: raise ValueError('Ambiguous evolution: '+key)
        seen.add(key); line,r=by_char[key][0]
        if r['ClsType'] not in cls or r['NameTextNum'] not in texts: raise ValueError('Unresolved evolution identity: '+key)
        refs=[]
        for suffix in ('','2','3','4','5'):
            m=r['Magic'+suffix]
            if m=='NULL': continue
            if not magic[m]: raise ValueError('Unknown magic: '+m)
            refs.append({'magicKind':m,'rawSkillValue':r['Skill'+suffix],'candidateSkillIndexes':sorted(magic[m])})
            magic_keys.add(m);slots+=1
        profiles.append({'sourceLine':line,'char':key,'englishName':texts[r['NameTextNum']], 'classToken':r['ClsType'],'raw':r,'evolution':evo,'configuredMagicSlots':refs,'bookSkillIndexes':cls[r['ClsType']]['bookSkillIndexes']})
    variants=Counter((r['Char'],r['Nation']) for _,r in rows)
    audit={'schemaVersion':1,'publicationStatus':'private-review-candidate','sha256Inputs':{k:hashlib.sha256(v).hexdigest() for k,v in sources.items()},'counts':{'rows':len(rows),'distinctChars':len(by_char),'evolutions':len(profiles),'evolutionClasses':len({r['classToken'] for r in profiles}),'classesWithBooks':len({r['classToken'] for r in profiles if r['bookSkillIndexes']}),'configuredMagicSlots':slots,'distinctConfiguredMagicKeys':len(magic_keys)},'nations':dict(Counter(r['Nation'] for _,r in rows)),'duplicateCharNation':[{'char':k[0],'nation':k[1],'count':v} for k,v in variants.items() if v>1],'limitations':['Raw attributes are not final calculated stats.','Configured magic slots and book permissions are not an exhaustive learned-skill list.','Class display-name text namespace unresolved.','Regional variants preserved; no server selection inferred.']}
    dest=Path(destination);dest.mkdir(parents=True,exist_ok=False)
    for name,obj in [('audit',audit),('evolution-profiles',profiles)]:
        (dest/(name+'.json')).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return audit

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ('attack','text','evolution','classes','skills','destination'): p.add_argument(arg)
    a=p.parse_args();print(json.dumps(export(a.attack,a.text,a.evolution,a.classes,a.skills,a.destination),indent=2))
