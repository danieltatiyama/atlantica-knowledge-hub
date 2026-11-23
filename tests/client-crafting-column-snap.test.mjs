import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
test("tree scroll container snaps horizontally to the column headers",()=>{
 assert.ok(ui.includes("scroll-snap-type:x proximity;"));
 assert.ok(ui.includes("scroll-padding-inline-start:var(--craft-frozen-width,365px);"));
 assert.ok(ui.includes(".craft-tree-table thead th:not(:first-child){"));
 assert.ok(ui.includes("scroll-snap-align:start;"));
 assert.ok(ui.includes("scroll-snap-stop:normal;"));
 assert.ok(ui.includes("overscroll-behavior-inline:contain;"));
});
test("item name remains frozen when columns scroll on desktop",()=>{
 assert.match(ui,/\.craft-tree-table thead th:first-child\{[\s\S]*?position:sticky;left:0;z-index:5;/);
 assert.match(ui,/\.craft-tree-table tbody th:first-child\{[\s\S]*?position:sticky;left:0;z-index:3;/);
 assert.ok(ui.includes("background:color-mix(in srgb,var(--craft-level) 8%,var(--color-background));"));
 assert.ok(ui.includes('const frozenHeader=treeContainer.querySelector<HTMLElement>('));
 assert.ok(ui.includes('new ResizeObserver(entries=>'));
 assert.ok(ui.includes('treeContainer.style.setProperty("--craft-frozen-width",'));
});
test("small screens retain snapping without obstructive sticky column",()=>{
 assert.ok(ui.includes("@media(max-width:860px){"));
 assert.ok(ui.includes(".craft-tree{scroll-padding-inline-start:0px;}"));
 assert.ok(ui.includes(".craft-tree-table :is(thead,tbody) th:first-child{"));
 assert.ok(ui.includes("position:static;box-shadow:none;"));
});
test("snap behavior is only applied to the crafting tree, not other tables or content",()=>{
 const snap=ui.match(/scroll-snap-type:x proximity;/g)||[];
 assert.equal(snap.length,1);
 assert.ok(ui.includes('id="craft-tree" class="craft-tree"'));
 assert.ok(ui.includes('class="craft-data-table craft-schedule-table"'));
 assert.ok(ui.includes('class="craft-data-table craft-shopping-table"'));
 assert.ok(ui.includes('pt?"Tabela de fabricação, com rolagem horizontal e encaixe por coluna"'));
});
