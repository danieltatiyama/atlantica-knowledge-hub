/**
 * Public evidence gate for extended item tooltips and socketed enhancements.
 *
 * An item ID is OPTIONAL only for an explicitly named research article,
 * never invented to fit a game-client name. Public catalog IDs, when present,
 * must match the reviewed 551-entry registry exactly.
 *
 * The observed equipped tooltip is a different source from:
 * - historical +0 stats
 * - the separately estimated bare L weapon
 * - each equipped Star Stone's modifier
 */
import { projectClassicStat } from "./equipment-enchant-projection.mjs";

const obj = x => x !== null && typeof x === "object" && !Array.isArray(x);
const exact = (value, fields) => obj(value) &&
  Object.keys(value).length === fields.length &&
  Object.keys(value).every(k => fields.includes(k));
const nat = (v, max=1e12) => Number.isSafeInteger(v) && v>=0 && v<=max;
const pos = (v, max=1e12) => nat(v,max) && v>0;
const safe = (v, max=200) =>
  typeof v === "string" && v.length>0 && v.length<=max &&
  v===v.trim() && !/[<>{}\r\n\\]/.test(v) &&
  !/^(?:\/|[A-Za-z]:)/.test(v) && !v.includes("/mnt/data/");
const httpsSource = (ref) => {
  if (!exact(ref, ["kind","label","url"]) ||
      ref.kind!=="historical-community" || !safe(ref.label,220)) return false;
  try {
    const url=new URL(ref.url);
    return url.protocol==="https:" && !url.username && !url.password &&
      ["atlantica.fandom.com","atlantica-online.wikidot.com"].includes(url.hostname);
  } catch {return false;}
};
const tooltipSource = ref => exact(ref,["kind","label"]) &&
  ref.kind==="user-supplied-ingame-screenshot" && safe(ref.label,220);
const statsKeys=[
  "attackMin","attackMax","strength","intelligence","vitality",
  "critical","multiHitRate","actionPowerMod","magicSkillLevelBonus"
];
const baselineKeys=["attackMin","attackMax","strength","intelligence","vitality"];

// Named research pages without a verified numeric item ID are not an open
// namespace: every such identity requires explicit editorial registration.
const REVIEWED_NAME_ONLY_IDENTITIES=Object.freeze({
  "dell-artes-ambition":"Dell'arte's Ambition",
});

function attackComposition(item) {
  const base=item.baseHistorical;
  const mod=item.socketedModifiers;
  const lower=projectClassicStat(base.attackMin,"L");
  const upper=projectClassicStat(base.attackMax,"L");
  const loStone=Number(BigInt(lower)*BigInt(mod.perStone.attackEnhancePercent)/100n);
  const hiStone=Number(BigInt(upper)*BigInt(mod.perStone.attackEnhancePercent)/100n);
  return {
    bareL:{attackMin:lower,attackMax:upper},
    perStoneAttack:{min:loStone,max:hiStone},
    socketAttackTotal:{min:mod.count*loStone,max:mod.count*hiStone},
    expectedEquipped:{
      attackMin:lower+mod.count*loStone,
      attackMax:upper+mod.count*hiStone
    },
  };
}

