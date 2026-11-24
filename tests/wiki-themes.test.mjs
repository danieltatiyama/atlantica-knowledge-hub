import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(path,"utf8");
const layout = read("src/layouts/BaseLayout.astro");
const header = read("src/components/Header.astro");
const themes = read("src/styles/themes.css");
const classic = read("src/styles/global.css");
const ids = ["atlantica","dark","light","parchment","midnight","contrast"];

test("all six bilingual themes have selector options and CSS palettes",()=>{
  for(const id of ids) {
    assert.match(header,new RegExp('value="'+id+'"'));
    assert.ok(themes.includes(':root[data-theme="'+id+'"]'),id);
  }
  for(const translation of ["Tema","Theme","Escuro","Dark","Claro","Light",
    "Pergaminho","Parchment","Azul noturno","Midnight Blue",
    "Alto contraste","High Contrast"]) {
    assert.ok(header.includes(translation),translation);
  }
  assert.ok(header.includes('for="site-theme"'));
  assert.ok(header.includes('aria-label={chromeText(lang,"Select visual theme",'));
  assert.ok(header.includes('aria-label={chromeText(lang,"Appearance and language preferences",'));
  assert.ok(header.includes('themeSelect?.')||header.includes('themeSelect.addEventListener("change"'));
});

test("head restores the theme before first paint without overriding Atlantica as default",()=>{
  assert.ok(layout.includes('import "../styles/global.css";'));
  assert.ok(layout.includes('import "../styles/themes.css";'));
  const head=layout.slice(layout.indexOf("<head>"),layout.indexOf("</head>"));
  const inline=head.indexOf("<script is:inline>");
  assert.ok(inline>=0,"Head needs an inline bootstrap");
  assert.ok(head.includes('let theme = "atlantica";'));
  assert.ok(head.includes('localStorage.getItem("atlantica.theme")'));
  assert.ok(head.includes("allowed.has(saved)"));
  assert.ok(head.includes("document.documentElement.dataset.theme = theme"));
  assert.ok(head.includes("</script>",inline));
  assert.ok(!classic.includes('data-theme="light"'),
    "Default Atlantica tokens must remain untouched");
});

test("user selection persists; blocked storage does not prevent the switch",()=>{
  assert.ok(header.includes('localStorage.setItem("atlantica.theme", selectedTheme)'));
  assert.ok(header.includes("document.documentElement.dataset.theme = selectedTheme"));
  assert.ok(header.includes('window.addEventListener("storage"'));
  assert.ok(header.includes("themeSelect.value = next"));
  assert.ok(header.includes('if (!themes.has(selectedTheme)) return;'));
});

test("light and parchment use light color-scheme, dark choices use dark",()=>{
  const section=(id)=>{
    const start=themes.indexOf(':root[data-theme="'+id+'"]');
    const end=themes.indexOf("\n}",start);
    return themes.slice(start,end);
  };
  for(const id of ["light","parchment"])
    assert.ok(section(id).includes("color-scheme: light"),id);
  for(const id of ["atlantica","dark","midnight","contrast"])
    assert.ok(section(id).includes("color-scheme: dark"),id);
  assert.ok(themes.includes('html[data-theme]:not([data-theme="atlantica"])'),
    "Non-classic overrides must not change the default appearance");
});

test("theme changes cover item, monster, codex, guide and floating navigation",()=>{
  for(const selector of ["#creature-db","#full-client-db",
    ".monster-item-sources",".ao-drop-finder",
    "#wiki-float-nav",".home-main",".article-body th",
    "main[data-wiki-nav-root]"]) {
    assert.ok(themes.includes(selector),selector);
  }
  assert.ok(themes.includes(".wiki-table-scroll tbody tr:nth-child(even)"));
  assert.ok(themes.includes("var(--theme-hover)"));
  assert.ok(themes.includes("var(--color-text-muted)"));
});

test("theme feature never modifies source data or client drop calculations",()=>{
  assert.ok(!header.includes("client-monster-discovery"));
  assert.ok(!layout.includes("RawRate"));
  assert.ok(!themes.includes("GroupBands"));
});

test("header keeps appearance and language in one aligned control group",()=>{
  const controls=header.slice(header.indexOf('class="header-controls"'),header.indexOf('</header>'));
  assert.ok(controls.includes('role="group"'));
  assert.ok(controls.includes('for="site-theme"'));
  assert.ok(controls.includes('for="site-language"'));
  assert.ok(controls.includes('class="theme-label header-control-label"'));
  assert.ok(controls.includes('class="language-label header-control-label"'));
  assert.ok(controls.includes('class="theme-select header-control-select"'));
  assert.ok(controls.includes('class="language-select header-control-select"'));
  assert.ok(controls.includes('"Idioma" : "Language"'));
  assert.ok(controls.includes("LOCALE_IDS.map(locale"));
  assert.ok(controls.includes("data-target={getLanguageTarget(locale)}"));
  assert.ok(header.includes("languageSelect.selectedOptions[0]?.dataset.target"));
  assert.ok(header.includes('display: grid;'));
  assert.ok(header.includes('grid-template-columns: minmax(180px, 1fr) auto minmax(316px, 1fr)'));
  assert.ok(header.includes('height: 40px'));
  assert.ok(header.includes('@media (max-width: 1560px)'));
  assert.ok(header.includes('@media (max-width: 700px)'));
  assert.ok(header.includes('@media (max-width: 340px)'));
  // The existing locale and theme event handlers must remain functional.
  assert.ok(header.includes('languageSelect?.addEventListener("change"'));
  assert.ok(header.includes('themeSelect.addEventListener("change"'));
});

test("equipment table headings and Legendary links follow the selected palette",()=>{
  const catalog=read("src/components/ItemCatalogPage.astro");
  assert.ok(catalog.includes('<main class="container" id="equipment-catalog">'));
  const themed=themes.slice(themes.indexOf("/* Equipment catalog:"));
  assert.ok(themed.includes('#equipment-catalog .catalog th'));
  assert.ok(themed.includes('background:var(--theme-deep)'));
  assert.ok(themed.includes('color:var(--color-accent)'));
  assert.ok(themed.includes('#equipment-catalog .catalog tbody tr:nth-child(even) td'));
  assert.ok(themed.includes('#equipment-catalog .legendary-link'));
  assert.ok(themed.includes('color:var(--theme-legendary)'));
  assert.ok(themed.includes('html[data-theme]:not([data-theme="atlantica"])'));
  for(const name of ["light","parchment","dark","midnight","contrast"])
    assert.ok(themed.includes(':root[data-theme="'+name+'"]'),name);
});

test("light-theme accent headings have accessible contrast on themed table backgrounds",()=>{
  function palette(name){
    const start=themes.indexOf(':root[data-theme="'+name+'"] {');
    const end=themes.indexOf(String.fromCharCode(10)+"}",start);
    assert.ok(start>=0&&end>start,name);
    return themes.slice(start,end);
  }
  function value(text,name){
    const match=text.match(new RegExp('--'+name+':(#[0-9a-fA-F]{6})'));
    assert.ok(match,name);
    return match[1];
  }
  const luminance=hex=>{
    const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
      .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
    return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  };
  const contrast=(a,b)=>{
    const x=luminance(a),y=luminance(b);
    return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
  };
  for(const name of ["light","parchment"]){
    const tokens=palette(name);
    assert.ok(contrast(value(tokens,"color-accent"),value(tokens,"theme-deep"))>=4.5,
      name+" table header text must reach WCAG AA contrast");
  }
});
