import test from "node:test";
import assert from "node:assert/strict";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {glossaryRows,wikiGlossaryTerm} from "../src/i18n/wiki-name-glossary.mjs";
test("editorial glossary contains complete unique terms for eight locales",()=>{
 assert.equal(new Set(glossaryRows.map(r=>r[0])).size,glossaryRows.length);
 for(const row of glossaryRows){assert.equal(row.length,8);for(const [i,lang] of LOCALE_IDS.entries()){assert.ok(row[i].trim());assert.equal(wikiGlossaryTerm(lang,row[0]),row[i]);}}
 assert.equal(wikiGlossaryTerm("ko","Sword"),"검");
 assert.equal(wikiGlossaryTerm("pt-br","Magic Defense"),"Defesa mágica");
 assert.equal(wikiGlossaryTerm("ja","Unknown proper name"),"Unknown proper name");
});
