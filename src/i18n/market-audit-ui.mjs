import {LOCALE_IDS} from "./locales.mjs";
import {toolText,toolRows} from "./tools-ui.mjs";
import {marketCatalogRows} from "./market-catalog-ui.mjs";
import {marketResearchRows} from "./market-research-ui.mjs";
import {auditRows} from "./audit-ui.mjs";
const extra=[
  [
    "Price (Gold)",
    "Prix (Gold)",
    "Preis (Gold)",
    "Precio (Gold)",
    "가격 (Gold)",
    "价格（Gold）",
    "価格（Gold）"
  ],
  [
    "Found {count} of 421 items",
    "{count} objets sur 421",
    "{count} von 421 Gegenständen gefunden",
    "{count} de 421 objetos encontrados",
    "421개 중 {count}개 검색됨",
    "找到 {count} / 421 个物品",
    "421件中{count}件が見つかりました"
  ],
  [
    "Fixed: same price",
    "Fixe : même prix",
    "Fest: gleicher Preis",
    "Fijo: mismo precio",
    "고정 판매: 동일 가격",
    "固定：相同价格",
    "固定販売：同額"
  ],
  [
    "Fixed: different price",
    "Fixe : autre prix",
    "Fest: anderer Preis",
    "Fijo: distinto precio",
    "고정 판매: 다른 가격",
    "固定：不同价格",
    "固定販売：異なる価格"
  ],
  [
    "Not found",
    "Introuvable",
    "Nicht gefunden",
    "No encontrado",
    "찾지 못함",
    "未找到",
    "見つからない"
  ],
  [
    "{local} / 128 with local observations · {reported} player-reported matches",
    "{local} / 128 avec observation locale · {reported} concordances signalées",
    "{local} / 128 mit lokaler Beobachtung · {reported} Spielerberichte",
    "{local} / 128 con observación local · {reported} coincidencias reportadas",
    "128개 중 {local}개 로컬 기록 · 플레이어 보고 일치 {reported}개",
    "{local} / 128 有本地观察 · {reported} 项玩家报告匹配",
    "128件中{local}件にローカル観察・プレイヤー報告一致{reported}件"
  ]
];
export const marketAuditRows=[...marketCatalogRows,...marketResearchRows,...auditRows,...extra];
const map=new Map(marketAuditRows.map(row=>[row[0],row]));
export const hasMarketAuditMessage=key=>map.has(key)||toolRows.some(row=>row[0]===key);
export function marketAuditText(lang,key,pt=key,values={}){const i=LOCALE_IDS.indexOf(lang);const text=i>1&&map.has(key)?map.get(key)[i-1]:toolText(lang,key,pt);return text.replace(/\{([a-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);}
