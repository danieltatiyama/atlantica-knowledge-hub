import {readFileSync} from "node:fs";
import {nameAliasRows,wikiNameAlias} from "../src/data/wiki-name-aliases.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../public/data/"+p,import.meta.url),"utf8"));
const itemManifest=read("client-items/manifest.json");
const monsterManifest=read("client-monsters/manifest.json");
const items=itemManifest.indexShards.flatMap(f=>read("client-items/"+f).rows).filter(r=>r[6]==="named");
const monsters=monsterManifest.files.index.flatMap(f=>read("client-monsters/"+f).rows).filter(r=>r[4]==="named");
const market=read("client-npc-trade-prices/catalog.json").rows;
const matched=(kind,rows)=>rows.filter(r=>wikiNameAlias(kind,r[0],r[1],"pt-br")).length;
const categories=Object.create(null);
for(const row of items){
 const key=String(row[2]??"unknown");
 const c=categories[key]??={named:0,translated:0};
 c.named++;
 if(wikiNameAlias("item",row[0],row[1],"pt-br"))c.translated++;
}
const summary={snapshotId:itemManifest.snapshotId,provenance:"Unofficial AI-assisted Wiki aliases; no regional client verification",items:{named:items.length,translated:matched("item",items)},monsters:{named:monsters.length,translated:matched("monster",monsters)},market:{total:market.length,translated:matched("item",market)},aliasIdentities:nameAliasRows.length,translations:nameAliasRows.length*7,categories};
console.log(JSON.stringify(summary,null,2));
