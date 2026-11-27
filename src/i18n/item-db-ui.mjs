import {LOCALE_IDS} from "./locales.mjs";
import {itemDbRowsA} from "./item-db-ui-a.mjs";
import {itemDbRowsB} from "./item-db-ui-b.mjs";

const extraRows=[
  ["Additional filters","Filtros adicionais","Filtres supplémentaires","Zusätzliche Filter","Filtros adicionales","추가 필터","更多筛选","追加フィルター"],
  [
    "{count} numeric source IDs loaded. Raw values; conflicts preserved.",
    "{count} IDs com atributos carregados. Valores brutos; conflitos preservados.",
    "{count} ID numériques chargés. Valeurs brutes ; conflits conservés.",
    "{count} IDs mit Zahlenwerten geladen. Rohwerte; Konflikte bleiben erhalten.",
    "{count} ID numéricos cargados. Valores brutos; conflictos preservados.",
    "수치 자료가 있는 ID {count}개를 불러왔습니다. 원본 수치와 충돌을 보존합니다.",
    "已加载 {count} 个数值来源 ID。保留原始值及冲突。",
    "数値元データID {count}件を読み込みました。元の値と矛盾を保持します。"
  ],
  [
    "{found} of {total} IDs found. {named} reconciled names.",
    "{found} dos {total} IDs encontrados. {named} nomes conciliados.",
    "{found} ID trouvés sur {total}. {named} noms rapprochés.",
    "{found} von {total} IDs gefunden. {named} abgeglichene Namen.",
    "{found} de {total} ID encontrados. {named} nombres conciliados.",
    "전체 {total}개 ID 중 {found}개 검색됨. 이름 확인: {named}개.",
    "找到 {found} / {total} 个 ID。已核对名称：{named} 个。",
    "全{total}件中{found}件のIDが見つかりました。名称照合済み：{named}件。"
  ],
  [
    "Conflicting fixed fields omitted: {fields}",
    "Campos fixos divergentes não foram projetados: {fields}",
    "Champs fixes contradictoires exclus : {fields}",
    "Widersprüchliche konstante Felder ausgelassen: {fields}",
    "Campos fijos contradictorios omitidos: {fields}",
    "충돌하는 고정 필드 제외: {fields}",
    "已排除冲突的固定字段：{fields}",
    "矛盾する固定項目を除外：{fields}"
  ],
  [
    "Produces {count} per batch",
    "Produz {count} por lote",
    "Produit {count} par lot",
    "Produziert {count} pro Batch",
    "Produce {count} por lote",
    "배치당 {count}개 생산",
    "每批产出 {count} 件",
    "バッチあたり{count}個生産"
  ],
  [
    "ID {id} not found",
    "ID {id} não encontrado",
    "ID {id} introuvable",
    "ID {id} nicht gefunden",
    "ID {id} no encontrado",
    "ID {id}을(를) 찾을 수 없습니다.",
    "未找到 ID {id}",
    "ID {id}が見つかりません"
  ],
  [
    "Min. attack",
    "Ataque mínimo",
    "Attaque min.",
    "Min. Angriff",
    "Ataque mín.",
    "최소 공격력",
    "最小攻击力",
    "最小攻撃力"
  ],
  [
    "Max. attack",
    "Ataque máximo",
    "Attaque max.",
    "Max. Angriff",
    "Ataque máx.",
    "최대 공격력",
    "最大攻击力",
    "最大攻撃力"
  ],
  [
    "Armor / AC",
    "Defesa / AC",
    "Défense / AC",
    "Rüstung / AC",
    "Defensa / AC",
    "방어력 / AC",
    "物理防御 / AC",
    "防御力 / AC"
  ],
  [
    "Magic Defense",
    "Defesa mágica",
    "Défense magique",
    "Magieverteidigung",
    "Defensa mágica",
    "마법 방어력",
    "魔法防御",
    "魔法防御力"
  ],
  [
    "Evasion / EV (raw)",
    "Evasão / EV (bruto)",
    "Esquive / EV (brut)",
    "Ausweichen / EV (roh)",
    "Evasión / EV (bruto)",
    "회피 / EV (원본)",
    "闪避 / EV（原始）",
    "回避 / EV（元データ）"
  ],
  [
    "Movement speed (raw)",
    "Velocidade de movimento (bruto)",
    "Vitesse de déplacement (brut)",
    "Bewegungsgeschwindigkeit (roh)",
    "Velocidad de movimiento (bruto)",
    "이동 속도 (원본)",
    "移动速度（原始）",
    "移動速度（元データ）"
  ],
  [
    "Strength",
    "Força",
    "Force",
    "Stärke",
    "Fuerza",
    "힘",
    "力量",
    "筋力"
  ],
  [
    "Dexterity",
    "Destreza",
    "Dextérité",
    "Geschicklichkeit",
    "Destreza",
    "민첩",
    "敏捷",
    "敏捷性"
  ],
  [
    "Vitality",
    "Vitalidade",
    "Vitalité",
    "Vitalität",
    "Vitalidad",
    "생명력",
    "体力",
    "生命力"
  ],
  [
    "Mag (raw)",
    "Mag (bruto)",
    "Mag (brut)",
    "Mag (roh)",
    "Mag (bruto)",
    "Mag (원본)",
    "Mag（原始）",
    "Mag（元データ）"
  ],
  [
    "Hit Rate",
    "Precisão",
    "Précision",
    "Trefferrate",
    "Precisión",
    "명중률",
    "命中率",
    "命中率"
  ],
  [
    "Magic Skill Plus",
    "Bônus de habilidade mágica",
    "Bonus de compétence magique",
    "Magiefertigkeitsbonus",
    "Bonificación de habilidad mágica",
    "마법 스킬 보너스",
    "魔法技能加成",
    "魔法スキルボーナス"
  ],
  [
    "Critical Plus",
    "Crítico adicional",
    "Bonus critique",
    "Krit-Bonus",
    "Crítico adicional",
    "치명타 보너스",
    "暴击加成",
    "クリティカルボーナス"
  ],
  [
    "English names and raw source categories are preserved. Linked equipment profiles, monster pages and tools may still open in English.",
    "Os nomes em inglês e as categorias originais são preservados. Fichas de equipamentos, páginas de monstros e ferramentas vinculadas podem abrir em inglês.",
    "Les noms anglais et les catégories source sont conservés. Les fiches d’équipement, pages de monstres et outils liés peuvent rester en anglais.",
    "Englische Namen und Rohkategorien bleiben erhalten. Verlinkte Ausrüstungsprofile, Monsterseiten und Werkzeuge können weiterhin auf Englisch sein.",
    "Se conservan los nombres ingleses y las categorías originales. Las fichas de equipamiento, páginas de monstruos y herramientas enlazadas pueden abrirse en inglés.",
    "영문 이름과 원본 분류는 그대로 유지합니다. 연결된 장비 상세 정보, 몬스터 페이지 및 도구는 아직 영어로 열릴 수 있습니다.",
    "保留英文名称和原始来源分类。链接的装备详情、怪物页面及工具可能仍为英文。",
    "英語名と元データ分類は保持します。リンク先の装備詳細、モンスターページ、ツールは英語の場合があります。"
  ],
  [
    "CSV export uses the original English or Portuguese column format.",
    "A exportação CSV utiliza o formato original de colunas em inglês ou português.",
    "Le CSV conserve le format de colonnes anglais ou portugais d’origine.",
    "Der CSV-Export verwendet das ursprüngliche englische oder portugiesische Spaltenformat.",
    "La exportación CSV conserva el formato original de columnas en inglés o portugués.",
    "CSV 내보내기는 기존 영어 또는 포르투갈어 열 형식을 사용합니다.",
    "CSV 导出保留原有英文或葡萄牙文列格式。",
    "CSV出力は従来の英語またはポルトガル語の列形式を使用します。"
  ]
];
export const itemDbRows=[...itemDbRowsA,...itemDbRowsB,...extraRows];
const messages=new Map(itemDbRows.map(row=>[row[0],row]));
export function itemDbText(lang,key,values={}){
 const text=messages.get(key)?.[Math.max(0,LOCALE_IDS.indexOf(lang))]??key;
 return text.replace(/\{([a-z]+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
}
