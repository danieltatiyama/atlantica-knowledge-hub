#!/usr/bin/env python3
"""Reconcile decoded VNA and legacy NDT character tables; private review only."""
import argparse, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path

def export(source, destination):
    source, dest = Path(source), Path(destination)
    names = ('SolInfo.vna','OneLevelSolInfo_ENG.vna','CharEtcInfo.vna','AWKLevelSolInfo_ENG.vna',
             'OneLevelSolInfo_ENG.ndt','CharEtcInfo.ndt','CharAttackInfo.ndt','TextMgr_CharInfo_ENG.ntx')
    blobs = {n:(source/(n+'.txt')).read_bytes() for n in names}
    def table(n):
        rows = [l.split('\t') for l in blobs[n].decode('utf-8-sig').splitlines()]
        a = [i for i,r in enumerate(rows) if r[0]=='<Data>']
        b = [i for i,r in enumerate(rows) if r[0]=='<End>']
        if len(a)!=1 or len(b)!=1 or b[0]<=a[0]+1: raise ValueError(n+': markers')
        header = rows[a[0]+1]; groups=defaultdict(list)
        for i,r in enumerate(rows[a[0]+2:b[0]],a[0]+3):
            if not r[0] or r[0].startswith(('//','"//')): continue
            if len(r)!=len(header): raise ValueError(n+': row width')
            groups[r[0]].append({'line':i,'values':r})
        return header,groups
    tables={n:table(n) for n in names[:-1]}
    eh,e=tables[names[1]]; sh,s=tables[names[0]]; ch,c=tables[names[2]]
    wh,w=tables[names[3]]; ah,at=tables[names[6]]
    for h,g in [(eh,e),(sh,s),(wh,w)]:
        if any(len(v)!=1 for v in g.values()): raise ValueError('Duplicate primary identity')
    if any(len(at.get(k,[]))!=1 or len(c.get(k,[]))!=1 for k in e.keys()|s.keys()|w.keys()): raise ValueError('Ambiguous character join')
    texts={}
    for line in blobs[names[7]].decode('utf-8-sig').splitlines():
        r=line.split('\t')
        if r[0].isdigit():
            if len(r)!=5 or r[0] in texts: raise ValueError('Invalid text ID')
            texts[r[0]]=r[1]
    def raw(g,k): return g[k][0]['values']
    edges=[]
    for k in e:
        r=raw(e,k)
        if r[eh.index('BaseGrade')] not in e: raise ValueError('Missing base')
        for t in r[eh.index('NextGrade1'):]:
            if t=='NULL': continue
            if t not in e: raise ValueError('Missing successor')
            edges.append([k,t])
    links=defaultdict(list)
    for x,y in edges: links[x].append(y)
    visiting=set(); done=set()
    def visit(k):
        if k in visiting: raise ValueError('Cycle')
        if k in done: return
        visiting.add(k)
        for t in links[k]: visit(t)
        visiting.remove(k);done.add(k)
    for k in e: visit(k)
    for k in w:
        if k not in e or links[k]: raise ValueError('Awakening non-terminal character')
    profiles=[]
    for k in sorted(e.keys()|s.keys()):
        a=raw(at,k)
        profiles.append(dict(char=k,englishName=texts[a[ah.index('NameTextNum')]],
           classToken=a[ah.index('ClsType')],attack=at[k][0],evolution=e.get(k,[None])[0],
           metadata=s.get(k,[None])[0],etc=c[k][0],awakening=w.get(k,[None])[0]))
    diffs={}
    for new,old in [(names[1],names[4]),(names[2],names[5])]:
        h,g=tables[new]; oh,og=tables[old]
        if h!=oh: raise ValueError('Header mismatch')
        diffs[new]={'added':sorted(g.keys()-og.keys()),'removed':sorted(og.keys()-g.keys()),
           'changed':[{'char':k,'old':og[k],'new':g[k]} for k in sorted(g.keys()&og.keys())
                    if [r['values'] for r in g[k]]!=[r['values'] for r in og[k]]]}
    report=dict(schemaVersion=1,publicationStatus='private-review-candidate',
        sha256Decoded={n:hashlib.sha256(v).hexdigest() for n,v in blobs.items()},
        counts={n:{'rows':sum(map(len,g.values())),'uniqueChars':len(g)} for n,(h,g) in tables.items()},
        families=len({raw(e,k)[eh.index('BaseGrade')] for k in e}),explicitEdges=len(edges),
        profileCount=len(profiles),evolutionClasses=len({raw(at,k)[ah.index('ClsType')] for k in e}),
        evolutionWithoutMetadata=sorted(e.keys()-s.keys()),metadataWithoutEvolution=sorted(s.keys()-e.keys()),
        awakeningRequirements=[{'values':list(k),'count':v} for k,v in Counter(tuple(raw(w,k)[1:]) for k in w).items()],
        jobTypeDifferences=[k for k in s if raw(s,k)[sh.index('JobType')]!=raw(at,k)[ah.index('JobType')]],
        differences={n:{k:len(v) for k,v in d.items()} for n,d in diffs.items()},
        limitations=['Preserve regional and source distinctions; VNA does not prove server behavior.',
                     'No fabricated branch edges or class names. Blank SolInfo headers retained.',
                     'Awakening rows describe requirements, not stat scaling.'])
    dest.mkdir(parents=True,exist_ok=False)
    for n,obj in [('audit',report),('differences',diffs),('profiles',dict(columns={n:h for n,(h,g) in tables.items()},records=profiles,edges=edges))]:
        (dest/(n+'.json')).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source');p.add_argument('destination')
    a=p.parse_args(); print(json.dumps(export(a.source,a.destination),ensure_ascii=False,indent=2))
