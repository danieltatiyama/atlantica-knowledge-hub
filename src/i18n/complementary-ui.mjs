import { LOCALE_IDS } from "./locales.mjs";
import { equipmentText, hasEquipmentMessage } from "./equipment-ui.mjs";
import { complementaryRowsA } from "./complementary-ui-a.mjs";
import { complementaryRowsB } from "./complementary-ui-b.mjs";
const extra=[
  [
    "This article body is shown in English until a reviewed translation is available.",
    "Le texte de cet article reste en anglais en attendant une traduction vérifiée.",
    "Der Artikeltext bleibt bis zu einer geprüften Übersetzung auf Englisch.",
    "El texto del artículo permanece en inglés hasta disponer de una traducción revisada.",
    "검토된 번역이 제공될 때까지 본문은 영어로 표시됩니다.",
    "文章正文暂以英语显示，直至审核译文可用。",
    "確認済みの翻訳が用意されるまで本文は英語で表示されます。"
  ],
  [
    "{unique} unique name matches, {ambiguous} names with multiple item IDs and {missing} unmatched. Client level and grade are raw fields, not necessarily the live requirement. Divergent source names remain unresolved.",
    "{unique} correspondances uniques, {ambiguous} noms avec plusieurs ID et {missing} sans correspondance. Niveau et grade du client sont des champs bruts, pas nécessairement les exigences actuelles. Les noms divergents restent non résolus.",
    "{unique} eindeutige Namensübereinstimmungen, {ambiguous} Namen mit mehreren IDs und {missing} ohne Übereinstimmung. Clientlevel und Grad sind Rohfelder, nicht zwingend aktuelle Anforderungen. Abweichende Namen bleiben ungeklärt.",
    "{unique} coincidencias únicas, {ambiguous} nombres con varios ID y {missing} sin coincidencia. Nivel y grado son campos brutos del cliente, no necesariamente requisitos actuales. Los nombres divergentes siguen sin resolver.",
    "고유 이름 일치 {unique}개, 여러 ID와 일치하는 이름 {ambiguous}개, 불일치 {missing}개. 레벨과 등급은 클라이언트 원본 필드로 현재 요구 조건과 다를 수 있습니다. 다른 이름은 미확인 상태입니다.",
    "{unique} 个唯一名称匹配、{ambiguous} 个名称对应多个 ID、{missing} 个未匹配。等级与品级为客户端原始字段，不一定是当前要求。名称差异仍待核实。",
    "一意の名称一致 {unique} 件、複数 ID に一致する名称 {ambiguous} 件、不一致 {missing} 件。レベルと等級は元のクライアント項目で、現行の条件とは限りません。異なる名称は未解決です。"
  ],
  [
    "Physical defense",
    "Défense physique",
    "Physische Verteidigung",
    "Defensa física",
    "물리 방어력",
    "物理防御",
    "物理防御"
  ],
  [
    "First Hit Damage is listed as +20% at +0 and +54% at L; this special bonus is NOT calculated by the basic-stat formula.",
    "First Hit Damage est indiqué à +20 % en +0 et +54 % en L ; ce bonus spécial n'est PAS calculé par la formule de base.",
    "First Hit Damage ist mit +20 % bei +0 und +54 % bei L angegeben; dieser Spezialbonus wird NICHT nach der Grundwertformel berechnet.",
    "First Hit Damage figura como +20 % en +0 y +54 % en L; este bono NO se calcula con la fórmula básica.",
    "First Hit Damage는 +0에서 +20%, L에서 +54%로 기록되어 있으며 기본 능력치 공식으로 계산하지 않습니다.",
    "First Hit Damage 在 +0 为 +20%，L 为 +54%；此特殊加成不使用基础属性公式计算。",
    "First Hit Damage は +0 で +20%、L で +54% と記録されており、基本能力値の式では計算しません。"
  ],
  [
    "Sage Sword's Judgment increases from Lv1 (+0) to Lv12 (L); skills are not derived by this numeric model.",
    "Sage Sword's Judgment passe de Lv1 (+0) à Lv12 (L) ; les compétences ne sont pas déduites de ce modèle.",
    "Sage Sword's Judgment steigt von Lv1 (+0) auf Lv12 (L); Fertigkeiten werden nicht aus diesem Modell abgeleitet.",
    "Sage Sword's Judgment sube de Lv1 (+0) a Lv12 (L); este modelo no deriva habilidades.",
    "Sage Sword's Judgment는 Lv1(+0)에서 Lv12(L)로 상승하며, 스킬은 이 모델로 추정하지 않습니다.",
    "Sage Sword's Judgment 从 Lv1 (+0) 提升至 Lv12 (L)；技能不由此数值模型推导。",
    "Sage Sword's Judgment は Lv1 (+0) から Lv12 (L) に上昇します。スキルはこの数値モデルから推定しません。"
  ],
  [
    "This is the Guardian Sheath EQUIPMENT SHIELD, not King Arthur's separate passive skill. Magic Defense 198 and evasion 8.5% are fixed in the source table.",
    "Il s'agit du BOUCLIER Guardian Sheath, pas de la compétence passive de King Arthur. La défense magique 198 et l'esquive 8,5 % sont fixes dans la source.",
    "Dies ist der AUSRÜSTUNGSSCHILD Guardian Sheath, nicht King Arthurs separate passive Fertigkeit. Magieverteidigung 198 und Ausweichen 8,5 % sind in der Tabelle fest.",
    "Es el ESCUDO Guardian Sheath, no la habilidad pasiva de King Arthur. Defensa mágica 198 y evasión 8,5 % son fijas en la tabla.",
    "King Arthur의 별도 패시브 스킬이 아닌 Guardian Sheath 방패 장비입니다. 출처 표에서 마법 방어력 198과 회피 8.5%는 고정값입니다.",
    "这是 Guardian Sheath 装备盾牌，并非 King Arthur 的独立被动技能。来源表中魔法防御 198 与闪避 8.5% 为固定值。",
    "King Arthur の別のパッシブスキルではなく、装備盾 Guardian Sheath です。出典表では魔法防御 198 と回避 8.5% が固定値です。"
  ],
  [
    "Bare L remains estimated from a historical +0 table. A newly supplied in-game screenshot shows an equipped L attack of 26,300–32,985 with three +10% Gold Eagle [VI] Star Stones. See the separate detailed profile for the complete breakdown.",
    "L sans pierres reste estimé à partir du tableau +0 historique. Une capture en jeu montre une attaque L équipée de 26 300–32 985 avec trois Gold Eagle [VI] à +10 %. Voir la fiche détaillée.",
    "L ohne Steine bleibt aus der historischen +0-Tabelle geschätzt. Ein Spiel-Screenshot zeigt 26.300–32.985 Angriff mit drei +10 % Gold Eagle [VI]. Details im separaten Profil.",
    "L sin piedras sigue estimado con la tabla histórica +0. Una captura muestra ataque L equipado de 26.300–32.985 con tres Gold Eagle [VI] de +10 %. Consulta la ficha detallada.",
    "스톤 없는 L은 과거 +0 표의 추정값입니다. 게임 스크린샷에서 +10% Gold Eagle [VI] 3개 장착 시 L 공격력 26,300~32,985가 확인됩니다. 상세 정보는 별도 페이지를 참조하세요.",
    "无星石 L 仍由历史 +0 表估算。游戏截图显示镶嵌三颗 +10% Gold Eagle [VI] 时 L 攻击力为 26,300–32,985。完整分解见独立详情页。",
    "ストーンなしの L は過去の +0 表による推定です。ゲーム画像では +10% Gold Eagle [VI] 3 個装着時の L 攻撃力 26,300～32,985 が確認されます。詳細は別ページを参照してください。"
  ],
  [
    "Legendary attacks apply a debuff that increases damage taken by 10%.",
    "Les attaques légendaires appliquent un malus augmentant les dégâts reçus de 10 %.",
    "Legendäre Angriffe verursachen einen Debuff, der erlittenen Schaden um 10 % erhöht.",
    "Los ataques legendarios aplican un debuff que aumenta el daño recibido un 10 %.",
    "전설 공격은 받는 피해를 10% 증가시키는 디버프를 적용합니다.",
    "传说攻击施加使受到伤害增加 10% 的减益。",
    "伝説攻撃は被ダメージを 10% 増加させるデバフを付与します。"
  ],
  [
    "When equipped by Harlequin: 54.0% extra critical damage.",
    "Équipé par Harlequin : 54,0 % de dégâts critiques supplémentaires.",
    "Wenn von Harlequin ausgerüstet: 54,0 % zusätzlicher kritischer Schaden.",
    "Equipado por Harlequin: 54,0 % de daño crítico adicional.",
    "Harlequin 장착 시 치명타 피해 54.0% 추가.",
    "Harlequin 装备时：额外 54.0% 暴击伤害。",
    "Harlequin 装備時：クリティカルダメージ 54.0% 追加。"
  ],
  [
    "Random",
    "Aléatoire",
    "Zufällig",
    "Aleatorio",
    "무작위",
    "随机",
    "ランダム"
  ],
  [
    "Selection",
    "Sélection",
    "Auswahl",
    "Selección",
    "선택",
    "选择",
    "選択"
  ],
  [
    "Fixed",
    "Fixe",
    "Fest",
    "Fijo",
    "고정",
    "固定",
    "固定"
  ],
  [
    "Unknown",
    "Inconnu",
    "Unbekannt",
    "Desconocido",
    "미확인",
    "未知",
    "不明"
  ]
];
export const complementaryRows=[...complementaryRowsA,...complementaryRowsB,...extra];
const map=new Map(complementaryRows.map(row=>[row[0],row]));
export const hasComplementaryMessage=key=>map.has(key)||hasEquipmentMessage(key);
export function complementaryText(lang,key,pt=key,values={}){
 const i=LOCALE_IDS.indexOf(lang);
 const text=i>1&&map.has(key)?map.get(key)[i-1]:equipmentText(lang,key,pt,values);
 return text.replace(/\{([a-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
}
