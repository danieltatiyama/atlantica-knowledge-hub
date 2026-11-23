/**
 * A read-only search index built from the existing client source indexes.
 * It never changes source data and does not claim in-game availability.
 */
export function foldSearch(value) {
  return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLocaleLowerCase("en").replace(/\s+/g," ").trim();
}
const validId=value=>/^[1-9]\d{0,12}$/.test(String(value));
export function buildWikiSearchRecords(itemShards,monsterShards,guides=[],lang="en"){
  const prefix=lang==="pt-br"?"/pt-br":"";
  const records=[];
  const seenItems=new Set(),seenMonsters=new Set();
  for(const shard of itemShards){
    if(shard?.schemaVersion!=="1.0"||shard.snapshotId!==1||!Array.isArray(shard.rows))
      throw Error("Unexpected item search source");
    for(const row of shard.rows){
      if(!validId(row?.[0])||seenItems.has(row[0]))throw Error("Duplicate/invalid ItemID");
      seenItems.add(row[0]);
      if(row[6]!=="named"||!row[1])continue;
      records.push({kind:"item",id:row[0],title:row[1],
        detail:String(row[2]??""),href:prefix+"/items/database/?id="+encodeURIComponent(row[0])});
    }
  }
  for(const shard of monsterShards){
    if(shard?.schemaVersion!=="1.0"||shard.snapshotId!==1||!Array.isArray(shard.rows))
      throw Error("Unexpected creature search source");
    for(const row of shard.rows){
      if(!validId(row?.[0])||seenMonsters.has(row[0]))throw Error("Duplicate/invalid CharID");
      seenMonsters.add(row[0]);
      if(!row[1])continue;
      records.push({kind:"monster",id:row[0],title:row[1],
        detail:"Level "+String(row[2]??"—"),href:prefix+"/monsters/?id="+encodeURIComponent(row[0])});
    }
  }
  for(const row of guides){
    if(typeof row?.title!=="string"||typeof row?.href!=="string"||
       !row.href.startsWith("/")||row.href.startsWith("//"))continue;
    records.push({kind:"guide",id:"",title:row.title,
      detail:String(row.description??""),href:row.href});
  }
  return records;
}
export function searchWikiRecords(records,query,{kind="all",limit=30}={}){
  const needle=foldSearch(query);
  if(needle.length<2)return [];
  const words=needle.split(" ").filter(Boolean);
  const matches=[];
  for(const record of records){
    if(kind!=="all"&&record.kind!==kind)continue;
    const title=foldSearch(record.title),id=String(record.id??"");
    const detail=foldSearch(record.detail);
    let score=-1;
    if(id===needle)score=110;
    else if(title===needle)score=100;
    else if(title.startsWith(needle))score=82;
    else if(title.includes(needle))score=68;
    else if(words.every(word=>title.includes(word)))score=55;
    else if(words.every(word=>(title+" "+detail).includes(word)))score=30;
    if(score<0)continue;
    // Stable ties and exact names make the result ordering predictable.
    matches.push({record,score});
  }
  matches.sort((a,b)=>b.score-a.score||
    a.record.title.localeCompare(b.record.title,"en")||
    a.record.kind.localeCompare(b.record.kind)||
    String(a.record.id).localeCompare(String(b.record.id)));
  return matches.slice(0,Math.max(1,Math.min(100,Math.trunc(limit)||30)))
    .map(entry=>entry.record);
}
