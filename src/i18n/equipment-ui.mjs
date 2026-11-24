import {LOCALE_IDS} from "./locales.mjs";
import {sharedRows} from "./shared-ui.mjs";
import {catalogRows} from "./catalog-ui.mjs";
import {itemDbRows} from "./item-db-ui.mjs";
import {monsterRowsByScope} from "./monster-ui.mjs";
import {equipmentRowsA} from "./equipment-ui-a.mjs";
import {equipmentRowsB} from "./equipment-ui-b.mjs";
import {equipmentRowsC} from "./equipment-ui-c.mjs";
const additionalRows=[
  ["batches","lots","Batches","lotes","배치","批","バッチ"],
  ["Extracted","Extrait","Extrahiert","Extraído","추출됨","已提取","抽出済み"],
  [
    "Client level (raw)",
    "Niveau client (brut)",
    "Clientlevel (roh)",
    "Nivel del cliente (bruto)",
    "클라이언트 레벨 (원본)",
    "客户端等级（原始）",
    "クライアントレベル（元データ）"
  ],
  [
    "Client grade (raw)",
    "Grade client (brut)",
    "Clientstufe (roh)",
    "Grado del cliente (bruto)",
    "클라이언트 등급 (원본)",
    "客户端强化等级（原始）",
    "クライアント等級（元データ）"
  ],
  [
    "Unit (raw)",
    "Unit (brut)",
    "Unit (roh)",
    "Unit (bruto)",
    "Unit (원본)",
    "Unit（原始）",
    "Unit（元データ）"
  ],
  [
    "Work (raw)",
    "Work (brut)",
    "Work (roh)",
    "Work (bruto)",
    "Work (원본)",
    "Work（原始）",
    "Work（元データ）"
  ],
  [
    "Material expression not automatically parsed.",
    "Expression de matériau non analysée automatiquement.",
    "Materialausdruck nicht automatisch geparst.",
    "Expresión de materiales no analizada automáticamente.",
    "재료 표현을 자동 해석하지 못했습니다.",
    "材料表达式未自动解析。",
    "素材式は自動解析されていません。"
  ],
  [
    "No confirmed structured materials in this definition.",
    "Aucun matériau structuré confirmé dans cette définition.",
    "Keine bestätigten strukturierten Materialien in dieser Definition.",
    "No hay materiales estructurados confirmados en esta definición.",
    "이 정의에 확인된 구조화 재료가 없습니다.",
    "此定义无已确认结构化材料。",
    "この定義に確認済みの構造化素材がありません。"
  ],
  [
    "{count} material references lack a reviewed English name.",
    "{count} références de matériaux sans nom anglais vérifié.",
    "{count} Materialverweise ohne geprüften englischen Namen.",
    "{count} referencias de materiales sin nombre inglés revisado.",
    "재료 참조 {count}개에 검토된 영문 이름이 없습니다.",
    "{count} 条材料引用无已审核英文名称。",
    "素材参照{count}件に確認済み英語名がありません。"
  ],
  [
    "{count} conflicting field(s)",
    "{count} champ(s) contradictoire(s)",
    "{count} widersprüchliche Felder",
    "{count} campos contradictorios",
    "충돌 필드 {count}개",
    "{count} 个冲突字段",
    "矛盾する項目{count}件"
  ],
  [
    "+0 was observed in-game; other values are predictions derived from historical equipment tables. Every row identifies its origin.",
    "+0 observé en jeu ; les autres valeurs sont des projections issues de tableaux historiques. Chaque ligne indique sa source.",
    "+0 im Spiel beobachtet; weitere Werte aus historischen Ausrüstungstabellen projiziert. Jede Zeile nennt die Herkunft.",
    "+0 observado en juego; otros valores son proyecciones de tablas históricas. Cada fila identifica su origen.",
    "+0은 게임 내 관찰값이며 나머지는 과거 장비 표에서 계산한 추정치입니다. 각 행에 출처를 표시합니다.",
    "+0 为游戏内观测值；其余来自历史装备表的推算。每行注明依据。",
    "+0はゲーム内観察値、他は過去の装備表からの推定値です。各行に根拠を示します。"
  ],
  [
    "+0 was documented in a historic community wiki; other values are predictions from the same model. None have been confirmed in the current client.",
    "+0 documenté dans un ancien wiki communautaire ; les autres valeurs sont des projections du même modèle. Aucune n’est confirmée dans le client actuel.",
    "+0 in einem historischen Community-Wiki dokumentiert; weitere Werte aus demselben Modell. Im aktuellen Client ist keiner bestätigt.",
    "+0 documentado en una wiki comunitaria histórica; otros valores son proyecciones del mismo modelo. Ninguno confirmado en el cliente actual.",
    "+0은 과거 커뮤니티 위키의 기록이며 나머지는 같은 모델 추정치입니다. 현재 클라이언트에서 확인된 값이 아닙니다.",
    "+0 来自历史社区 Wiki；其余为同模型推算。均未在当前客户端确认。",
    "+0は過去コミュニティWikiに記録され、他は同モデルの推定値です。現行クライアントでは未確認です。"
  ],
  [
    "Enchantment statistics from reviewed sources.",
    "Attributs d’amélioration de sources vérifiées.",
    "Verstärkungswerte aus geprüften Quellen.",
    "Atributos de mejora de fuentes revisadas.",
    "검토된 출처의 강화 능력치입니다.",
    "来自已审核来源的强化属性。",
    "確認済み出典の強化属性です。"
  ],
  [
    "Intelligence",
    "Intelligence",
    "Intelligenz",
    "Inteligencia",
    "지능",
    "智力",
    "知力"
  ],
  [
    "Legendary Enhancement",
    "Amélioration légendaire",
    "Legendäre Verstärkung",
    "Mejora legendaria",
    "전설 강화",
    "传说强化",
    "レジェンド強化"
  ],
  [
    "The detailed equipment article is available in English or Portuguese. This localized database profile retains the original client data.",
    "La fiche détaillée est disponible en anglais ou portugais. Cette fiche localisée conserve les données originales du client.",
    "Der ausführliche Ausrüstungsartikel ist auf Englisch oder Portugiesisch verfügbar. Dieses lokalisierte Datenbankprofil erhält die originalen Clientdaten.",
    "La ficha detallada está disponible en inglés o portugués. Este perfil localizado conserva los datos originales del cliente.",
    "장비 상세 문서는 영어 또는 포르투갈어로 제공됩니다. 이 현지화된 DB 정보에는 원본 클라이언트 자료가 그대로 유지됩니다.",
    "详细装备文章提供英文或葡萄牙文版本。此本地化数据库详情保留客户端原始数据。",
    "装備の詳細記事は英語またはポルトガル語で利用できます。このローカライズ済みDB詳細は元データを保持します。"
  ]
];
export const equipmentRows=[...equipmentRowsA,...equipmentRowsB,...equipmentRowsC,...additionalRows];
const equipmentMap=new Map(equipmentRows.map(row=>[row[0],row]));
const reusedMap=new Map([...sharedRows,...catalogRows,...Object.values(monsterRowsByScope).flat(),...itemDbRows].map(row=>[row[0],row]));
export function hasEquipmentMessage(key){return equipmentMap.has(key)||reusedMap.has(key);}
export function equipmentText(lang,key,pt=key,values={}){
 const i=LOCALE_IDS.indexOf(lang);
 const text=i===1?pt:i>1?(equipmentMap.get(key)?.[i-1]??reusedMap.get(key)?.[i]??key):key;
 return text.replace(/\{([a-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
}
