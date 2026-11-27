"""Build published item icon sprites from the audited extraction directory.
Requires Pillow. Run: python scripts/import-client-item-icons.py EXTRACTION_DIR
No raw game tables or encrypted files are published. Exact pixel lossless WebP.
"""
import hashlib,json,sys
from pathlib import Path
from PIL import Image

def build(source,root):
    source=Path(source);root=Path(root)
    report=json.loads((source/'manifest.json').read_text())
    if report['errors'] or report['missingSheets']:raise ValueError('Incomplete extraction')
    catalog=root/'public/data/client-items';meta=json.loads((catalog/'manifest.json').read_text())
    rows=[row for shard in meta['indexShards'] for row in json.loads((catalog/shard).read_text())['rows']]
    named={int(r[0]) for r in rows if r[6]=='named'}
    entries=json.loads((source/'item-icon-map.json').read_text());mapping={};excluded=[]
    for entry in entries:
        id=entry['itemId'];evidence=entry['evidence']
        refs={(r['imageFileRaw'],r['imageFontRaw']) for r in evidence}
        if entry['status']!='available' or len(refs)!=1 or id not in named:
            excluded.append({'itemId':id,'reason':entry['status'] if entry['status']!='available' else 'catalog-identity-not-reconciled','references':[{'source':r['source'],'line':r['sourceLine'],'sheet':r['imageFileRaw'],'index':r['imageFontRaw']} for r in evidence]});continue
        r=evidence[0];sid,index=r['sheet'],r['index']
        if not 0<=index<120 or r['x']!=index%10*40 or r['y']!=index//10*40:raise ValueError('Unexpected geometry')
        mapping[str(id)]=[sid,index]
    target=root/'public/images/client-items';target.mkdir(parents=True,exist_ok=True)
    sheets=[]
    for sid in sorted({v[0] for v in mapping.values()}):
        image=Image.open(source/'sheets'/f'{sid}.png').convert('RGBA')
        if image.size!=(512,512):raise ValueError('Unexpected sheet dimensions')
        path=target/f'{sid}.webp';image.save(path,'WEBP',lossless=True,exact=True,method=6)
        decoded=Image.open(path).convert('RGBA')
        if decoded.tobytes()!=image.tobytes():raise ValueError('Pixel loss during conversion')
        sheets.append({'sheet':sid,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    (root/'src/data/client-item-icons.json').write_text(json.dumps(mapping,separators=(',',':'))+'\n')
    output={'schemaVersion':1,'dataset':'client-item-icons','sourceRows':report['sourceRows'],'extractedIds':report['itemIds'],'publishedIds':len(mapping),'sheetCount':len(sheets),'iconSize':40,'columns':10,'sheetSize':512,'sourceMapSHA256':hashlib.sha256((source/'item-icon-map.json').read_bytes()).hexdigest(),'sheets':sheets,'excluded':excluded}
    (root/'public/data/client-item-icons.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({'publishedIds':len(mapping),'sheets':len(sheets),'bytes':sum(x['bytes'] for x in sheets),'excluded':len(excluded)}))
if __name__=='__main__':build(sys.argv[1],Path(__file__).resolve().parents[1])
