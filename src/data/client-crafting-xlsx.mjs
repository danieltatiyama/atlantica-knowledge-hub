/**
 * Client-side Office Open XML exporter for the crafting calculator.
 * Pure JavaScript, no external packages or server requests. Produces a real
 * multi-sheet XLSX workbook (ZIP/OOXML), not a renamed CSV or HTML table.
 * User text is always stored as inline string XML, never as executable formulas.
 *
 * Only generated shopping cost cells contain trusted, authored Excel formulas.
 */
const encode=new TextEncoder();
const DEPTH_FILLS=["FFF4E5","EAF3FF","E9F6F0","F4EDFC","FDECF0","F8F3DF","E7F5F7","EFEFFE"];
const esc=value=>String(value??"")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const positive=value=>typeof value==="string"&&/^\d+$/.test(value);
const asNumeric=value=>{
  const str=String(value??"");
  // Excel's numeric precision is 15 digits; preserve longer quantities as text.
  return /^\d+(?:\.\d+)?$/.test(str)&&str.replace(/\D/g,"").length<=15;
};
const xlsColumn=n=>{
  let result="";
  for(n++;n>0;n=Math.floor((n-1)/26))result=String.fromCharCode(65+(n-1)%26)+result;
  return result;
};
const txt=(value,style)=>({value:String(value??""),style});
const num=(value,style)=>({value:String(value??""),type:"numeric",style});
const formula=(value,style)=>({value,type:"formula",style});
const xmlCell=(data,address,style)=>{
  const v=data?.value??"";
  const s=data?.style??style??0;
  if(data?.type==="formula")
    return '<c r="'+address+'" s="'+s+'"><f>'+esc(v)+'</f><v></v></c>';
  if(data?.type==="numeric"&&asNumeric(v))
    return '<c r="'+address+'" s="'+s+'"><v>'+v+'</v></c>';
  return '<c r="'+address+'" s="'+s+'" t="inlineStr"><is><t xml:space="preserve">'+
    esc(v)+'</t></is></c>';
};
const styleXf=({fill=0,font=0,border=0,numeric=false,indent=0}={})=>
  '<xf numFmtId="'+(numeric?3:0)+'" fontId="'+font+'" fillId="'+fill+
  '" borderId="'+border+'" xfId="0" applyFill="1" applyFont="1"'+
  (numeric?' applyNumberFormat="1"':"")+
  ' applyAlignment="1"><alignment vertical="center"'+(indent?' indent="'+indent+'"':"")+
  '/></xf>';
