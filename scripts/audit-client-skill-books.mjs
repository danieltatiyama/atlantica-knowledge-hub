import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

// Deliberately conservative. Unknown prefixes/suffixes remain unparsed.
// Book labels are not skill grades, and these are NOT ownership relations.
const BOOK_PATTERN = /^(?:Magic Book|Book|Spellbook):\s*(.+?)\s+(?:\[(Lv\.\s*[1-9]\d*|I{1,3}|IV|V|VI{1,3}|IX|X)\]|\((I{1,3}|IV|V|VI{1,3}|IX|X)\))((?:\s*(?:\((?:No Trade|Event)\)|\[(?:No Trade|Event)\]))*)$/i;

export function parseBookName(name) {
  if (typeof name !== 'string') return null;
  const m = BOOK_PATTERN.exec(name);
  if (!m || m[0] !== name) return null;
  return { stem:m[1], bookRankLabel:m[2] ?? m[3], rawSuffix:m[4] };
}

export function buildBookCandidates(skills, rows) {
  const byName = new Map(), skillIds = new Set(), itemIds = new Set();
  for (const s of skills) {
    if (!Number.isSafeInteger(s.skillIndex) || s.skillIndex < 1 ||
        !Number.isSafeInteger(s.magicCode) || s.magicCode < 1 ||
        typeof s.englishName !== 'string' || !s.englishName.trim() ||
        skillIds.has(s.skillIndex)) throw new Error('Invalid or repeated SkillIndex');
    skillIds.add(s.skillIndex);
    if (!byName.has(s.englishName)) byName.set(s.englishName, []);
    byName.get(s.englishName).push({skillIndex:s.skillIndex, magicCode:s.magicCode});
  }
  const records=[], unparsed=[], stems=new Set();
  let totalBooks=0;
  for (const row of rows) {
    if (!Array.isArray(row) || typeof row[0] !== 'string' ||
        !/^[1-9]\d*$/.test(row[0]) || itemIds.has(row[0])) throw new Error('Invalid or repeated ItemID');
    itemIds.add(row[0]);
    if (row[2] !== 'Book') continue;
    totalBooks++;
    const parsed = row[6] === 'named' ? parseBookName(row[1]) : null;
    if (!parsed) {
      unparsed.push({itemId:row[0], itemName:row[1], identityStatus:row[6]});
      continue;
    }
    stems.add(parsed.stem);
    const candidates = (byName.get(parsed.stem) ?? []).slice().sort((a,b)=>a.skillIndex-b.skillIndex);
    records.push({itemId:row[0], itemName:row[1], ...parsed,
      status:candidates.length===1?'unique-name-candidate':candidates.length?'ambiguous-name-candidate':'unmatched-name',
      candidates});
  }
  return {schemaVersion:1, publicationStatus:'private-review-candidate',
    counts:{skillIdentities:skillIds.size,totalBooks,parsedBooks:records.length,
      distinctStems:stems.size,unique:records.filter(r=>r.status==='unique-name-candidate').length,
      ambiguous:records.filter(r=>r.status==='ambiguous-name-candidate').length,
      unmatched:records.filter(r=>r.status==='unmatched-name').length,unparsed:unparsed.length},
    records,unparsed,
    limitations:['Exact English name comparison only; no ownership or learning proof.',
      'Book rank labels are not Magic Grade or character evolution.',
      'Unknown formats and duplicate skill names need review; no fuzzy matching.']};
}

export function readCatalog(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
  if (manifest.snapshotId!==1 || manifest.totalIds!==23586 ||
      !Array.isArray(manifest.indexShards) || manifest.indexShards.length!==6 ||
      new Set(manifest.indexShards).size!==6) throw new Error('Unexpected item snapshot');
  const rows=[], sourceHashes={};
  for (const name of manifest.indexShards) {
    if (!/^index-0[0-5]\.json$/.test(name)) throw new Error('Unexpected shard name');
    const bytes=fs.readFileSync(path.join(directory,name));
    const shard=JSON.parse(bytes.toString('utf8'));
    if (shard.snapshotId!==manifest.snapshotId || !Array.isArray(shard.rows)) throw new Error('Invalid shard');
    rows.push(...shard.rows);
    sourceHashes[name]=createHash('sha256').update(bytes).digest('hex');
  }
  if (rows.length!==manifest.totalIds) throw new Error('Incomplete catalog');
  return {rows,sourceHashes,snapshotId:manifest.snapshotId};
}

if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  const [skillsFile, catalogDir, destination] = process.argv.slice(2);
  if (!skillsFile || !catalogDir || !destination) throw new Error('Usage: node scripts/audit-client-skill-books.mjs skills.json public/data/client-items private-report.json');
  const dest=path.resolve(destination);
  const pub=path.resolve('public');
  if (dest===pub || dest.startsWith(pub+path.sep)) throw new Error('Candidate report must not be placed in public/');
  const bytes=fs.readFileSync(skillsFile);
  const {rows,sourceHashes,snapshotId}=readCatalog(catalogDir);
  const report=buildBookCandidates(JSON.parse(bytes.toString('utf8')),rows);
  report.provenance={snapshotId,sourceHashes,skillsSha256:createHash('sha256').update(bytes).digest('hex')};
  fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  console.log(JSON.stringify(report.counts,null,2));
}
