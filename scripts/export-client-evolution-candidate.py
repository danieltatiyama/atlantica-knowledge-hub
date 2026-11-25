#!/usr/bin/env python3
"""Build a private evolution/Awakening audit from decoded UTF-8 sources."""
import argparse, hashlib, json
from collections import Counter, defaultdict
from pathlib import Path

FILES = ("OneLevelSolInfo_ENG.ndt", "CharKindInfo.ndt", "CharEtcInfo.ndt",
         "LGCLASSINFO.NDT", "LGClassInfo_ENG.ndt", "AWKLevelSkillSpend.ndt",
         "AWKLevelSkill.ndt", "TextMgr_Interface_ENG.ntx")

def export(source, destination):
    source, destination = Path(source), Path(destination)
    blobs = {n:(source/(n+".txt")).read_bytes() for n in FILES}
    lines = {n:[s.rstrip("\r").split("\t") for s in b.decode("utf-8-sig").split("\n")] for n,b in blobs.items()}
    def table(n):
        rr=lines[n]
        a=[i for i,r in enumerate(rr) if r[0]=="<Data>"]
        z=[i for i,r in enumerate(rr) if r[0]=="<End>"]
        if len(a)!=1 or len(z)!=1 or a[0]+1>=z[0]: raise ValueError(n+": markers")
        h=rr[a[0]+1]
        body=[(i+1,r) for i,r in enumerate(rr[a[0]+2:z[0]],a[0]+2) if r[0] and not r[0].startswith(("//",'"//'))]
        if len(set(h))!=len(h) or any(len(r)!=len(h) for _,r in body): raise ValueError(n+": schema")
        return h,body
    def unique(rows, key, label):
        d={}
        for line,r in rows:
            k=r[key]
            if k in d: raise ValueError(label+": duplicate "+k)
            d[k]=(line,r)
        return d
    h,rows=table(FILES[0])
    if h!=["Char","ExpRank","Price","NeedLevel","CrystalUnique","CrystalNum","AtlasUnique","AtlasNum","FireMoney","EmployLimit","BaseGrade","NextGrade1","NextGrade2","NextGrade3","NextGrade4"]: raise ValueError("Evolution schema")
    evo=unique(rows,0,"evolution")
    kind=defaultdict(list)
    for i,r in enumerate(lines[FILES[1]],1):
        if len(r)==4 and r[0].startswith("KIND_") and r[1].isdigit(): kind[r[0]].append((i,r))
    eh,er=table(FILES[2]); etc=defaultdict(list)
    for i,r in er: etc[r[0]].append((i,r))
    records=[]; edges=[]
    for k,(line,r) in evo.items():
        if len(kind["KIND_"+k])!=1 or len(etc[k])!=1: raise ValueError("Unresolved character: "+k)
        if r[10] not in evo: raise ValueError("Missing BaseGrade: "+k)
        for target in r[11:]:
            if target=="NULL": continue
            if target not in evo: raise ValueError("Missing target: "+target)
            edges.append((k,target))
        records.append({"sourceLine":line,"raw":r,"kind":kind["KIND_"+k][0],"etc":etc[k][0]})
    families=Counter(r[10] for _,r in rows)
    targets={b for _,b in edges}
    orphan=[{"char":k,"baseGrade":r[10]} for k,(_,r) in evo.items() if k!=r[10] and k not in targets]
    cross=[(a,b) for a,b in edges if evo[a][1][10]!=evo[b][1][10]]
    links=defaultdict(list)
    for a,b in edges: links[a].append(b)
    active=set(); visited=set()
    def visit(k):
        if k in active: raise ValueError("Evolution cycle: "+k)
        if k in visited: return
        active.add(k)
        for target in links[k]: visit(target)
        active.remove(k); visited.add(k)
    for k in evo: visit(k)
    lh,lr=table(FILES[3]); gh,gr=table(FILES[4])
    if lh!=gh: raise ValueError("League headers differ")
    root=unique(lr,0,"league root"); eng=unique(gr,0,"league ENG")
    if root.keys()!=eng.keys(): raise ValueError("League IDs differ")
    differences=[{"class":k,"fields":{c:[a,b] for c,a,b in zip(lh,root[k][1],eng[k][1]) if a!=b}} for k in root if root[k][1]!=eng[k][1]]
    sh,sr=table(FILES[5]); ah,ar=table(FILES[6])
    texts={}
    for r in lines[FILES[7]]:
        if r[0].isdigit():
            if len(r)<2 or r[0] in texts: raise ValueError("Interface text duplicate")
            texts[r[0]]=r[1]
    awk=[]
    for i,r in ar:
        refs={k:{"id":r[ah.index(k)],"text":texts[r[ah.index(k)]]} for k in ("NewSkillTapText","NewSkillNameIndex")}
        awk.append({"sourceLine":i,"raw":r,"interface":refs})
    audit={"publicationStatus":"private-review-candidate","sha256Decoded":{n:hashlib.sha256(b).hexdigest() for n,b in blobs.items()},
           "evolutionRows":len(rows),"families":len(families),"explicitEdges":len(edges),"noExplicitPredecessor":orphan,"crossFamilyEdges":cross,
           "leagueRows":len(lr),"leagueDifferences":differences,"awakeningRows":len(ar),"resolvedInterfaceReferences":len(awk)*2,
           "limitations":["Root ONELEVELSOLINFO.NDT is NCR v1; excluded.","No CharKind-to-skill ownership inferred.","No inferred evolution edges or live league rules.","No numeric awakening scaling or reset formula inferred."]}
    destination.mkdir(parents=True,exist_ok=False)
    for n,obj in {"evolution":{"columns":h,"kindColumns":["CharKindName","CharKindCode","MoveSpeed","Size"],"etcColumns":eh,"records":records,"edges":edges},
                  "league":{"columns":lh,"root":lr,"english":gr,"differences":differences},
                  "awakening":{"columns":ah,"records":awk,"spendColumns":sh,"spendRows":sr},"audit":audit}.items():
        (destination/(n+".json")).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return audit

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source")
    parser.add_argument("destination")
    args=parser.parse_args()
    print(json.dumps(export(args.source,args.destination),ensure_ascii=False,indent=2))