const styles=()=>{
  const fonts=[
    '<font><sz val="11"/><color rgb="FF1D2A3D"/><name val="Aptos"/></font>',
    '<font><b/><sz val="17"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font>',
    '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font>',
    '<font><i/><sz val="10"/><color rgb="FF667588"/><name val="Aptos"/></font>',
    '<font><b/><sz val="11"/><color rgb="FF1D2A3D"/><name val="Aptos"/></font>',
  ];
  const fills=[
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FF17263B"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F6FB"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE6D1AB"/><bgColor indexed="64"/></patternFill></fill>',
    ...DEPTH_FILLS.map(hex=>'<fill><patternFill patternType="solid"><fgColor rgb="FF'+hex+
      '"/><bgColor indexed="64"/></patternFill></fill>'),
  ];
  const border='<border><left/><right/><top/><bottom style="hair"><color rgb="FFDDE5EE"/></bottom><diagonal/></border>';
  const xfs=[
    styleXf(),                                          // 0: ordinary
    styleXf({fill:2,font:1}),                          // 1: main title
    styleXf({fill:2,font:2}),                          // 2: header
    styleXf({border:1,numeric:true}),                  // 3: numeric
    styleXf({fill:3,border:1}),                        // 4: alternating
    styleXf({fill:3,border:1,numeric:true}),           // 5: alternating numeric
    styleXf({font:3}),                                 // 6: source disclaimer
    styleXf({font:4}),                                 // 7: emphasized
    styleXf({fill:4,font:4,numeric:true}),             // 8: total numeric
  ];
  // 9–16 generic depth rows; 17–24 numeric; 25–32 indented name
  for(let d=0;d<8;d++)xfs.push(styleXf({fill:5+d,border:1}));
  for(let d=0;d<8;d++)xfs.push(styleXf({fill:5+d,border:1,numeric:true}));
  for(let d=0;d<8;d++)xfs.push(styleXf({fill:5+d,border:1,font:4,indent:d}));
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<fonts count="'+fonts.length+'">'+fonts.join("")+'</fonts>'+
    '<fills count="'+fills.length+'">'+fills.join("")+'</fills>'+
    '<borders count="1">'+border+'</borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+
    '<cellXfs count="'+xfs.length+'">'+xfs.join("")+'</cellXfs>'+
    '</styleSheet>';
};
const sheetXml=({title,subtitle,notice,headings,rows,widths,depths=[],numericCols=[],tabColor="D1A45D"})=>{
  const count=headings.length,letter=xlsColumn(count-1),last=Math.max(6,rows.length+5);
  const header=['<row r="5" ht="30" customHeight="1">',
    ...headings.map((value,i)=>xmlCell(txt(value,2),xlsColumn(i)+"5",2)),
    '</row>'].join("");
  const body=rows.map((row,index)=>{
    const number=index+6,depth=depths[index];
    const shades=depth===undefined?null:Number(depth)%8;
    const cells=row.map((entry,col)=>{
      const value=entry&&typeof entry==="object"&&"type" in entry
        ?entry:entry&&typeof entry==="object"&&"value" in entry?entry:txt(entry);
      const numCol=numericCols.includes(col);
      const style=entry?.style??(shades===null
        ?(index%2?(numCol?5:4):(numCol?3:0))
        :(col===2?25+shades:numCol?17+shades:9+shades));
      return xmlCell(value,xlsColumn(col)+number,style);
    }).join("");
    return '<row r="'+number+'" ht="24" customHeight="1">'+cells+'</row>';
  }).join("");
  const cols=widths.map((width,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+width+
    '" customWidth="1"/>').join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<sheetPr><tabColor rgb="FF'+tabColor+'"/></sheetPr>'+
    '<dimension ref="A1:'+letter+last+'"/>'+
    '<sheetViews><sheetView workbookViewId="0">'+
    '<pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/>'+
    '<selection pane="bottomLeft" activeCell="A6" sqref="A6"/>'+
    '</sheetView></sheetViews>'+
    '<sheetFormatPr defaultRowHeight="20"/><cols>'+cols+'</cols>'+
    '<sheetData>'+
    '<row r="1" ht="36" customHeight="1">'+xmlCell(txt(title,1),"A1",1)+'</row>'+
    '<row r="2" ht="27" customHeight="1">'+xmlCell(txt(subtitle,7),"A2",7)+'</row>'+
    '<row r="3" ht="32" customHeight="1">'+xmlCell(txt(notice,6),"A3",6)+'</row>'+
    header+body+'</sheetData>'+
    '<autoFilter ref="A5:'+letter+Math.max(6,5+rows.length)+'"/>'+
    '<mergeCells count="3"><mergeCell ref="A1:'+letter+'1"/>'+
    '<mergeCell ref="A2:'+letter+'2"/><mergeCell ref="A3:'+letter+'3"/></mergeCells>'+
    '<pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>'+
    '</worksheet>';
};
// ZIP format: STORE method and CRC32 to avoid shipping third-party browser
// dependencies. It opens in Excel and LibreOffice as ordinary .xlsx.
const crcTable=new Uint32Array(256);
for(let n=0;n<256;n++){
  let v=n;
  for(let j=0;j<8;j++)v=v&1?0xEDB88320^(v>>>1):v>>>1;
  crcTable[n]=v>>>0;
}
const crc32=bytes=>{
  let value=0xFFFFFFFF;
  for(const b of bytes)value=crcTable[(value^b)&255]^(value>>>8);
  return(value^0xFFFFFFFF)>>>0;
};
export function createStoredZip(files){
  if(!Array.isArray(files)||files.length>100)throw Error("Unexpected workbook entry count");
  const chunks=[],directory=[];let offset=0;
  const u16=(view,pos,v)=>view.setUint16(pos,v,true);
  const u32=(view,pos,v)=>view.setUint32(pos,v,true);
  for(const {name,data} of files){
    const label=encode.encode(name),bytes=typeof data==="string"?encode.encode(data):data;
    const hash=crc32(bytes);
    const local=new Uint8Array(30+label.length),v=new DataView(local.buffer);
    u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0);u16(v,8,0);
    u16(v,10,0);u16(v,12,33);u32(v,14,hash);
    u32(v,18,bytes.length);u32(v,22,bytes.length);u16(v,26,label.length);
    local.set(label,30);chunks.push(local,bytes);
    const central=new Uint8Array(46+label.length),cv=new DataView(central.buffer);
    u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0);
    u16(cv,10,0);u16(cv,12,0);u16(cv,14,33);u32(cv,16,hash);
    u32(cv,20,bytes.length);u32(cv,24,bytes.length);u16(cv,28,label.length);
    u32(cv,42,offset);central.set(label,46);directory.push(central);
    offset+=local.length+bytes.length;
  }
  const directoryStart=offset;
  for(const part of directory){chunks.push(part);offset+=part.length;}
  const end=new Uint8Array(22),ev=new DataView(end.buffer);
  u32(ev,0,0x06054b50);u16(ev,8,directory.length);u16(ev,10,directory.length);
  u32(ev,12,offset-directoryStart);u32(ev,16,directoryStart);
  chunks.push(end);offset+=end.length;
  const result=new Uint8Array(offset);
  let at=0;for(const part of chunks){result.set(part,at);at+=part.length;}
  return result;
}
const extraLanguageLabels={
  "fr": {
    "tree": "Arbre de fabrication",
    "schedule": "Ordre de fabrication",
    "shopping": "Liste d’achat",
    "leftovers": "Excédents",
    "treeHeaders": [
      "Niveau",
      "Item ID",
      "Objet",
      "Recette parente",
      "Consommé dans la branche",
      "Consommation totale",
      "À fabriquer",
      "Excédent",
      "Par lot",
      "Total des lots",
      "Opérations",
      "Répartition des opérations",
      "Par lot parent",
      "Lots parents",
      "Répartition de la consommation",
      "Mode",
      "Partagé"
    ],
    "scheduleHeaders": [
      "Item ID",
      "Produit fabriqué",
      "Requis",
      "À produire",
      "Par lot",
      "Lots",
      "Opérations",
      "Limite par opération",
      "Répartition des opérations",
      "Excédent"
    ],
    "shoppingHeaders": [
      "Item ID",
      "Matériau",
      "Quantité",
      "Prix unitaire (modifiable)",
      "Coût estimé",
      "Source"
    ],
    "leftoverHeaders": [
      "Item ID",
      "Produit",
      "Unités excédentaires"
    ],
    "noExcess": "Aucun excédent de lot",
    "notice": "Recettes candidates issues du client. Les limites comprennent les règles confirmées par le joueur. Recettes du serveur non vérifiées.",
    "editNote": "Les prix unitaires sont modifiables ; Excel recalcule les coûts estimés. Les prix vides restent indéterminés.",
    "crafted": "Fabriquer",
    "buy": "Acheter",
    "base": "Base",
    "unresolved": "Non résolu",
    "yes": "Oui",
    "no": "Non",
    "requested": "Demandé",
    "operations": "Opérations",
    "batches": "Lots",
    "questions": "questions de recette ou de lot non résolues",
    "npc": "Référence NPC du client (marché non vérifié)",
    "player": "Prix saisi par le joueur",
    "unpriced": "Sans prix"
  },
  "de": {
    "tree": "Herstellungsbaum",
    "schedule": "Herstellungsablauf",
    "shopping": "Einkaufsliste",
    "leftovers": "Überschüsse",
    "treeHeaders": [
      "Ebene",
      "Item ID",
      "Gegenstand",
      "Übergeordnetes Rezept",
      "Verbrauch im Zweig",
      "Gesamtverbrauch",
      "Herzustellen",
      "Überschuss",
      "Pro Batch",
      "Gesamtbatches",
      "Vorgänge",
      "Vorgangsaufteilung",
      "Pro Elternbatch",
      "Elternbatches",
      "Verbrauchsaufteilung",
      "Modus",
      "Gemeinsam"
    ],
    "scheduleHeaders": [
      "Item ID",
      "Hergestelltes Produkt",
      "Benötigt",
      "Zu produzieren",
      "Pro Batch",
      "Batches",
      "Vorgänge",
      "Limit pro Vorgang",
      "Vorgangsaufteilung",
      "Überschuss"
    ],
    "shoppingHeaders": [
      "Item ID",
      "Material",
      "Menge",
      "Stückpreis (bearbeitbar)",
      "Geschätzte Kosten",
      "Quelle"
    ],
    "leftoverHeaders": [
      "Item ID",
      "Produkt",
      "Überschusseinheiten"
    ],
    "noExcess": "Keine Batchüberschüsse",
    "notice": "Rezeptkandidaten aus Clientdaten. Limits enthalten spielerbestätigte Regeln. Live-Server-Rezepte sind nicht verifiziert.",
    "editNote": "Stückpreise sind bearbeitbar; Excel berechnet geschätzte Kosten neu. Leere Preise bleiben offen.",
    "crafted": "Herstellen",
    "buy": "Kaufen",
    "base": "Basis",
    "unresolved": "Ungeklärt",
    "yes": "Ja",
    "no": "Nein",
    "requested": "Angefordert",
    "operations": "Vorgänge",
    "batches": "Batches",
    "questions": "ungeklärte Rezept-/Batchfragen",
    "npc": "Client-NPC-Referenz (Markt ungeprüft)",
    "player": "Vom Spieler eingegebener Preis",
    "unpriced": "Ohne Preis"
  },
  "es": {
    "tree": "Árbol de fabricación",
    "schedule": "Programa de fabricación",
    "shopping": "Lista de compras",
    "leftovers": "Sobrantes",
    "treeHeaders": [
      "Nivel",
      "Item ID",
      "Objeto",
      "Receta superior",
      "Consumo de rama",
      "Consumo total",
      "A fabricar",
      "Excedente",
      "Por lote",
      "Total de lotes",
      "Operaciones",
      "Desglose de operaciones",
      "Por lote superior",
      "Lotes superiores",
      "Desglose de consumo",
      "Modo",
      "Compartido"
    ],
    "scheduleHeaders": [
      "Item ID",
      "Producto fabricado",
      "Necesario",
      "A producir",
      "Por lote",
      "Lotes",
      "Operaciones",
      "Límite por operación",
      "Desglose de operaciones",
      "Excedente"
    ],
    "shoppingHeaders": [
      "Item ID",
      "Material",
      "Cantidad",
      "Precio unitario (editable)",
      "Coste estimado",
      "Fuente"
    ],
    "leftoverHeaders": [
      "Item ID",
      "Producto",
      "Unidades excedentes"
    ],
    "noExcess": "Sin sobrantes de lote",
    "notice": "Recetas candidatas del cliente. Los límites incluyen reglas confirmadas por el jugador. Recetas del servidor no verificadas.",
    "editNote": "Los precios unitarios son editables; Excel recalcula los costes estimados. Los precios vacíos quedan pendientes.",
    "crafted": "Fabricar",
    "buy": "Comprar",
    "base": "Base",
    "unresolved": "Sin resolver",
    "yes": "Sí",
    "no": "No",
    "requested": "Solicitado",
    "operations": "Operaciones",
    "batches": "Lotes",
    "questions": "cuestiones de receta o lote sin resolver",
    "npc": "Referencia NPC del cliente (mercado no verificado)",
    "player": "Precio introducido por el jugador",
    "unpriced": "Sin precio"
  },
  "ko": {
    "tree": "제작 트리",
    "schedule": "제작 일정",
    "shopping": "구매 목록",
    "leftovers": "잔여량",
    "treeHeaders": [
      "단계",
      "Item ID",
      "아이템",
      "상위 제작법",
      "분기 소비량",
      "총 소비량",
      "제작량",
      "초과량",
      "배치당",
      "총 배치 수",
      "작업 수",
      "작업별 생산량",
      "상위 배치당",
      "상위 배치 수",
      "소비량 내역",
      "유형",
      "공유"
    ],
    "scheduleHeaders": [
      "Item ID",
      "제작품",
      "필요량",
      "생산량",
      "배치당",
      "배치 수",
      "작업 수",
      "작업당 한도",
      "작업별 생산량",
      "초과량"
    ],
    "shoppingHeaders": [
      "Item ID",
      "재료",
      "수량",
      "단가 (편집 가능)",
      "예상 비용",
      "출처"
    ],
    "leftoverHeaders": [
      "Item ID",
      "생산품",
      "초과 수량"
    ],
    "noExcess": "배치 잔여량 없음",
    "notice": "클라이언트 제작법 후보입니다. 한도에는 플레이어 확인 규칙이 포함됩니다. 실제 서버 제작법은 검증되지 않았습니다.",
    "editNote": "단가를 수정하면 Excel에서 예상 비용을 다시 계산합니다. 빈 가격은 미입력 상태로 유지됩니다.",
    "crafted": "제작",
    "buy": "구매",
    "base": "기본",
    "unresolved": "미확인",
    "yes": "예",
    "no": "아니요",
    "requested": "요청량",
    "operations": "작업 수",
    "batches": "배치 수",
    "questions": "미확인 제작법/배치 항목",
    "npc": "클라이언트 NPC 참고값 (시장 미검증)",
    "player": "플레이어 입력 가격",
    "unpriced": "가격 미입력"
  },
  "zh-hans": {
    "tree": "制作树",
    "schedule": "制作安排",
    "shopping": "购物清单",
    "leftovers": "剩余量",
    "treeHeaders": [
      "层级",
      "Item ID",
      "物品",
      "上级配方",
      "分支消耗",
      "总消耗",
      "待制作",
      "多余",
      "每批",
      "总批数",
      "操作次数",
      "操作拆分",
      "每上级批次",
      "上级批数",
      "消耗拆分",
      "模式",
      "共享"
    ],
    "scheduleHeaders": [
      "Item ID",
      "制作产品",
      "所需",
      "待产出",
      "每批",
      "批数",
      "操作次数",
      "单次上限",
      "操作拆分",
      "多余"
    ],
    "shoppingHeaders": [
      "Item ID",
      "材料",
      "数量",
      "单价（可编辑）",
      "估算成本",
      "来源"
    ],
    "leftoverHeaders": [
      "Item ID",
      "产品",
      "多余数量"
    ],
    "noExcess": "无批次剩余",
    "notice": "客户端候选配方。上限包含玩家确认的规则。正式服务器配方未经验证。",
    "editNote": "可编辑单价；Excel 将重新计算估算成本。空白价格保持未定价。",
    "crafted": "制作",
    "buy": "购买",
    "base": "基础",
    "unresolved": "未解决",
    "yes": "是",
    "no": "否",
    "requested": "需求量",
    "operations": "操作次数",
    "batches": "批数",
    "questions": "未解决的配方/批量问题",
    "npc": "客户端 NPC 参考价（市场未验证）",
    "player": "玩家输入价格",
    "unpriced": "未定价"
  },
  "ja": {
    "tree": "製造ツリー",
    "schedule": "製造手順",
    "shopping": "買い物リスト",
    "leftovers": "余剰",
    "treeHeaders": [
      "階層",
      "Item ID",
      "アイテム",
      "親レシピ",
      "分岐消費数",
      "総消費数",
      "製造数",
      "余剰",
      "バッチあたり",
      "総バッチ数",
      "操作数",
      "操作内訳",
      "親バッチあたり",
      "親バッチ数",
      "消費内訳",
      "モード",
      "共有"
    ],
    "scheduleHeaders": [
      "Item ID",
      "製造品",
      "必要数",
      "生産数",
      "バッチあたり",
      "バッチ数",
      "操作数",
      "操作上限",
      "操作内訳",
      "余剰"
    ],
    "shoppingHeaders": [
      "Item ID",
      "素材",
      "数量",
      "単価（編集可能）",
      "推定費用",
      "出典"
    ],
    "leftoverHeaders": [
      "Item ID",
      "生産品",
      "余剰数"
    ],
    "noExcess": "バッチ余剰なし",
    "notice": "クライアント由来の候補レシピです。上限にはプレイヤー確認済みルールが含まれます。実サーバーのレシピは未確認です。",
    "editNote": "単価を編集するとExcelが推定費用を再計算します。空欄の価格は未設定のままです。",
    "crafted": "製造",
    "buy": "購入",
    "base": "基本",
    "unresolved": "未解決",
    "yes": "はい",
    "no": "いいえ",
    "requested": "要求数",
    "operations": "操作数",
    "batches": "バッチ数",
    "questions": "未解決のレシピ・バッチ項目",
    "npc": "クライアントNPC参考価格（市場未確認）",
    "player": "プレイヤー入力価格",
    "unpriced": "価格未設定"
  }
};
const languageLabels={
  en:{
    tree:"Crafting Tree",schedule:"Craft Schedule",shopping:"Shopping List",leftovers:"Leftovers",
    treeHeaders:["Level","Item ID","Item","Parent recipe","Consumed in branch",
      "Consumed overall","To craft","Excess","Per batch","Total batches",
      "Operations","Operation split","Per parent batch","Parent batches",
      "Consumption breakdown","Mode","Shared"],
    scheduleHeaders:["Item ID","Crafted product","Needed","To produce","Per batch",
      "Batches","Operations","Cap / operation","Operation breakdown","Excess"],
    shoppingHeaders:["Item ID","Material","Quantity","Unit price (editable)","Est. cost","Source"],
    leftoverHeaders:["Item ID","Product","Excess units"],
    noExcess:"No batch leftovers",
    notice:"Client source candidate recipes. Batch/output limits include player-confirmed rules. Not verified against live-server recipes.",
    editNote:"Unit prices may be edited; the estimated cost column recalculates in Excel. Blank prices remain unpriced.",
    crafted:"Craft",buy:"Buy",base:"Base",unresolved:"Unresolved",yes:"Yes",no:"No",
  },
  pt:{
    tree:"Arvore de Craft",schedule:"Agenda de Craft",shopping:"Lista de Compras",leftovers:"Excedentes",
    treeHeaders:["Nivel","Item ID","Item","Receita pai","Consumo no ramo",
      "Consumo total","A fabricar","Excedente","Por batch","Total batches",
      "Operacoes","Divisao das operacoes","Por batch da receita pai","Batches da receita pai",
      "Divisao do consumo","Tipo","Compartilhado"],
    scheduleHeaders:["Item ID","Produto fabricado","Necessario","A fabricar","Por batch",
      "Batches","Operacoes","Limite por operacao","Divisao das operacoes","Excedente"],
    shoppingHeaders:["Item ID","Material","Quantidade","Preco unitario (editavel)","Custo estimado","Origem"],
    leftoverHeaders:["Item ID","Produto","Unidades excedentes"],
    noExcess:"Nenhum excedente de batch",
    notice:"Receitas candidatas dos arquivos do cliente. Os limites incluem regras confirmadas pelo jogador; disponibilidade no servidor nao comprovada.",
    editNote:"Precos unitarios podem ser editados; custos sao recalculados pelo Excel. Precos vazios permanecem pendentes.",
    crafted:"Fabricar",buy:"Comprar",base:"Base",unresolved:"Inconclusivo",yes:"Sim",no:"Nao",
  },
};
const kind=(mode,L)=>mode==="craft"?L.crafted:mode==="buy"?L.buy:
  mode==="unresolved"?L.unresolved:L.base;
