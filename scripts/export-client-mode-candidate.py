#!/usr/bin/env python3
"""Export a private review candidate from decoded UTF-8 files, retaining duplicates."""
import argparse, hashlib, json, re
from collections import defaultdict, Counter
from pathlib import Path

MODES = ('Magic','MagicPVP','MagicPVPBattleGround','BF_Magic','BF_MagicPvP','BF_MagicPvPLeague')
EXTRA = ('HeroSpecialization','AWKLevelSkill','MagicEtcInfo','ComboMagicCheck')

def export(source, dest):
    source, dest = Path(source), Path(dest)
    blobs = {n:(source/(n+'.ndt.txt')).read_bytes() for n in MODES+EXTRA}
    blobs['TextMgr_Magic_ENG'] = (source/'TextMgr_Magic_ENG.ntx.txt').read_bytes()
    rows = {n:[l.split('\t') for l in b.decode('utf-8-sig').splitlines()] for n,b in blobs.items()}
    def table(n):
        r=rows[n]; a=[i for i,v in enumerate(r) if v[0]=='<Data>']; b=[i for i,v in enumerate(r) if v[0]=='<End>']
        if len(a)!=1 or len(b)!=1 or b[0]<=a[0]+1: raise ValueError(n+': invalid markers')
        h=r[a[0]+1]; body=[(i+1,v) for i,v in enumerate(r[a[0]+2:b[0]],a[0]+2) if v[0] and not v[0].startswith(('//','"//'))]
        if any(len(v)!=len(h) for _,v in body): raise ValueError(n+': row width mismatch')
        return h,body,[(i+1,v) for i,v in enumerate(r[b[0]+1:],b[0]+1) if v[0]]
    audit={'schemaVersion':1,'publicationStatus':'private-review-candidate','sha256Decoded':{n:hashlib.sha256(b).hexdigest() for n,b in blobs.items()},'modes':{},'auxiliary':{}}
    data={}; indexes={}; conflicts={}
    for n in MODES:
        h,body,tail=table(n)
        if len(h)!=99 or len(set(h))!=99 or h[:4]!=['Magic_Kind','MagicName','MagicIDentyCode','Grade']: raise ValueError(n+': invalid schema')
        groups=defaultdict(list)
        for line,v in body:
            if not v[3].isdigit(): raise ValueError(n+': invalid grade')
            groups[(v[0],v[3])].append((line,v))
        dup={k:v for k,v in groups.items() if len(v)>1}; bad={k:v for k,v in dup.items() if len({tuple(r) for _,r in v})>1}
        audit['modes'][n]={'rows':len(body),'distinctKeys':len(groups),'magicKinds':len({k[0] for k in groups}),'duplicateKeys':len(dup),'conflictingKeys':len(bad),'identicalOnlyDuplicateKeys':len(dup)-len(bad),'trailingNonemptyRows':len(tail)}
        data[n]={'columns':h,'records':body,'trailingExcluded':tail}; indexes[n]=(h,groups)
        conflicts[n]=[{'magicKind':k[0],'grade':k[1],'records':v,'differentFields':[h[i] for i in range(len(h)) if len({r[i] for _,r in v})>1]} for k,v in bad.items()]
    bh,bg=indexes['Magic']
    for n,(h,g) in indexes.items():
        shared=bg.keys()&g.keys(); counter=Counter(); changed=0; excluded=0
        cols=[(i,h.index(c),c) for i,c in enumerate(bh) if c in h]
        for k in shared:
            if len({tuple(r) for _,r in bg[k]})!=1 or len({tuple(r) for _,r in g[k]})!=1: excluded+=1; continue
            a,b=bg[k][0][1],g[k][0][1]; diff=[c for i,j,c in cols if a[i]!=b[j]]; counter.update(diff); changed+=bool(diff)
        audit['modes'][n].update(sharedBaseKeys=len(shared),modeOnlyKeys=len(g.keys()-bg.keys()),baseOnlyKeys=len(bg.keys()-g.keys()),ambiguousSharedKeys=excluded,changedSharedKeys=changed,sameNamedFieldChanges=dict(counter.most_common()),headerDifferences=[{'position':i,'base':a,'mode':b} for i,(a,b) in enumerate(zip(bh,h)) if a!=b])
    mt={}
    for r in rows['TextMgr_Magic_ENG']:
        if r[0].isdigit():
            if len(r)<2 or r[0] in mt: raise ValueError('Invalid magic text ID')
            mt[r[0]]=r[1]
    for n,fields in [('HeroSpecialization',('SkillNameText','MainText','SubText')),('AWKLevelSkill',('NewSkillNameText','NewSkillMainText','NewSkillSubText')),('MagicEtcInfo',())]:
        h,body,tail=table(n); refs=[]
        for line,r in body:
            refs.append({'sourceLine':line,'textRefs':{c:{'id':r[h.index(c)],'text':mt.get(r[h.index(c)])} for c in fields}})
        audit['auxiliary'][n]={'rows':len(body),'columns':len(h),'trailingNonemptyRows':len(tail),'resolvedTextRefs':sum(v['text'] is not None for ref in refs for v in ref['textRefs'].values()),'totalTextRefs':len(body)*len(fields)}
        data[n]={'columns':h,'records':body,'textRefs':refs,'trailingExcluded':tail}
    r=rows['ComboMagicCheck']; start=[i for i,v in enumerate(r) if v[0]=='[COMBOMAGIC_INFO]']
    if len(start)!=1: raise ValueError('Invalid combo section')
    a=start[0]+1; combo=[]; tail=[]; ended=False
    for i,v in enumerate(r[a:],a+1):
        if v[0].startswith('//'): continue
        if not v[0]:
            if combo: ended=True
            continue
        if not ended and len(v)==3 and all(re.fullmatch(r'MAGIC_[A-Z0-9_]+',x) for x in v): combo.append((i,v))
        else: ended=True; tail.append((i,v))
    data['ComboMagicCheck']={'columns':['AddMagicName','OrgMagicCode','ChangedMagicName'],'records':combo,'trailingExcluded':tail}
    audit['auxiliary']['ComboMagicCheck']={'rows':len(combo),'trailingNonemptyRows':len(tail),'unresolvedMagicKeys':sorted({x for _,r in combo for x in r if x not in {k[0] for k in bg}})}
    audit['limitations']=['Mode labels are hypotheses, not server dispatch proof','No fallback across modes','Compare only identical field names; differing suffixes may imply scaling','Conflicting records preserved without selection','Excluded trailing records retained for review','No final combat formulas or mercenary ownership inferred']
    dest.mkdir(parents=True,exist_ok=False)
    for n,obj in {**data,'audit':audit,'conflicts':conflicts}.items(): (dest/(n+'.json')).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return audit

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('destination');a=p.parse_args();print(json.dumps(export(a.source,a.destination),ensure_ascii=False,indent=2))
