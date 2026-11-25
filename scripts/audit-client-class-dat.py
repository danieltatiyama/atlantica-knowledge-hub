#!/usr/bin/env python3
"""Audit decoded class definitions and binary DAT layouts, without publishing raw data."""
import argparse, hashlib, json, re, struct
from collections import Counter, defaultdict
from pathlib import Path


def audit(classes, books, evolution, root_dat, eng_dat, event_dat):
    inputs = {k: Path(v).read_bytes() for k,v in locals().copy().items()}
    rr = [line.split('\t') for line in inputs['classes'].decode('utf-8-sig').splitlines()]
    starts = [i for i,r in enumerate(rr) if r[0]=='[CLASSTYPE_INDEX]']
    if len(starts)!=1: raise ValueError('Invalid class section')
    index = {}
    masks = set(); text_ids = set()
    for r in rr[starts[0]+1:]:
        if not r[0] or r[0].startswith('//'): continue
        if len(r)!=4 or not re.fullmatch(r'CLS1?_[A-Z0-9_]+',r[0]) or not re.fullmatch(r'0x[0-9A-Fa-f]{16}',r[1]) or not r[2].isdigit() or not r[3].isdigit():
            raise ValueError('Invalid class row')
        token, mask, txt, sol = r
        group = token.split('_',1)[0]; value=int(mask,16)
        if token in index or (group,value) in masks or txt in text_ids or value.bit_count()!=1: raise ValueError('Repeated or invalid class identity')
        masks.add((group,value)); text_ids.add(txt)
        index[token] = dict(classToken=token, namespace=group, mask=mask, nameTextKey=int(txt), solType=int(sol))
    refs = defaultdict(set)
    for row in json.loads(inputs['books']):
        if not row['skill']: continue
        for token in row['classTokens']:
            if token not in index: raise ValueError('Unknown class token '+token)
            refs[token].add(row['skill']['skillIndex'])
    evo = {r['raw'][0]:r for r in json.loads(inputs['evolution'])['records']}
    for token,row in index.items():
        key=token.split('_',1)[1]+'1'
        row['bookSkillIndexes']=sorted(refs[token])
        row['evolutionNameCandidate'] = {'char':key,'baseGrade':evo[key]['raw'][10],'charKindCode':evo[key]['kind'][1][1],'status':'lexical-candidate-only'} if key in evo else None
    def parse_dat(data):
        if len(data)%616: raise ValueError('Invalid DAT byte length')
        rows=list(struct.iter_unpack('<154i',data)); default=rows[0]; active={}
        for i,r in enumerate(rows):
            if r==default: continue
            if i==0 or r[0]!=i: raise ValueError('Non-default row ID not equal to slot')
            active[i]=r
        return rows,active
    ar,a=parse_dat(inputs['root_dat']); br,b=parse_dat(inputs['eng_dat']); shared=a.keys()&b.keys()
    data=inputs['event_dat']; width=struct.unpack_from('<I',data)[0]
    if width!=2012 or (len(data)-4)%width: raise ValueError('Unexpected EVENTCHAR layout')
    labels=[]; empty=0
    for i,offset in enumerate(range(4,len(data),width)):
        record=data[offset:offset+width]
        if not any(record): empty+=1; continue
        label=record[:64].split(b'\x00',1)[0].decode('ascii')
        if not label: raise ValueError('Active event without leading label')
        labels.append({'slot':i,'label':label})
    if len({r['label'] for r in labels})!=len(labels): raise ValueError('Duplicate event label')
    report={'schemaVersion':1,'publicationStatus':'private-review-candidate', 'sha256Inputs':{k:hashlib.sha256(v).hexdigest() for k,v in inputs.items()},
        'classes':{'definitions':len(index),'withBookRefs':sum(bool(v) for v in refs.values()),'withoutBookRefs':sorted(k for k in index if not refs[k]),'crossNamespaceMaskCollisions':sum(v>1 for v in Counter(int(r['mask'],16) for r in index.values()).values()),'lexicalEvolutionCandidates':sum(r['evolutionNameCandidate'] is not None for r in index.values())},
        'charItemInfo':{'recordBytes':616,'rootSlots':len(ar),'engSlots':len(br),'rootActive':len(a),'engActive':len(b),'sharedActive':len(shared),'identicalShared':sum(a[i]==b[i] for i in shared),'differentShared':sum(a[i]!=b[i] for i in shared),'rootOnly':len(a.keys()-b.keys()),'engOnly':len(b.keys()-a.keys())},
        'eventChar':{'recordBytes':width,'slots':(len(data)-4)//width,'named':len(labels),'empty':empty},
        'limitations':['NameTxtKey namespace unresolved; no official class labels inferred.','Evolution candidates are lexical only, not explicit joins.','No attribute offsets, drop probabilities, event behavior or server selection inferred.','No change to existing published monster data.']}
    return report, list(index.values()), labels

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('classes','books','evolution','root_dat','eng_dat','event_dat','destination'): p.add_argument(name)
    a=p.parse_args(); report,classes,events=audit(a.classes,a.books,a.evolution,a.root_dat,a.eng_dat,a.event_dat)
    dest=Path(a.destination);dest.mkdir(parents=True,exist_ok=False)
    for name,obj in [('audit',report),('class-candidates',classes),('event-labels',events)]:
        (dest/(name+'.json')).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))
