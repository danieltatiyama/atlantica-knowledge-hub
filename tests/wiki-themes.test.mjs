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
  assert.ok(header.includes('aria-label={lang === "pt-br"'));
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
