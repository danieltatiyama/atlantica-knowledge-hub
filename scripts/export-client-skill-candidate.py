#!/usr/bin/env python3
"""Read decoded UTF-8 client files; build a private review candidate, not public data."""
import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

FILES = ('SkillInfoIndex.ndt', 'MagicIndex.ndt', 'Magic.ndt',
         'TextMgr_Magic_ENG.ntx', 'CharKindInfo.ndt', 'TextMgr_CharInfo_ENG.ntx')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def section(rows, start, end=None):
    starts = [i for i, r in enumerate(rows) if r[0] == start]
    require(len(starts) == 1, f'Expected one marker {start}')
    first = starts[0] + 1
    if end:
        ends = [i for i, r in enumerate(rows) if r[0] == end]
        require(len(ends) == 1 and ends[0] >= first, f'Invalid marker {end}')
        return rows[first:ends[0]]
    return rows[first:]


def unique(rows, key, label):
    result = {}
    for row in rows:
        k = key(row)
        require(k not in result, f'Duplicate {label}: {k}')
        result[k] = row
    return result


def data_rows(rows):
    return [r for r in rows if r[0] and not r[0].startswith(('//', '"//'))]


def export(source, dest):
    files = {n: (source / (n + '.txt')).read_bytes() for n in FILES}
    rows = {n: [line.split('\t') for line in b.decode('utf-8-sig').split('\n')]
            for n, b in files.items()}
    # Preserve literal backslash-r in source text; strip only physical CRLF.
    rows = {n: [[v.rstrip('\r') if i == len(r)-1 else v for i, v in enumerate(r)]
                for r in rr] for n, rr in rows.items()}
    skill_rows = rows['SkillInfoIndex.ndt']
    index = data_rows(section(skill_rows, '[SKILL_INDEX]', '[SKILLINFO_INDEX]'))
    info = [r for r in data_rows(section(skill_rows, '[SKILLINFO_INDEX]')) if r[0]]
    magic_index = data_rows(section(rows['MagicIndex.ndt'], '[MAGIC_INDEX]'))
    kinds = data_rows(section(rows['CharKindInfo.ndt'], '[CHARKIND_INFO]'))
    require(all(len(r) == 11 and r[1].isdigit() and not any(r[2:]) for r in index), 'Invalid skill index row')
    require(all(len(r) == 11 and r[5].isdigit() and r[9].isdigit() for r in info), 'Invalid skill info row')
    require(all(len(r) == 2 and r[1].isdigit() for r in magic_index), 'Invalid magic index row')
    require(all(len(r) == 4 and r[1].isdigit() for r in kinds), 'Invalid character kind row')
    sidx = unique(index, lambda r:r[0], 'skill key')
    unique(index, lambda r:r[1], 'SkillIndex')
    details = unique(info, lambda r:r[0], 'skill info key')
    require(sidx.keys() == details.keys(), 'Skill index and info keys differ')
    midx = unique(magic_index, lambda r:r[0], 'magic key')
    unique(magic_index, lambda r:r[1], 'MagicCode')
    unique(kinds, lambda r:r[1], 'CharKindCode')
    def texts(name):
        t = [r for r in rows[name] if r[0].isdigit()]
        require(all(len(r) == 5 for r in t), f'Invalid translation row: {name}')
        return unique(t, lambda r:r[0], name + ' text ID')
    mt, ct = texts('TextMgr_Magic_ENG.ntx'), texts('TextMgr_CharInfo_ENG.ntx')
    magic = section(rows['Magic.ndt'], '<Data>', '<End>')
    header, grades = magic[0], data_rows(magic[1:])
    require(header[:4] == ['Magic_Kind','MagicName','MagicIDentyCode','Grade'] and len(header) == len(set(header)), 'Unexpected grade header')
    require(all(len(r) == len(header) and r[0] in midx and r[3].isdigit() for r in grades), 'Invalid magic grade row')
    unique(grades, lambda r:(r[0],r[3]), 'magic key + grade')
    by_magic = defaultdict(list)
    for r in grades:
        by_magic[r[0]].append(int(r[3]))
    skills = []
    for key, r in details.items():
        require(r[4] in midx and r[5] in mt and r[9] in mt, f'Unresolved skill identity: {key}')
        skills.append(dict(skillIndex=int(sidx[key][1]), skillIndexName=key,
                           magicCode=int(midx[r[4]][1]), magicKind=r[4],
                           nameTextId=int(r[5]), englishName=mt[r[5]][1],
                           descriptionTextId=int(r[9]), description=mt[r[9]][1],
                           rawSkillInfo=r, grades=sorted(by_magic[r[4]])))
    skills.sort(key=lambda s:s['skillIndex'])
    trailing = [r for r in rows['Magic.ndt'][next(i for i,r in enumerate(rows['Magic.ndt']) if r[0]=='<End>')+1:] if r[0]]
    audit = dict(schemaVersion=1, publicationStatus='private-review-candidate',
                 sha256Decoded={n:hashlib.sha256(b).hexdigest() for n,b in files.items()},
                 counts=dict(skills=len(skills), magicIndex=len(midx), magicKindsWithGrades=len({r[0] for r in grades}),
                             gradeRows=len(grades), gradeFields=len(header), characterKinds=len(kinds),
                             magicTextRows=len(mt), characterTextRows=len(ct)),
                 missingGradeSkills=[s['skillIndex'] for s in skills if not s['grades']],
                 duplicateCharacterKindNames={k:v for k,v in Counter(r[0] for r in kinds).items() if v>1},
                 ignoredTrailingMagicRows=len(trailing),
                 matchingMagicIdentityCodes=sum(r[2]==midx[r[0]][1] for r in grades),
                 limitations=['No CharKindCode to CharInfo text ID join established',
                              'No mercenary-to-skill relation established',
                              'No mode comparison or formula interpretation established'])
    dest.mkdir(parents=True, exist_ok=False)
    for n,obj in [('skills',skills),('magic-grades',dict(columns=header,rows=grades)),
                  ('character-kinds',kinds),('audit',audit)]:
        (dest/(n+'.json')).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return audit


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source',type=Path)
    p.add_argument('destination',type=Path)
    a=p.parse_args()
    print(json.dumps(export(a.source,a.destination),ensure_ascii=False,indent=2))
