#!/usr/bin/env python3
"""Import an audited, private map extraction; never decrypt or publish full game files.

Usage: python scripts/import-client-maps.py /path/to/extracted-review-package
Python 3 + Pillow. Exact published CharID/Kind/name joins; unknowns stay in audit.
"""
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = {102: 'SPIRITFOREST1', 3002: 'AtlCube03', 129: 'SKYGARDEN1', 272: 'GRANDCANYON1'}


def run(source):
    source = Path(source)
    read = lambda name: json.loads((source / (name + '.json')).read_text(encoding='utf-8'))
    audit, raw, groups, links = [read(n) for n in ('audit', 'map-source-records', 'location-groups', 'monster-locations')]
    catalog = {int(r[0]): r for p in (ROOT / 'public/data/client-monsters').glob('index-*.json')
               for r in json.loads(p.read_text())['rows']}
    bymap = defaultdict(list)
    for r in raw:
        bymap[int(r['values']['MapIndex'])].append(r)
    bysection = defaultdict(list)
    areas = []
    for g in groups:
        if not g['englishName']:
            raise ValueError('Unresolved location name')
        id = g['parentMapId']
        areas.append(dict(id=id, name=g['englishName'], mode=g['mode'], sections=g['sectionMapIds']))
        for sid in g['sectionMapIds']:
            bysection[sid].append(id)
    if len({a['id'] for a in areas}) != len(areas):
        raise ValueError('Duplicate area identity')
    pairs, monsters, evidence = {}, {}, []
    for r in links:
        id, mid = r['charId'], r['mapId']
        c = catalog.get(id)
        if not c or c[1] != r['name'] or c[3] != r['kind']:
            raise ValueError('CharID identity differs from published bestiary')
        if (mid, id) in pairs:
            raise ValueError('Duplicate monster/map pair')
        pairs[mid, id] = True
        monsters[str(id)] = dict(name=c[1], level=c[2], kind=c[3])
        evidence.append(dict(mapId=mid, charId=id, records=r['evidence']))
    maps = {}
    for id in sorted(set(bysection) | {r['mapId'] for r in links}):
        choices = bymap[id]
        r = choices[0] if len(choices) == 1 else None
        v = r['values'] if r else {}
        maps[str(id)] = dict(id=id, name=r['displayName'] if r else None,
            nameTextId=int(v['MapNameNum']) if r else None,
            nameRaw=r['englishNameRaw'] if r else None,
            minLevel=int(v['Level']) if r else None,
            maxLevel=int(v['LimitMaxLevel']) if r else None,
            type=v.get('MapTypeCode'), areas=bysection[id],
            monsters=sorted(cid for mid, cid in pairs if mid == id),
            image=None, sourceLine=r['sourceLine'] if r else None,
            status='resolved' if r else ('missing-map' if not choices else 'ambiguous-map'))
    snapshots = {102: {201,202,203,204,205,206,209,210,552,639},
                 3002: {3956,3957,3958,3959,3960}, 129: {364,365,369,370,371,649},
                 272: {1067,1068,1069,1070}}
    for mid, ids in snapshots.items():
        if set(maps[str(mid)]['monsters']) != ids:
            raise ValueError('Screenshot monster set differs')
    if {mid for mid,cid in pairs if cid == 205} != {102,165,166,167}:
        raise ValueError('Devil Tree screenshot locations differ')
    dest = ROOT / 'public/data/client-maps'
    images = ROOT / 'public/images/client-maps'
    dest.mkdir(parents=True, exist_ok=True)
    images.mkdir(parents=True, exist_ok=True)
    image_audit = []
    for id, name in IMAGES.items():
        original = Image.open(source / 'images' / (name + '.png')).convert('RGBA')
        path = images / (str(id) + '.webp')
        original.save(path, format='WEBP', lossless=True, exact=True)
        decoded = Image.open(path).convert('RGBA')
        if original.tobytes() != decoded.tobytes():
            raise ValueError('Map image pixel mismatch')
        maps[str(id)]['image'] = dict(src='/images/client-maps/' + path.name,
                                      width=original.width, height=original.height)
        image_audit.append(dict(mapId=id, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                                bytes=path.stat().st_size))
    data = dict(schemaVersion=1, source='client-map-extraction-2026-11-27',
                areas=areas, maps=maps, monsters=monsters)
    report = dict(schemaVersion=1, sourceSha256=audit['sourceSha256'],
        counts=dict(areas=len(areas), maps=len(maps), monsterMapPairs=len(pairs),
                    monsters=len(monsters), mapsWithMonsters=sum(bool(m['monsters']) for m in maps.values())),
        unresolvedMapIds=[m['id'] for m in maps.values() if m['status'] != 'resolved'],
        excludedUnresolvedCharacterIds=audit['counts']['unresolvedCharacterIds'],
        sourceDuplicateMapIds=audit['duplicateMapIds'], images=image_audit,
        screenshotChecks=audit['screenshotChecks'], binaryLayoutCandidate=audit['binaryLayoutCandidate'],
        limitations=audit['limitations'], evidence=evidence)
    (dest / 'catalog.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    (dest / 'evidence.json').write_text(json.dumps(report, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(json.dumps(report['counts']))


if __name__ == '__main__':
    run(sys.argv[1])