export function validateExtendedEquipmentFacts(payload, nameRegistry) {
  const errors=[];
  const fail=msg=>errors.push(msg); // no untrusted names or payload in diagnostics
  if (!exact(payload,["schemaVersion","dataset","records"]) ||
      payload.schemaVersion!=="1.0" || payload.dataset!=="extended-equipment-facts" ||
      !Array.isArray(payload.records) || payload.records.length>1000 || !obj(nameRegistry)){
    return {ok:false,errors:["Invalid extended equipment facts dataset"],records:[]};
  }
  const seenSlugs=new Set(),seenIds=new Set();
  for(const [i,item] of payload.records.entries()) {
    const label="item "+(i+1);
    if (!exact(item,["slug","itemId","nameEn","typeEn","grade","minimumLevel",
      "eligibleClasses","observedTooltip","baseHistorical","socketedModifiers",
      "specialEffects","craftingStatus","evidence"])) {
      fail(label+" has unexpected keys");continue;
    }
    if (!safe(item.nameEn) || !safe(item.typeEn,60) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
        seenSlugs.has(item.slug) || item.grade!=="L" ||
        !pos(item.minimumLevel,9999)) {
      fail(label+" has invalid identity or grade");continue;
    }
    seenSlugs.add(item.slug);
    if(item.itemId===null && REVIEWED_NAME_ONLY_IDENTITIES[item.slug]!==item.nameEn){
      fail(label+" does not match a manually reviewed named research identity");
    }
    if(item.itemId!==null) {
      if (typeof item.itemId!=="string" || !/^[1-9][0-9]*$/.test(item.itemId) ||
          nameRegistry[item.itemId]!==item.nameEn || seenIds.has(item.itemId)) {
        fail(label+" has an unreviewed or repeated numeric item identity");
      } else seenIds.add(item.itemId);
    }
    if(!Array.isArray(item.eligibleClasses) || item.eligibleClasses.length>100 ||
       !item.eligibleClasses.every(c=>safe(c,80))) {
      fail(label+" has invalid class restrictions");
    }
    const observed=item.observedTooltip;
    if(!exact(observed,statsKeys) || !Object.entries(observed).every(([k,v]) =>
       nat(v) && (k!=="attackMin" && k!=="attackMax" || pos(v))) ||
       observed.attackMin>observed.attackMax) {
      fail(label+" has invalid screenshot observations");
    }
    const base=item.baseHistorical;
    if(!obj(base) || Object.keys(base).length<2 ||
       Object.keys(base).some(k=>!baselineKeys.includes(k) || !nat(base[k])) ||
       !pos(base.attackMin) || !pos(base.attackMax) ||
       base.attackMin>base.attackMax) {
      fail(label+" has invalid historical +0 baseline");continue;
    }
    const sockets=item.socketedModifiers;
    if(!exact(sockets,["itemName","count","perStone"]) ||
       !safe(sockets.itemName) || !pos(sockets.count,20) ||
       !exact(sockets.perStone,["criticalRate","multiHitRate","action",
         "attackEnhancePercent","displayedAttackBonusMin","displayedAttackBonusMax"]) ||
       !Object.values(sockets.perStone).every(x=>nat(x,1000000)) ||
       !pos(sockets.perStone.attackEnhancePercent,100)) {
      fail(label+" has invalid Star Stone modifiers");continue;
    }
    // Soundly distinguish screenshot totals from an (unobserved)
    // modelled L base. No stat values attributed to the wrong source.
    try {
      const p=attackComposition(item);
      if (p.perStoneAttack.min!==sockets.perStone.displayedAttackBonusMin ||
          p.perStoneAttack.max!==sockets.perStone.displayedAttackBonusMax ||
          p.expectedEquipped.attackMin!==observed.attackMin ||
          p.expectedEquipped.attackMax!==observed.attackMax ||
          sockets.count*sockets.perStone.criticalRate!==observed.critical ||
          sockets.count*sockets.perStone.multiHitRate!==observed.multiHitRate ||
          sockets.count*sockets.perStone.action!==observed.actionPowerMod) {
        fail(label+" has equipped attack or socket stat inconsistencies");
      }
    } catch {
      fail(label+" cannot reconcile the equipped attack formula");
    }
    if(!Array.isArray(item.specialEffects) || item.specialEffects.length>16 ||
       !item.specialEffects.every(e=>
         exact(e,["kind","valuePercent","descriptionEn","descriptionPt"]) &&
         ["legendary-debuff","class-conditional-critical"].includes(e.kind) &&
         nat(e.valuePercent,1000) &&
         safe(e.descriptionEn,260) && safe(e.descriptionPt,260))) {
      // Conditional critical effect includes a required class key.
      const proper=item.specialEffects?.every(e=>(
        e?.kind==="class-conditional-critical" &&
        exact(e,["kind","className","valuePercent","descriptionEn","descriptionPt"]) &&
        safe(e.className,80) && nat(e.valuePercent,1000) &&
        safe(e.descriptionEn,260) && safe(e.descriptionPt,260)
      ) || (
        e?.kind==="legendary-debuff" &&
        exact(e,["kind","valuePercent","descriptionEn","descriptionPt"]) &&
        nat(e.valuePercent,1000) &&
        safe(e.descriptionEn,260) && safe(e.descriptionPt,260)
      ));
      if (!proper)fail(label+" has unsupported special effects");
    }
    if(item.craftingStatus!=="historical-not-craftable") {
      fail(label+" has an unsupported crafting claim");
    }
    if(!exact(item.evidence,["tooltip","baseline","crafting"]) ||
        !tooltipSource(item.evidence.tooltip) ||
        !httpsSource(item.evidence.baseline) ||
        !httpsSource(item.evidence.crafting)) {
      fail(label+" has missing or unsupported evidence");
    }
  }
  return {ok:errors.length===0,errors,records:errors.length?[]:payload.records};
}

export function getReviewedExtendedFacts(payload,nameRegistry){
  const verdict=validateExtendedEquipmentFacts(payload,nameRegistry);
  if(!verdict.ok) throw new Error("Extended equipment publication blocked: "+verdict.errors.join("; "));
  return verdict.records.map(item=>({...item,derived:attackComposition(item)}));
}
