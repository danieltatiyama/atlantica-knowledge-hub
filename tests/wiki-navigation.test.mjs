import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");

test("header differentiates equipment from all 23,586 client items in both locales",()=>{
  const header=read("src/components/Header.astro");
  assert.ok(header.includes('label: lang === "pt-br" ? "Equipamentos" : "Equipment"'));
  assert.ok(header.includes('label: lang === "pt-br" ? "Todos os itens" : "All Items"'));
  assert.ok(header.includes('const allItemsHref = lang === "en" ? "/items/database/"'));
  assert.ok(header.includes('active: pathname.startsWith(itemsHref) && !pathname.startsWith(allItemsHref)'));
  assert.ok(header.includes('active: pathname.startsWith(allItemsHref)'));
  assert.ok(!header.includes('label: lang === "pt-br" ? "Itens" : "Items"'));
  const home=read("src/components/HomePage.astro");
  assert.ok(home.includes('"Equipamentos e Boxes"'));
  assert.ok(home.includes('"Todos os itens"'));
  assert.ok(home.includes('"/items/database/"'));
  assert.ok(home.includes("23.586"));
});

test("one reusable navigation is installed once in BaseLayout and available in information pages",()=>{
  const base=read("src/layouts/BaseLayout.astro");
  assert.ok(base.includes('import FloatingWikiNavigator from "../components/FloatingWikiNavigator.astro"'));
  assert.equal((base.match(/<FloatingWikiNavigator /g)??[]).length,1);
  const pages=[
    "src/components/FullClientItemDatabasePage.astro",
    "src/components/MonsterDatabasePage.astro",
    "src/components/ItemDetailPage.astro",
    "src/components/ClientSourceEquipmentPage.astro",
    "src/components/GuideArticle.astro",
  ];
  for(const path of pages)assert.ok(read(path).includes("data-wiki-nav-root"),path);
});

test("floating index has left, right, hide and recover controls with persisted preference",()=>{
  const nav=read("src/components/FloatingWikiNavigator.astro");
  for(const id of ["wiki-float-nav","wiki-nav-reopen","wiki-nav-left",
    "wiki-nav-right","wiki-nav-hide","wiki-nav-overview","wiki-nav-detail"]){
    assert.ok(nav.includes('id="'+id+'"'),id);
  }
  assert.ok(nav.includes("atlantica.wiki-navigation.v1"));
  assert.ok(nav.includes("localStorage.setItem(key,JSON.stringify(pref))"));
  assert.ok(nav.includes('pref.visible=false;save();apply();reopen.focus()'));
  assert.ok(nav.includes('pref.visible=true;save();apply();hide.focus()'));
  assert.ok(nav.includes('if(event.key==="Escape")'));
  assert.ok(nav.includes('data-side="right"'));
  assert.ok(nav.includes('aria-pressed="true"'));
  assert.ok(nav.includes('aria-label={pt?"Esconder navegação":"Hide navigation"}'));
  assert.ok(nav.includes('aria-label={pt?"Mostrar navegação de seções":"Show section navigation"}'));
  assert.ok(nav.includes('(max-width: 1700px)'));
});

test("async item/monster detail transitions refresh the index without interfering with source data",()=>{
  const nav=read("src/components/FloatingWikiNavigator.astro");
  assert.ok(nav.includes('new MutationObserver(schedule)'));
  assert.ok(nav.includes('attributeFilter:["hidden","open","data-wiki-collapsed"]'));
  assert.ok(nav.includes('section,details[data-wiki-nav-native]'));
  assert.ok(nav.includes('section.closest("#db-detail,#creature-detail,#drop-item-result")'));
  assert.ok(nav.includes('history.replaceState(history.state'));
  assert.ok(nav.includes('entry.element.scrollIntoView'));
  assert.ok(nav.includes('compareDocumentPosition'));
  assert.ok(nav.includes("initialHash&&!hashRestored"));
  assert.ok(nav.includes("target.element.scrollIntoView"));
  assert.ok(nav.includes("Ignore malformed external hashes"));
  assert.ok(!nav.includes(".innerHTML"));
  const item=read("src/components/FullClientItemDatabasePage.astro");
  const monster=read("src/components/MonsterDatabasePage.astro");
  assert.ok(item.includes('section.dataset.wikiNavNative="true"'));
  assert.ok(monster.includes('audit.dataset.wikiNavNative="true"'));
  assert.ok(item.includes('pt?"Pesquisar itens":"Search items"'));
});

test("collapsible sections preserve children, forms and tables without changing original data",()=>{
  const nav=read("src/components/FloatingWikiNavigator.astro");
  assert.ok(nav.includes('main[data-wiki-nav-root] section[data-wiki-collapsed="true"] > :not(:first-child)'));
  assert.ok(nav.includes('btn.setAttribute("aria-expanded"'));
  assert.ok(nav.includes('aria-controls",content.id'));
  assert.ok(nav.includes('prepareGuideSections()'));
  assert.ok(nav.includes('groupHeadings(article,"H2")'));
  assert.ok(nav.includes('groupHeadings(content,"H3")'));
  assert.ok(nav.includes('content.hidden=!content.hidden'));
  assert.ok(nav.includes('labelFor(heading)'));
  assert.ok(nav.includes('dataset.wikiCollapsed=String(collapsed)'));
  assert.ok(nav.includes('section.firstElementChild?.contains(heading)'));
  assert.ok(nav.includes('if(entries.length<1)'),"Nav remains available after collapsing a parent section");
  assert.ok(nav.includes('aria-controls="wiki-float-nav"'));

  assert.ok(!nav.includes('.replaceChildren(body)'));
  const guide=read("src/components/GuideArticle.astro");
  assert.ok(!guide.includes('<aside class="article-sidebar">'),
    "Guide must not show two table-of-contents panels");
  assert.ok(guide.includes('grid-template-columns: minmax(0, 1fr)'));
  assert.ok(guide.includes('max-width:1000px'));

  assert.ok(guide.includes('querySelectorAll<HTMLTableElement>(".article-body table")'));
});
