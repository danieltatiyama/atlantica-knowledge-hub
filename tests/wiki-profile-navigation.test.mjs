import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("full item catalog offers section navigation and crosslinked acquisition",()=>{
  const s=read("src/components/FullClientItemDatabasePage.astro");
  for(const id of ["wiki-item-about","wiki-item-crafting","wiki-item-used-by",
    "wiki-item-monsters","wiki-item-technical"])assert.ok(s.includes(id),id);
  assert.ok(s.includes('jump.setAttribute("aria-label"'));
  assert.ok(s.includes('details.prepend(jump)'));
  assert.ok(s.includes('codex.href=localePrefix(lang)+"/monsters/?item="+encodeURIComponent(id)'));
  assert.ok(s.includes('link.href="#"+target'));
  assert.ok(s.includes('d.open=true'));
  assert.ok(!s.includes("details.innerHTML"));
});
test("bestiary prioritizes player-facing drops but keeps technical evidence reachable",()=>{
  const s=read("src/components/MonsterDatabasePage.astro");
  assert.ok(s.includes("creature-profile-actions"));
  assert.ok(s.includes('dropsLink.href="#creature-drop-"+id'));
  assert.ok(s.includes('directSection.id="creature-drop-"+id'));
  assert.ok(s.includes('originalSources.open=true'));
  assert.ok(s.indexOf("body.append(quickActions)")<s.indexOf("body.append(directSection)"));
  assert.ok(s.includes("resolveClientCreatureDrops(entity,rawLoot,groupData)"));
});
