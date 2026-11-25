#!/usr/bin/env python3
"""Build a compact, lossless projection of selected context fields and explicit combos."""
import argparse, hashlib, json
from pathlib import Path
MODES=('Magic','MagicPVP','MagicPVPBattleGround','BF_Magic','BF_MagicPvP','BF_MagicPvPLeague')
FIELDS=('Category','EndowedObj','Reach','Grid','SelfMagicKind','SelfMagicGrade','CHANGEMAGIC','CHANGETURN','ActCondAP','ActCondMaxHP(%)','ActCondMinHP(%)','BF_GridMax','BF_MagicRange','Physical_Hit')
def digest(b): return hashlib.sha256(b).hexdigest()
def export(base,skills,source,dest):
    base,skills,source,dest=map(Path,(base,skills,source,dest))
    raw=base.read_bytes(); b=json.loads(raw); sraw=skills.read_bytes(); s=json.loads(sraw)
    if b['scope']!='expanded-reference-candidate' or s['scope']!=b['scope']: raise ValueError('Scope mismatch')
    kinds={}
    for r in s['rows']: kinds.setdefault(r[2],[]).append(r[0])
    dictionaries=[]; indexes={}; modes={}; source_hashes={}
    for m in MODES:
        data=(source/(m+'.json')).read_bytes(); d=json.loads(data); source_hashes[m]=digest(data); h=d['columns']; by_line=dict(d['records']); rows=[]
        if len(by_line)!=len(d['records']) or len(by_line)!=len(b['modes'][m]): raise ValueError('Source count mismatch')
        for r in b['modes'][m]:
            kind,grade,line,conflict=r[:4]; values=by_line[line]
            if (values[h.index('Magic_Kind')],int(values[h.index('Grade')]))!=(kind,grade) or any(values[h.index(k)]!=v for k,v in zip(b['columns'][4:],r[4:])): raise ValueError(f'Source mismatch {m}:{line}')
            key=tuple(values[h.index(k)] for k in FIELDS)
            if key not in indexes: indexes[key]=len(dictionaries); dictionaries.append(list(key))
            rows.append([kind,grade,line,conflict,indexes[key]])
        modes[m]=rows
    craw=(source/'ComboMagicCheck.json').read_bytes(); c=json.loads(craw)
    if c['columns']!=['AddMagicName','OrgMagicCode','ChangedMagicName']: raise ValueError('Combo schema')
    combos=[]
    for line,(added,original,result) in c['records']:
        if any(len(kinds.get(k,[]))!=1 for k in (added,original,result)): raise ValueError('Ambiguous combo reference')
        combos.append([line,original,added,result])
    d={'schemaVersion':1,'scope':b['scope'],'baseSha256':digest(raw),'skillsSha256':digest(sraw),'sourceCandidateSha256':{**source_hashes,'ComboMagicCheck':digest(craw)},'columns':list(FIELDS),'dictionary':dictionaries,'modes':modes,'combos':combos}
    dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(d,separators=(',',':'))+'\n',encoding='utf8'); print(json.dumps({'rows':sum(map(len,modes.values())),'fields':len(FIELDS),'unique_contexts':len(dictionaries),'combos':len(combos),'combo_kinds':len({k for r in combos for k in r[1:]}),'sha256':digest(dest.read_bytes()),'size':dest.stat().st_size},indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('base','skills','source','dest'):p.add_argument(name)
    a=p.parse_args();export(a.base,a.skills,a.source,a.dest)