const safeName=(name,id)=>String(name??"Item #"+id);
export function buildCraftingWorkbook({plan,names={},prices={},priceOrigins={},locale="en"}){
  if(!plan||!Array.isArray(plan.tree)||!Array.isArray(plan.steps)||
    !Array.isArray(plan.leaves)||!Array.isArray(plan.leftoverRows))
    throw new TypeError("A calculated crafting plan is required for export");
  const L=locale==="pt"||locale==="pt-br"?languageLabels.pt:extraLanguageLabels[locale]??languageLabels.en;
  const getName=id=>safeName(names[id],id);
  const target=getName(plan.targetItemId);
  const summary=target+" (#"+plan.targetItemId+") | "+
    (L.requested??"Requested")+": "+plan.requested+" | "+(L.operations??"Operations")+": "+plan.totalOperations+
    " | "+(L.batches??"Batches")+": "+plan.totalBatches;
  const sourceNote=L.notice+(plan.issues?.length?
    " | "+plan.issues.length+" "+(L.questions??"unresolved recipe/batch questions")+".":"");
  const treeRows=plan.tree.map(row=>{
    const parent=row.parentItemId?getName(row.parentItemId)+" (#"+row.parentItemId+")":"—";
    const consumption=row.parentItemId?(row.consumptionGroups??[]).map(group=>
      group.operations+" × "+group.consumedEach).join(" + "):"—";
    const operations=(row.operationGroups??[]).map(g=>
      g.operations+" × "+g.outputEach).join(" + ")||"—";
    return [
      num(row.depth),txt(row.itemId),txt(getName(row.itemId)),txt(parent),
      num(row.branchQuantity),num(row.totalRequired),
      row.output===null?txt(""):num(row.output),
      row.excess===null?txt(""):num(row.excess),
      row.batchSize===null?txt(""):num(row.batchSize),
      row.totalBatches===null?txt(""):num(row.totalBatches),
      row.operations===null?txt(""):num(row.operations),
      txt(operations),
      row.unitsPerParentBatch===null?txt(""):num(row.unitsPerParentBatch),
      row.parentBatches===null?txt(""):num(row.parentBatches),
      txt(consumption),txt(kind(row.mode,L)),
      txt(row.sharedReference?L.yes:L.no),
    ];
  });
  const scheduleRows=plan.steps.map(row=>[
    txt(row.itemId),txt(getName(row.itemId)),num(row.requested),num(row.output),
    num(row.batchSize),num(row.totalBatches),num(row.operations),
    num(row.maxOutputPerOperation),
    txt(row.operationGroups.map(g=>g.operations+" × "+g.outputEach).join(" + ")),
    num(row.excess),
  ]);
  const shoppingRows=plan.leaves.map((row,i)=>{
    const excelRow=i+6,price=String(prices[row.itemId]??"").trim();
    if(price&&!positive(price))throw new RangeError("Invalid price in shopping list");
    return [
      txt(row.itemId),txt(getName(row.itemId)),num(row.quantity),
      price?num(price):txt(""),
      formula('IF(D'+excelRow+'="","",C'+excelRow+'*D'+excelRow+')',3),
      txt(priceOrigins[row.itemId]==="client-npc-catalog"
        ?(locale==="pt"||locale==="pt-br"
          ?"Referência NPC do cliente (Market não verificado)"
          :L.npc??"Client NPC reference (Market unverified)")
        :price
          ?(locale==="pt"||locale==="pt-br"?"Preço informado pelo usuário":L.player??"Player-entered price")
          :(locale==="pt"||locale==="pt-br"?"Sem preço":L.unpriced??"Unpriced")),
    ];
  });
  const leftovers=plan.leftoverRows.length
    ?plan.leftoverRows.map(row=>[txt(row.itemId),txt(getName(row.itemId)),num(row.quantity)])
    :[[txt(""),txt(L.noExcess),txt("")]];
  const docs=[
    {name:L.tree,xml:sheetXml({
      title:L.tree,subtitle:summary,notice:sourceNote,headings:L.treeHeaders,
      rows:treeRows,depths:plan.tree.map(x=>x.depth),
      numericCols:[0,4,5,6,7,8,9,10,12,13],
      widths:[9,13,37,35,19,19,17,14,15,16,15,35,23,21,38,16,16],
    })},
    {name:L.schedule,xml:sheetXml({
      title:L.schedule,subtitle:summary,notice:sourceNote,headings:L.scheduleHeaders,
      rows:scheduleRows,numericCols:[2,3,4,5,6,7,9],
      widths:[14,38,18,18,16,16,16,22,39,16],tabColor:"73B5E7",
    })},
    {name:L.shopping,xml:sheetXml({
      title:L.shopping,subtitle:summary,notice:L.editNote,headings:L.shoppingHeaders,
      rows:shoppingRows,numericCols:[2,3,4],
      widths:[14,40,19,25,24,39],tabColor:"7DBDA3",
    })},
    {name:L.leftovers,xml:sheetXml({
      title:L.leftovers,subtitle:summary,notice:sourceNote,headings:L.leftoverHeaders,
      rows:leftovers,numericCols:[2],widths:[14,42,22],tabColor:"C598DE",
    })},
  ];
  const sheetRel='http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
  const styleRel='http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles';
  const wb='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
    '<bookViews><workbookView activeTab="0"/></bookViews><sheets>'+
    docs.map((doc,i)=>'<sheet name="'+esc(doc.name)+'" sheetId="'+(i+1)+
      '" r:id="rId'+(i+1)+'"/>').join("")+
    '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
  const wbRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    docs.map((doc,i)=>'<Relationship Id="rId'+(i+1)+'" Type="'+sheetRel+
      '" Target="worksheets/sheet'+(i+1)+'.xml"/>').join("")+
    '<Relationship Id="rId'+(docs.length+1)+'" Type="'+styleRel+'" Target="styles.xml"/>'+
    '</Relationships>';
  const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
    docs.map((doc,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+
      '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("")+
    '</Types>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'+
    '</Relationships>';
  return createStoredZip([
    {name:"[Content_Types].xml",data:types},
    {name:"_rels/.rels",data:rels},
    {name:"xl/workbook.xml",data:wb},
    {name:"xl/_rels/workbook.xml.rels",data:wbRels},
    {name:"xl/styles.xml",data:styles()},
    ...docs.map((doc,i)=>({name:"xl/worksheets/sheet"+(i+1)+".xml",data:doc.xml})),
  ]);
}
