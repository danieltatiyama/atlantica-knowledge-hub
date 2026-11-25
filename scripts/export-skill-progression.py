#!/usr/bin/env python3
"""Export only selected fields from previously decoded mode candidates; no decoder."""
import argparse, hashlib, json
from pathlib import Path
from collections import Counter
MODES=('Magic','MagicPVP','MagicPVPBattleGround','BF_Magic','BF_MagicPvP','BF_MagicPvPLeague')
FIELDS=('MagicType','MaxBookSkillLevel','MaxTotalSkillLevel','Probability','ProbabilityInc*10','MotionProbability','MotionProbabilityInc*10','EndowedAmount_AttackPowerDamageRate','EndowedAmountInc_AttackPowerDamageRate*100','ConsIncMP','EndowedIncTurn*10','EndowedAmount_ATT','EndowedAmountInc_ATT','EndowedAmount_AC','EndowedAmountInc_AC*10','EndowedAmount_STR','EndowedAmountInc_STR*10','EndowedAmount_DEX','EndowedAmountInc_DEX*10','EndowedAmount_VIT','EndowedAmountInc_VIT*10','EndowedAmount_INT','EndowedAmountInc_INT*10','EndowedAmount_HitRate','EndowedAmountInc_HitRate*10','EndowedAmount_EV','EndowedAmountInc_EV*10','EndowedAmount_SeriesHitRate','EndowedAmountInc_SeriesHitRate*10','EndowedAmount_Critical','EndowedAmountInc_Critical*10','Piercing_Amount_HP','Piercing_AmountInc_HP','TakeHP','TakeHPInc','EndowedAmount_MP','EndowedAmountInc_MP','EndowedAmount_ActivePower','EndowedAmountInc_ActivePower*10')
def export(base,source,destination):
    base=Path(base); source=Path(source); destination=Path(destination)
    b=base.read_bytes(); d=json.loads(b); assert d['scope']=='expanded-reference-candidate'
    rows={}; hashes={}; counts={}
    for mode in MODES:
        raw=(source/(mode+'.json')).read_bytes(); s=json.loads(raw); hashes[mode]=hashlib.sha256(raw).hexdigest(); h=s['columns']; assert len(h)==99 and len(set(h))==99
        by_line={line:r for line,r in s['records']}; assert len(by_line)==len(s['records'])
        out=[]
        for row in d['modes'][mode]:
            kind,grade,line,conflict=row[:4]; r=by_line[line]; assert (r[h.index('Magic_Kind')],int(r[h.index('Grade')]))==(kind,grade)
            assert all(r[h.index(k)]==v for k,v in zip(d['columns'][4:],row[4:])), (mode,line)
            values=[r[h.index(k)] for k in FIELDS]
            # Sparse, lossless for allowlisted fields: missing is never zero.
            out.append([kind,grade,line,conflict,values[0],[[i,v] for i,v in enumerate(values[1:],1) if v!='0']])
        assert len(out)==len(d['modes'][mode]); rows[mode]=out; counts[mode]=len(out)
    result={'schemaVersion':1,'scope':d['scope'],'sourceDate':d['sourceDate'],'baseSha256':hashlib.sha256(b).hexdigest(),'sourceCandidateSha256':hashes,'columns':list(FIELDS),'modes':rows}
    destination.parent.mkdir(parents=True,exist_ok=True); destination.write_text(json.dumps(result,separators=(',',':'))+'\n',encoding='utf-8'); print(json.dumps({'rows':counts,'total':sum(counts.values()),'fields':len(FIELDS),'bytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()},indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('base');p.add_argument('source');p.add_argument('destination');a=p.parse_args();export(a.base,a.source,a.destination)
