import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {sharedText} from "../src/i18n/shared-ui.mjs";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {
 MIN_LIGHTBOX_ZOOM,MAX_LIGHTBOX_ZOOM,clampLightboxZoom,
 cycleLightboxIndex,fitLightboxImage,
} from "../src/lib/article-image-lightbox.mjs";
const read=path=>readFileSync(path,"utf8");

test("small portrait screenshots are enlarged to the available viewer without distortion",()=>{
 const result=fitLightboxImage(110,320,900,680,1);
 assert.deepEqual(result,{width:234,height:680});
 const zoomed=fitLightboxImage(110,320,900,680,2);
 assert.deepEqual(zoomed,{width:468,height:1360});
 assert.ok(zoomed.width/result.width===2);
});

test("wide images fit their width and zoom can exceed the viewport for scroll/pan",()=>{
 const full=fitLightboxImage(3000,1000,900,620);
 assert.deepEqual(full,{width:900,height:300});
 assert.deepEqual(fitLightboxImage(3000,1000,900,620,3),{width:2700,height:900});
 assert.equal(fitLightboxImage(0,1000,900,620),null);
 assert.equal(fitLightboxImage(3000,1000,0,620),null);
});

test("zoom clamps nonfinite inputs and indexes wrap only when an image exists",()=>{
 assert.equal(MIN_LIGHTBOX_ZOOM,1);
 assert.equal(MAX_LIGHTBOX_ZOOM,5);
 assert.equal(clampLightboxZoom(.2),1);
 assert.equal(clampLightboxZoom(8),5);
 assert.equal(clampLightboxZoom(NaN),1);
 assert.equal(clampLightboxZoom(Infinity),1);
 assert.equal(cycleLightboxIndex(0,-1,16),15);
 assert.equal(cycleLightboxIndex(15,1,16),0);
 assert.equal(cycleLightboxIndex(0,1,1),0);
 assert.equal(cycleLightboxIndex(0,1,0),-1);
});

test("lightbox mounts exactly once globally and is scoped to article content",()=>{
 const layout=read("src/layouts/BaseLayout.astro");
 const viewer=read("src/components/ArticleImageLightbox.astro");
 assert.equal((layout.match(/<ArticleImageLightbox lang=/g)||[]).length,1);
 assert.ok(layout.includes('import ArticleImageLightbox from "../components/ArticleImageLightbox.astro"'));
 assert.ok(viewer.includes('".article-body img"'));
 assert.ok(viewer.includes('source.closest(".article-body")'));
 assert.ok(viewer.includes('!img.closest("a,button,[data-wiki-lightbox-ignore]")'));
 assert.ok(viewer.includes("img.dataset.wikiLightboxReady"));
 assert.ok(viewer.includes("img.tabIndex=0"));
 assert.ok(viewer.includes('img.setAttribute("role","button")'));
 assert.ok(viewer.includes('event.key==="Enter"||event.key===" "'));
 assert.ok(viewer.includes("lastFocus?.focus("));
 assert.ok(viewer.includes('document.body.style.overflow=previousOverflow'));
 const guide=read("src/components/GuideArticle.astro");
 const editorial=read("src/components/EditorialArticle.astro");
 assert.ok(guide.includes('class="article-body"'));
 assert.ok(editorial.includes('class="article-body"'));
 assert.ok(!viewer.includes("document.querySelectorAll<HTMLImageElement>(\"img\")"));
});

test("accessible multilingual dialog provides zoom, keyboard and pointer navigation",()=>{
 const viewer=read("src/components/ArticleImageLightbox.astro");
 for(const marker of [
  'role="dialog"','aria-modal="true"','aria-labelledby="wiki-lightbox-title"',
  'id="wiki-lightbox-prev"','id="wiki-lightbox-next"','id="wiki-lightbox-close"',
  'id="wiki-lightbox-plus"','id="wiki-lightbox-minus"','id="wiki-lightbox-fit"',
  'id="wiki-lightbox-stage"','id="wiki-lightbox-caption"',
  'event.key==="Escape"','event.key==="ArrowLeft"','event.key==="ArrowRight"',
  'event.key==="+"','event.key==="-"','event.key==="0"','event.key!=="Tab"',
  'dialog.hidden=false','dialog.hidden=true','closeButton.focus(',
  'window.addEventListener("resize"','event.preventDefault()',
  '{passive:false}','aria-live="polite"',
  'sharedText(lang,"Expand image")','sharedText(lang,"Zoom in")',
  'sharedText(lang,"Close image viewer")',
  'Math.max(stage.clientWidth,size.width+16)',
  'Math.max(stage.clientHeight,size.height+16)',
  'overscroll-behavior:contain',
  '@media(max-width:660px)',
 ]){
  assert.ok(viewer.includes(marker),"Missing lightbox control: "+marker);
 }
 for(const [key,pt] of [["Expand image","Ampliar imagem"],["Zoom in","Aumentar zoom"],["Close image viewer","Fechar visualizador de imagens"]]){
  assert.equal(sharedText("pt-br",key),pt);
  for(const lang of LOCALE_IDS)assert.ok(sharedText(lang,key).trim(),lang+" "+key);
 }
 assert.ok(viewer.includes('if(dialog)'),"No-page compatibility");
 assert.ok(viewer.includes('dialog.querySelectorAll<HTMLButtonElement>("button:not([disabled])")'),
  "Focus trap excludes disabled controls");
});

test("VIP System EN/PT-BR images remain the original shared URLs",()=>{
 const en=read("src/content/guides/en/vip-system.md");
 const pt=read("src/content/guides/pt-br/vip-system.md");
 const refs=text=>[...text.matchAll(/\/images\/guides\/vip-system\/(?:image-\d+|vip-menu)\.png/g)]
  .map(match=>match[0]);
 assert.equal(refs(pt).length,16);
 assert.deepEqual(refs(pt),refs(en));
});
