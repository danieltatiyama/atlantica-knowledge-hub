/**
 * A read-only search index built from the existing client source indexes.
 * It never changes source data and does not claim in-game availability.
 */
import {catalogPath} from "../i18n/locales.mjs";
import {wikiNameAlias} from "./wiki-name-aliases.mjs";
export function isWikiSearchQuery(value){const q=String(value??"").trim().normalize("NFC");return q.length>=2||/^[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(q);}
export function foldSearch(value) {
  return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLocaleLowerCase("en").replace(/\s+/g," ").trim();
}
const validId=value=>/^[1-9]\d{0,12}$/.test(String(value));
export function buildWikiSearchRecords(itemShards,monsterShards,guides=[],lang="en"){
  
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
        nameAlias:wikiNameAlias("item",row[0],row[1],lang),detail:String(row[2]??""),href:catalogPath(lang,"/items/database/")+"?id="+encodeURIComponent(row[0])});
    }
  }
  for(const shard of monsterShards){
    if(shard?.schemaVersion!=="1.0"||shard.snapshotId!==1||!Array.isArray(shard.rows))
      throw Error("Unexpected creature search source");
    for(const row of shard.rows){
      if(!validId(row?.[0])||seenMonsters.has(row[0]))throw Error("Duplicate/invalid CharID");
      seenMonsters.add(row[0]);
      records.push({kind:"monster",id:row[0],title:row[1]||("CharID "+row[0]),
        nameAlias:wikiNameAlias("monster",row[0],row[1],lang),detail:"Level "+String(row[2]??"—"),href:catalogPath(lang,"/monsters/profile/")+"?id="+encodeURIComponent(row[0])});
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
export function buildMercenarySearchRecords(index,lang="en"){
  if(index?.schemaVersion!==1||!Array.isArray(index.rows)||index.scope!=="expanded-reference-candidate")throw Error("Unexpected mercenary reference index");
  const seen=new Set();return index.rows.map(row=>{
    const [kind,id,title,detail]=row;
    if(!["mercenary","skill"].includes(kind)||typeof title!=="string"||!title.trim()||typeof detail!=="string"||
      (kind==="skill"?!validId(id):!/^[A-Za-z0-9_]+$/.test(id))||seen.has(kind+":"+id))throw Error("Invalid reference search identity");
    seen.add(kind+":"+id);
    return {kind,id,title,detail,href:catalogPath(lang,kind==="mercenary"?"/mercenaries/database/":"/mercenaries/skills/")+"?"+(kind==="mercenary"?"char":"skill")+"="+encodeURIComponent(id)};
  });
}
export function searchWikiRecords(records,query,{kind="all",limit=30}={}){
  const needle=foldSearch(query);
  if(!isWikiSearchQuery(query))return [];
  const single=[...String(query).trim().normalize("NFC")].length===1;
  const words=needle.split(" ").filter(Boolean);
  const matches=[];
  for(const record of records){
    if(kind!=="all"&&record.kind!==kind)continue;
    const title=foldSearch(record.title),id=foldSearch(record.id);
    const detail=foldSearch(record.detail),alias=foldSearch(record.nameAlias);
    let score=-1;
    if(single){if(alias===needle)score=95;else if(title===needle)score=100;}
    else if(id===needle)score=110;
    else if(title===needle)score=100;
    else if(id.startsWith(needle))score=85;
    else if(title.startsWith(needle))score=82;
    else if(title.includes(needle))score=68;
    else if(words.every(word=>title.includes(word)))score=55;
    else if(words.every(word=>(title+" "+detail).includes(word)))score=30;
    if(!single&&alias){
      const aliasScore=alias===needle?95:alias.startsWith(needle)?78:alias.includes(needle)?64:words.every(word=>alias.includes(word))?51:-1;
      score=Math.max(score,aliasScore);
    }
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
