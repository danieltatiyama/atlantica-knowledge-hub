import {LOCALE_IDS} from "./locales.mjs";
import {toolText,toolRows} from "./tools-ui.mjs";
export const craftingRows=[
  [
    "Plan ingredient requirements across multiple recipe levels using extracted client recipes. Equipment uses the confirmed gameplay rule: batch size 1, maximum 20 per operation. Other items use original client Unit values or explicit manual inputs.",
    "Planifiez les ingrédients sur plusieurs niveaux à partir des recettes du client. Équipement : règle confirmée, 1 par lot et 20 par opération. Autres objets : champ Unit original ou valeur manuelle explicite.",
    "Plane Zutaten über mehrere Rezeptstufen aus Clientrezepten. Ausrüstung: bestätigte Regel, 1 pro Batch und höchstens 20 pro Vorgang. Andere Gegenstände: originaler Unit-Wert oder manuelle Eingabe.",
    "Planifica ingredientes en varios niveles usando recetas del cliente. Equipamiento: regla confirmada, 1 por lote y máximo 20 por operación. Otros objetos: campo Unit original o valor manual explícito.",
    "클라이언트 제작법을 바탕으로 여러 단계의 재료를 계획합니다. 장비는 확인된 규칙에 따라 배치당 1개, 작업당 최대 20개입니다. 다른 아이템은 원본 Unit 값 또는 직접 입력값을 사용합니다.",
    "根据客户端配方规划多层材料。装备采用已确认规则：每批 1 件、每次最多 20 件。其他物品使用原始 Unit 值或明确手动输入。",
    "クライアントレシピから複数階層の素材を計画します。装備は確認済みルールで1バッチ1個、1操作最大20個です。他のアイテムは元のUnit値または手入力を使用します。"
  ],
  [
    "Item name or ItemID",
    "Nom de l’objet ou ItemID",
    "Gegenstandsname oder ItemID",
    "Nombre del objeto o ItemID",
    "아이템 이름 또는 ItemID",
    "物品名称或 ItemID",
    "アイテム名またはItemID"
  ],
  [
    "Search items with client recipes",
    "Rechercher des objets avec recette client",
    "Gegenstände mit Clientrezept suchen",
    "Buscar objetos con receta del cliente",
    "클라이언트 제작법이 있는 아이템 검색",
    "搜索具有客户端配方的物品",
    "クライアントレシピのあるアイテムを検索"
  ],
  [
    "Item suggestions",
    "Suggestions d’objets",
    "Gegenstandsvorschläge",
    "Sugerencias de objetos",
    "아이템 추천 목록",
    "物品建议",
    "アイテム候補"
  ],
  [
    "Desired output",
    "Quantité souhaitée",
    "Gewünschte Menge",
    "Cantidad deseada",
    "목표 생산량",
    "目标产量",
    "目標生産数"
  ],
  [
    "Calculate materials",
    "Calculer les matériaux",
    "Materialien berechnen",
    "Calcular materiales",
    "재료 계산",
    "计算材料",
    "素材を計算"
  ],
  [
    "Recipe variant",
    "Variante de recette",
    "Rezeptvariante",
    "Variante de receta",
    "제작법 유형",
    "配方变体",
    "レシピの種類"
  ],
  [
    "Choose a recipe",
    "Choisir une recette",
    "Rezept wählen",
    "Elegir receta",
    "제작법 선택",
    "选择配方",
    "レシピを選択"
  ],
  [
    "Batch size not in source: enter the minimum",
    "Lot absent de la source : saisir le minimum",
    "Batch fehlt in Quelle: Minimum eingeben",
    "Lote no registrado: introduce el mínimo",
    "원본 배치 수량 없음: 최솟값 입력",
    "来源无批量：输入最小值",
    "元データにバッチなし：最小値を入力"
  ],
  [
    "Craft quantity",
    "Quantité à fabriquer",
    "Herstellungsmenge",
    "Cantidad a fabricar",
    "제작 수량",
    "制作数量",
    "製造数量"
  ],
  [
    "Search shows items with recipes in the client files. This does not verify live-server availability.",
    "La recherche montre les objets avec recette dans les fichiers client. Elle ne confirme pas la disponibilité sur le serveur.",
    "Suche zeigt Gegenstände mit Rezepten in Clientdateien. Keine Bestätigung aktueller Serververfügbarkeit.",
    "La búsqueda muestra objetos con receta en archivos del cliente. No verifica disponibilidad en el servidor.",
    "클라이언트 파일에 제작법이 있는 아이템을 표시합니다. 실제 서버 이용 가능 여부는 미확인입니다.",
    "搜索显示客户端文件中有配方的物品，不确认正式服务器可用性。",
    "クライアントファイルにレシピがあるアイテムを表示します。実サーバーでの利用可否は未確認です。"
  ],
  [
    "Production plan",
    "Plan de production",
    "Produktionsplan",
    "Plan de producción",
    "생산 계획",
    "生产计划",
    "生産計画"
  ],
  [
    "Planned output",
    "Production prévue",
    "Geplante Ausgabe",
    "Producción prevista",
    "계획 생산량",
    "计划产量",
    "予定生産数"
  ],
  [
    "Total batches",
    "Nombre total de lots",
    "Gesamtbatches",
    "Total de lotes",
    "총 배치 수",
    "总批数",
    "総バッチ数"
  ],
  [
    "Total operations",
    "Nombre total d’opérations",
    "Gesamtvorgänge",
    "Total de operaciones",
    "총 작업 수",
    "总操作次数",
    "総操作数"
  ],
  [
    "Shopping list items",
    "Articles de la liste d’achat",
    "Einkaufslistenpositionen",
    "Artículos de compra",
    "구매 목록 항목",
    "购物清单项目",
    "買い物リスト項目"
  ],
  [
    "Crafting tree",
    "Arbre de fabrication",
    "Herstellungsbaum",
    "Árbol de fabricación",
    "제작 트리",
    "制作树",
    "製造ツリー"
  ],
  [
    "Export spreadsheet (.xlsx)",
    "Exporter le classeur (.xlsx)",
    "Arbeitsmappe exportieren (.xlsx)",
    "Exportar hoja de cálculo (.xlsx)",
    "Excel 내보내기 (.xlsx)",
    "导出工作簿 (.xlsx)",
    "Excel出力 (.xlsx)"
  ],
  [
    "Expand all",
    "Tout développer",
    "Alles ausklappen",
    "Expandir todo",
    "모두 펼치기",
    "全部展开",
    "すべて展開"
  ],
  [
    "Collapse all",
    "Tout réduire",
    "Alles einklappen",
    "Contraer todo",
    "모두 접기",
    "全部折叠",
    "すべて折りたたむ"
  ],
  [
    "Colors distinguish levels. Operation breakdown shows output per operation; consumption breakdown shows ingredients used by each parent operation. Shared totals are counted once.",
    "Les couleurs distinguent les niveaux. La répartition des opérations indique la production par opération ; celle de consommation indique les ingrédients utilisés par chaque opération parente. Les totaux partagés ne sont comptés qu’une fois.",
    "Farben unterscheiden Ebenen. Vorgangsaufteilung zeigt Ausgaben je Vorgang; Verbrauchsaufteilung zeigt Zutaten je übergeordnetem Vorgang. Gemeinsame Summen werden einmal gezählt.",
    "Los colores distinguen niveles. El desglose de operaciones indica la producción por operación; el de consumo indica los ingredientes usados en cada operación superior. Los totales compartidos se cuentan una vez.",
    "색상은 깊이를 구분합니다. 작업별 생산량과 상위 제작 작업별 재료 소비량을 표시합니다. 공유 재료 합계는 한 번만 계산합니다.",
    "颜色区分层级。操作拆分显示每次产量；消耗拆分显示每次上级操作所用材料。共享总量只计一次。",
    "色で階層を区別します。操作内訳は各操作の生産数、消費内訳は親操作ごとの素材消費数を示します。共有合計は一度だけ計上します。"
  ],
  [
    "Crafting table with horizontal scrolling and column snapping",
    "Table de fabrication à défilement horizontal avec alignement des colonnes",
    "Herstellungstabelle mit horizontalem Scrollen und Spaltenrastung",
    "Tabla de fabricación con desplazamiento horizontal y ajuste de columnas",
    "가로 스크롤 및 열 맞춤 제작 표",
    "支持横向滚动和列对齐的制作表",
    "横スクロールと列スナップ対応の製造表"
  ],
  [
    "Item / Recipe",
    "Objet / recette",
    "Gegenstand / Rezept",
    "Objeto / receta",
    "아이템 / 제작법",
    "物品 / 配方",
    "アイテム / レシピ"
  ],
  [
    "Branch need",
    "Besoin de la branche",
    "Zweigbedarf",
    "Necesidad de rama",
    "분기 필요량",
    "分支需求",
    "分岐必要数"
  ],
  [
    "Total needed",
    "Besoin total",
    "Gesamtbedarf",
    "Total necesario",
    "총 필요량",
    "总需求",
    "総必要数"
  ],
  [
    "To produce",
    "À produire",
    "Zu produzieren",
    "A producir",
    "생산량",
    "待产出",
    "生産数"
  ],
  [
    "Per batch",
    "Par lot",
    "Pro Batch",
    "Por lote",
    "배치당",
    "每批",
    "バッチあたり"
  ],
  [
    "Batches",
    "Lots",
    "Batches",
    "Lotes",
    "배치 수",
    "批数",
    "バッチ数"
  ],
  [
    "Operations",
    "Opérations",
    "Vorgänge",
    "Operaciones",
    "작업 수",
    "操作次数",
    "操作数"
  ],
  [
    "Operation breakdown",
    "Répartition des opérations",
    "Vorgangsaufteilung",
    "Desglose de operaciones",
    "작업별 생산량",
    "操作拆分",
    "操作内訳"
  ],
  [
    "Consumption breakdown",
    "Répartition de la consommation",
    "Verbrauchsaufteilung",
    "Desglose de consumo",
    "소비량 내역",
    "消耗拆分",
    "消費内訳"
  ],
  [
    "Action",
    "Action",
    "Aktion",
    "Acción",
    "작업",
    "操作",
    "操作"
  ],
  [
    "PRODUCTION PLAN",
    "PLAN DE PRODUCTION",
    "PRODUKTIONSPLAN",
    "PLAN DE PRODUCCIÓN",
    "생산 계획",
    "生产计划",
    "生産計画"
  ],
  [
    "Craft schedule",
    "Ordre de fabrication",
    "Herstellungsablauf",
    "Programa de fabricación",
    "제작 일정",
    "制作安排",
    "製造手順"
  ],
  [
    "Whole batches and units per operation, including crafted intermediate products.",
    "Lots entiers et unités par opération, y compris les produits intermédiaires fabriqués.",
    "Ganze Batches und Einheiten pro Vorgang, einschließlich hergestellter Zwischenprodukte.",
    "Lotes completos y unidades por operación, incluidos productos intermedios fabricados.",
    "중간 제작품을 포함한 전체 배치 및 작업당 수량입니다.",
    "完整批次及每次操作产量，包括制作的中间产品。",
    "中間製造品を含む全バッチと操作あたりの個数。"
  ],
  [
    "Product",
    "Produit",
    "Produkt",
    "Producto",
    "생산품",
    "产品",
    "生産品"
  ],
  [
    "Required",
    "Requis",
    "Benötigt",
    "Necesario",
    "필요량",
    "所需",
    "必要数"
  ],
  [
    "To craft",
    "À fabriquer",
    "Herzustellen",
    "A fabricar",
    "제작량",
    "待制作",
    "製造数"
  ],
  [
    "Limit/op.",
    "Limite/op.",
    "Limit/Vorgang",
    "Límite/op.",
    "작업당 한도",
    "单次上限",
    "操作上限"
  ],
  [
    "Excess",
    "Excédent",
    "Überschuss",
    "Excedente",
    "초과량",
    "多余",
    "余剰"
  ],
  [
    "Each recipe in the tree respects its own per-operation production limit.",
    "Chaque recette respecte sa propre limite par opération.",
    "Jedes Rezept im Baum hält sein eigenes Vorgangslimit ein.",
    "Cada receta del árbol respeta su límite por operación.",
    "트리의 각 제작법은 고유 작업당 한도를 따릅니다.",
    "树中每个配方遵循各自单次产量上限。",
    "各レシピは独自の操作上限に従います。"
  ],
  [
    "CONSOLIDATED MATERIALS",
    "MATÉRIAUX CONSOLIDÉS",
    "ZUSAMMENGEFASSTE MATERIALIEN",
    "MATERIALES CONSOLIDADOS",
    "통합 재료",
    "汇总材料",
    "集約素材"
  ],
  [
    "Shopping list",
    "Liste d’achat",
    "Einkaufsliste",
    "Lista de compras",
    "구매 목록",
    "购物清单",
    "買い物リスト"
  ],
  [
    "Final ingredients combined across all branches without double-counting.",
    "Ingrédients finaux combinés sans double comptage.",
    "Endzutaten aus allen Zweigen ohne Doppelzählung.",
    "Ingredientes finales combinados sin doble conteo.",
    "모든 분기의 최종 재료를 중복 없이 합산합니다.",
    "汇总全部分支的最终材料，不重复计数。",
    "全分岐の最終素材を二重計上せず集約します。"
  ],
  [
    "Copy list",
    "Copier la liste",
    "Liste kopieren",
    "Copiar lista",
    "목록 복사",
    "复制清单",
    "リストをコピー"
  ],
  [
    "Export CSV",
    "Exporter CSV",
    "CSV exportieren",
    "Exportar CSV",
    "CSV 내보내기",
    "导出 CSV",
    "CSV出力"
  ],
  [
    "Show client references",
    "Afficher les références client",
    "Clientreferenzen anzeigen",
    "Mostrar referencias del cliente",
    "클라이언트 참고 가격 표시",
    "显示客户端参考价",
    "クライアント参考価格を表示"
  ],
  [
    "Fill only empty prices",
    "Remplir uniquement les prix vides",
    "Nur leere Preise ausfüllen",
    "Rellenar solo precios vacíos",
    "빈 가격만 채우기",
    "仅填充空白价格",
    "空欄の価格のみ入力"
  ],
  [
    "Client NPC trade table prices: optional references, not verified fixed offers in the live Market. Manual prices take priority.",
    "Prix NPC du client : références facultatives, pas des offres fixes vérifiées du marché actuel. Les prix manuels sont prioritaires.",
    "NPC-Preise des Clients: optionale Referenzen, keine bestätigten Festangebote im Live-Markt. Manuelle Preise haben Vorrang.",
    "Precios NPC del cliente: referencias opcionales, no ofertas fijas verificadas del mercado actual. Los precios manuales tienen prioridad.",
    "클라이언트 NPC 거래 가격은 선택 참고값이며 실제 시장 고정 가격으로 확인되지 않았습니다. 직접 입력 가격을 우선합니다.",
    "客户端 NPC 交易价格仅为可选参考，并非正式市场已验证固定报价。手动价格优先。",
    "クライアントNPC取引価格は任意の参考値で、実市場の確認済み固定価格ではありません。手入力価格を優先します。"
  ],
  [
    "Material",
    "Matériau",
    "Material",
    "Material",
    "재료",
    "材料",
    "素材"
  ],
  [
    "Quantity",
    "Quantité",
    "Menge",
    "Cantidad",
    "수량",
    "数量",
    "数量"
  ],
  [
    "Unit price",
    "Prix unitaire",
    "Stückpreis",
    "Precio unitario",
    "단가",
    "单价",
    "単価"
  ],
  [
    "Cost",
    "Coût",
    "Kosten",
    "Coste",
    "비용",
    "成本",
    "費用"
  ],
  [
    "Completed",
    "Terminé",
    "Abgeschlossen",
    "Completado",
    "완료",
    "已完成",
    "完了"
  ],
  [
    "Items marked done, with their dependencies removed from pending work. Shared materials remain wherever other unfinished recipes need them.",
    "Objets terminés : leurs dépendances sont retirées du travail en attente. Les matériaux partagés restent requis par les autres recettes non terminées.",
    "Abgeschlossene Gegenstände samt Abhängigkeiten werden aus offenen Aufgaben entfernt. Gemeinsame Materialien bleiben für andere offene Rezepte erhalten.",
    "Los objetos completados y sus dependencias se retiran del trabajo pendiente. Los materiales compartidos siguen donde otras recetas pendientes los necesiten.",
    "완료한 아이템과 의존 재료는 대기 작업에서 제외합니다. 다른 미완료 제작법에 필요한 공유 재료는 유지합니다.",
    "已完成物品及依赖从待办中移除。其他未完成配方仍需的共享材料保留。",
    "完了アイテムと依存素材は未完了作業から除外します。他の未完了レシピに必要な共有素材は残ります。"
  ],
  [
    "Undo all",
    "Tout annuler",
    "Alles rückgängig machen",
    "Deshacer todo",
    "모두 되돌리기",
    "全部撤销",
    "すべて元に戻す"
  ],
  [
    "Batch leftovers",
    "Excédents de lots",
    "Batchüberschüsse",
    "Sobrantes de lotes",
    "배치 잔여량",
    "批次剩余",
    "バッチ余剰"
  ],
  [
    "ItemType*.ndt may contain historical or disabled recipes. No missing recipes, batches or prices are invented. Equipment: up to 20 output units per operation. Other items: up to 10,000 output units and no more than 10,000 of each ingredient per operation. These are player-reported limits.",
    "ItemType*.ndt peut contenir des recettes historiques ou désactivées. Aucune recette, quantité de lot ni prix manquant n’est inventé. Équipement : 20 unités maximum par opération. Autres objets : 10 000 unités produites et 10 000 de chaque ingrédient maximum par opération. Limites signalées par un joueur.",
    "ItemType*.ndt kann historische oder deaktivierte Rezepte enthalten. Fehlende Rezepte, Batches oder Preise werden nicht erfunden. Ausrüstung: höchstens 20 Ausgaben je Vorgang. Andere Gegenstände: höchstens 10.000 Ausgaben und 10.000 je Zutat pro Vorgang. Spielerberichtete Limits.",
    "ItemType*.ndt puede contener recetas históricas o desactivadas. No se inventan recetas, lotes ni precios ausentes. Equipo: máximo 20 unidades por operación. Otros objetos: máximo 10.000 unidades producidas y 10.000 de cada ingrediente por operación. Límites reportados por un jugador.",
    "ItemType*.ndt에는 과거 또는 비활성 제작법이 포함될 수 있습니다. 누락 제작법, 배치, 가격을 임의로 생성하지 않습니다. 장비는 작업당 최대 20개, 기타 아이템은 생산량과 각 재료 소비량 각각 최대 10,000개입니다. 플레이어 보고 한도입니다.",
    "ItemType*.ndt 可能包含历史或停用配方。不虚构缺失配方、批量或价格。装备单次最多 20 件；其他物品单次产量及每种材料消耗均不超过 10,000。此为玩家报告上限。",
    "ItemType*.ndtには過去・無効化されたレシピが含まれる場合があります。不明なレシピ、バッチ、価格を捏造しません。装備は操作あたり最大20個、その他は生産数と各素材消費数がそれぞれ最大10,000個です。プレイヤー報告の上限です。"
  ],
  [
    "Confirmed equipment rule",
    "Règle équipement confirmée",
    "Bestätigte Ausrüstungsregel",
    "Regla de equipo confirmada",
    "확인된 장비 규칙",
    "已确认装备规则",
    "確認済み装備ルール"
  ],
  [
    "Client source batch",
    "Lot source du client",
    "Client-Quellbatch",
    "Lote de origen del cliente",
    "클라이언트 원본 배치",
    "客户端原始批量",
    "クライアント元バッチ"
  ],
  [
    "Manually specified batch",
    "Lot saisi manuellement",
    "Manuell eingegebener Batch",
    "Lote indicado manualmente",
    "직접 입력 배치",
    "手动指定批量",
    "手入力バッチ"
  ],
  [
    " units/batch · select multiples up to ",
    " unités/lot · multiples jusqu’à ",
    " Einheiten/Batch · Vielfache bis ",
    " unidades/lote · múltiplos hasta ",
    "개/배치 · 배수 선택 최대 ",
    " 件/批 · 选择倍数至 ",
    "個/バッチ · 倍数選択上限 "
  ],
  [
    " (planning limit: 10,000).",
    " (limite de planification : 10 000).",
    " (Planungslimit: 10.000).",
    " (límite de planificación: 10.000).",
    " (계획 한도: 10,000).",
    "（规划上限：10,000）。",
    "（計画上限：10,000）。"
  ],
  [
    "Selection ready to calculate.",
    "Sélection prête pour le calcul.",
    "Auswahl bereit zur Berechnung.",
    "Selección lista para calcular.",
    "계산할 준비가 되었습니다.",
    "已准备计算。",
    "計算の準備ができました。"
  ],
  [
    "Choose a recipe variant before setting the quantity.",
    "Choisissez une variante avant de définir la quantité.",
    "Rezeptvariante vor der Menge wählen.",
    "Elige una variante antes de fijar cantidad.",
    "수량 설정 전 제작법을 선택하세요.",
    "设置数量前请选择配方变体。",
    "数量設定前にレシピを選択してください。"
  ],
  [
    "Client source has no reliable batch size. Enter the minimum crafting quantity to enable the slider.",
    "Le client ne fournit pas de lot fiable. Saisissez la quantité minimale pour activer le curseur.",
    "Clientquelle hat keine verlässliche Batchgröße. Mindestmenge eingeben, um den Regler zu aktivieren.",
    "El cliente no tiene lote fiable. Introduce la cantidad mínima para activar el control.",
    "원본 배치 수량이 불확실합니다. 슬라이더 활성화를 위해 최소 제작량을 입력하세요.",
    "客户端无可靠批量。输入最小制作数量以启用滑块。",
    "信頼できるバッチ数がありません。スライダーを有効にするには最小製造数を入力してください。"
  ],
  [
    "No legal crafting quantity up to 10,000 for this source recipe.",
    "Aucune quantité valide jusqu’à 10 000 pour cette recette.",
    "Keine gültige Herstellungsmenge bis 10.000 für dieses Rezept.",
    "No hay cantidad válida hasta 10.000 para esta receta.",
    "이 제작법에는 10,000 이하의 유효 제작량이 없습니다.",
    "此配方无 10,000 以内的有效制作数量。",
    "このレシピには10,000以下の有効な製造数がありません。"
  ],
  [
    "Checking the original client recipe…",
    "Vérification de la recette originale…",
    "Originalrezept wird geprüft…",
    "Comprobando receta original…",
    "원본 제작법 확인 중…",
    "正在检查原始配方…",
    "元レシピを確認中…"
  ],
  [
    "This item has no parsed recipe in the client files.",
    "Aucune recette analysée pour cet objet dans les fichiers client.",
    "Kein geparstes Rezept für diesen Gegenstand in Clientdateien.",
    "Este objeto no tiene receta analizada en los archivos del cliente.",
    "클라이언트 파일에 해석된 제작법이 없습니다.",
    "此物品在客户端文件中无已解析配方。",
    "このアイテムに解析済みのクライアントレシピがありません。"
  ],
  [
    "No valid parsed source recipe for this ItemID.",
    "Aucune recette source valide pour cet ItemID.",
    "Kein gültiges geparstes Quellrezept für diese ItemID.",
    "No hay receta original válida para este ItemID.",
    "이 ItemID의 유효한 원본 제작법이 없습니다.",
    "此 ItemID 无有效已解析来源配方。",
    "このItemIDに有効な解析済み元レシピがありません。"
  ],
  [
    "Select recipe",
    "Sélectionner la recette",
    "Rezept auswählen",
    "Seleccionar receta",
    "제작법 선택",
    "选择配方",
    "レシピを選択"
  ],
  [
    "Recipe ",
    "Recette ",
    "Rezept ",
    "Receta ",
    "제작법 ",
    "配方 ",
    "レシピ "
  ],
  [
    "Selection unavailable: ",
    "Sélection indisponible : ",
    "Auswahl nicht verfügbar: ",
    "Selección no disponible: ",
    "선택 불가: ",
    "选择不可用：",
    "選択不可："
  ],
  [
    "No items with parsed recipes found.",
    "Aucun objet avec recette analysée trouvé.",
    "Keine Gegenstände mit geparsten Rezepten gefunden.",
    "No se encontraron objetos con recetas analizadas.",
    "해석된 제작법이 있는 아이템을 찾지 못했습니다.",
    "未找到具有已解析配方的物品。",
    "解析済みレシピのあるアイテムが見つかりません。"
  ],
  [
    "Could not load the item index.",
    "Impossible de charger l’index d’objets.",
    "Gegenstandsindex konnte nicht geladen werden.",
    "No se pudo cargar el índice de objetos.",
    "아이템 인덱스를 불러오지 못했습니다.",
    "无法加载物品索引。",
    "アイテム索引を読み込めませんでした。"
  ],
  [
    "Invalid quantity: use exact full-batch multiples within the allowed range.",
    "Quantité invalide : utilisez des multiples de lots entiers dans la plage autorisée.",
    "Ungültige Menge: vollständige Batchvielfache im erlaubten Bereich verwenden.",
    "Cantidad inválida: usa múltiplos exactos del lote dentro del rango permitido.",
    "잘못된 수량: 허용 범위 내 정확한 배치 배수를 사용하세요.",
    "数量无效：使用允许范围内的完整批次倍数。",
    "数量が無効です。許容範囲内の正確なバッチ倍数を使用してください。"
  ],
  [
    "Previously applied NPC reference; not Market verified.",
    "Référence NPC appliquée précédemment ; non vérifiée sur le marché.",
    "Zuvor übernommener NPC-Referenzpreis; Markt ungeprüft.",
    "Referencia NPC aplicada previamente; mercado no verificado.",
    "이전에 적용된 NPC 참고값이며 시장 미검증입니다.",
    "之前应用的 NPC 参考价；市场未验证。",
    "以前適用したNPC参考値。市場未確認。"
  ],
  [
    "NPC reference: ",
    "Référence NPC : ",
    "NPC-Referenz: ",
    "Referencia NPC: ",
    "NPC 참고값: ",
    "NPC 参考价：",
    "NPC参考値："
  ],
  [
    "Unit price from client NPC trade catalog. Not a verified live fixed Market price.",
    "Prix unitaire du catalogue NPC client. Pas un prix fixe vérifié du marché actuel.",
    "Stückpreis aus Client-NPC-Handelskatalog. Kein bestätigter Live-Marktpreis.",
    "Precio unitario del catálogo NPC del cliente. No es un precio fijo verificado del mercado actual.",
    "클라이언트 NPC 거래 목록의 단가입니다. 실제 시장 고정 가격은 미확인입니다.",
    "客户端 NPC 交易目录单价，并非已验证正式市场固定价。",
    "クライアントNPC取引一覧の単価です。実市場の確認済み固定価格ではありません。"
  ],
  [
    "Use",
    "Utiliser",
    "Übernehmen",
    "Usar",
    "적용",
    "使用",
    "適用"
  ],
  [
    "Use unverified NPC price for ",
    "Utiliser le prix NPC non vérifié pour ",
    "Ungeprüften NPC-Preis übernehmen für ",
    "Usar precio NPC no verificado para ",
    "미검증 NPC 가격 적용: ",
    "应用未验证 NPC 价格：",
    "未確認NPC価格を適用："
  ],
  [
    "Total estimated cost",
    "Coût total estimé",
    "Geschätzte Gesamtkosten",
    "Coste total estimado",
    "총 예상 비용",
    "估算总成本",
    "推定総費用"
  ],
  [
    "Known cost (partial)",
    "Coût connu (partiel)",
    "Bekannte Kosten (teilweise)",
    "Coste conocido (parcial)",
    "확인된 비용 (일부)",
    "已知成本（部分）",
    "判明費用（部分）"
  ],
  [
    "All materials priced",
    "Tous les matériaux ont un prix",
    "Alle Materialien bepreist",
    "Todos los materiales con precio",
    "모든 재료 가격 입력됨",
    "所有材料已有价格",
    "全素材の価格設定済み"
  ],
  [
    " unpriced",
    " sans prix",
    " ohne Preis",
    " sin precio",
    "개 가격 미입력",
    " 项未定价",
    "件価格未設定"
  ],
  [
    "Expand/collapse ",
    "Développer/réduire ",
    "Aus-/einklappen: ",
    "Expandir/contraer ",
    "펼치기/접기: ",
    "展开/折叠 ",
    "展開/折りたたみ："
  ],
  [
    "Shared",
    "Partagé",
    "Gemeinsam",
    "Compartido",
    "공유",
    "共享",
    "共有"
  ],
  [
    "Another reference to the same ItemID; total demand is calculated only once.",
    "Autre référence au même ItemID ; besoin total calculé une seule fois.",
    "Weitere Referenz zur gleichen ItemID; Gesamtbedarf nur einmal berechnet.",
    "Otra referencia al mismo ItemID; demanda total calculada una vez.",
    "같은 ItemID의 다른 참조이며 총 필요량은 한 번만 계산합니다.",
    "同一 ItemID 的另一引用；总需求只计算一次。",
    "同じItemIDの別参照。総必要数は一度だけ計算します。"
  ],
  [
    " +",
    " +",
    " +",
    " +",
    " +",
    " +",
    " +"
  ],
  [
    " excess",
    " excédent",
    " Überschuss",
    " excedente",
    "개 초과",
    " 件多余",
    "個余剰"
  ],
  [
    "Output units per operation; effective maximum: ",
    "Unités produites par opération ; maximum effectif : ",
    "Ausgabeeinheiten je Vorgang; effektives Maximum: ",
    "Unidades producidas por operación; máximo efectivo: ",
    "작업당 생산량; 실제 최대: ",
    "每次操作产量；有效上限：",
    "操作あたり生産数、実効上限："
  ],
  [
    "ingredient limit: ",
    "limite d’ingrédients : ",
    "Zutatenlimit: ",
    "límite de ingredientes: ",
    "재료 한도: ",
    "材料上限：",
    "素材上限："
  ],
  [
    "Consumption per operation of ",
    "Consommation par opération de ",
    "Verbrauch pro Vorgang von ",
    "Consumo por operación de ",
    "작업당 소비량: ",
    "每次操作消耗：",
    "操作あたり消費数："
  ],
  [
    " per parent batch × ",
    " par lot parent × ",
    " pro Elternbatch × ",
    " por lote superior × ",
    " / 상위 배치 × ",
    " / 上级批次 × ",
    " / 親バッチ × "
  ],
  [
    " batches = ",
    " lots = ",
    " Batches = ",
    " lotes = ",
    " 배치 = ",
    " 批 = ",
    " バッチ = "
  ],
  [
    " units total.",
    " unités au total.",
    " Einheiten insgesamt.",
    " unidades en total.",
    "개 합계.",
    " 件合计。",
    "個合計。"
  ],
  [
    "Craft",
    "Fabriquer",
    "Herstellen",
    "Fabricar",
    "제작",
    "制作",
    "製造"
  ],
  [
    "Buy",
    "Acheter",
    "Kaufen",
    "Comprar",
    "구매",
    "购买",
    "購入"
  ],
  [
    "Craft ",
    "Fabriquer ",
    "Herstellen: ",
    "Fabricar ",
    "제작: ",
    "制作 ",
    "製造："
  ],
  [
    "Buy ",
    "Acheter ",
    "Kaufen: ",
    "Comprar ",
    "구매: ",
    "购买 ",
    "購入："
  ],
  [
    "Pending",
    "En attente",
    "Offen",
    "Pendiente",
    "대기 중",
    "待完成",
    "未完了"
  ],
  [
    "Done",
    "Terminé",
    "Erledigt",
    "Completado",
    "완료",
    "已完成",
    "完了"
  ],
  [
    "Mark done: ",
    "Marquer terminé : ",
    "Als erledigt markieren: ",
    "Marcar completado: ",
    "완료 표시: ",
    "标为完成：",
    "完了にする："
  ],
  [
    "Mark this ItemID fulfilled, including its dependencies.",
    "Marquer cet ItemID comme satisfait, avec ses dépendances.",
    "Diese ItemID samt Abhängigkeiten als erfüllt markieren.",
    "Marcar este ItemID satisfecho, incluidas sus dependencias.",
    "이 ItemID 및 의존 재료를 완료 처리합니다.",
    "将此 ItemID 及依赖标为已满足。",
    "このItemIDと依存素材を完了済みにします。"
  ],
  [
    " units fulfilled",
    " unités satisfaites",
    " Einheiten erfüllt",
    " unidades satisfechas",
    "개 완료",
    " 件已满足",
    "個完了"
  ],
  [
    "Undo",
    "Annuler",
    "Rückgängig",
    "Deshacer",
    "되돌리기",
    "撤销",
    "元に戻す"
  ],
  [
    "Undo completion: ",
    "Annuler la validation : ",
    "Abschluss rückgängig: ",
    "Deshacer finalización: ",
    "완료 취소: ",
    "撤销完成：",
    "完了を取り消す："
  ],
  [
    "units",
    "unités",
    "Einheiten",
    "unidades",
    "개",
    "件",
    "個"
  ],
  [
    "Preparing Excel workbook…",
    "Préparation du classeur Excel…",
    "Excel-Arbeitsmappe wird vorbereitet…",
    "Preparando libro de Excel…",
    "Excel 파일 준비 중…",
    "正在准备 Excel 工作簿…",
    "Excelブックを準備中…"
  ],
  [
    "Excel workbook exported.",
    "Classeur Excel exporté.",
    "Excel-Arbeitsmappe exportiert.",
    "Libro de Excel exportado.",
    "Excel 파일을 내보냈습니다.",
    "Excel 工作簿已导出。",
    "Excelブックを出力しました。"
  ],
  [
    "Workbook export failed: ",
    "Échec de l’export : ",
    "Arbeitsmappenexport fehlgeschlagen: ",
    "Error al exportar: ",
    "Excel 내보내기 실패: ",
    "工作簿导出失败：",
    "Excel出力失敗："
  ],
  [
    "Loading client NPC reference prices…",
    "Chargement des prix de référence NPC…",
    "NPC-Referenzpreise werden geladen…",
    "Cargando precios de referencia NPC…",
    "NPC 참고 가격 불러오는 중…",
    "正在加载 NPC 参考价格…",
    "NPC参考価格を読み込み中…"
  ],
  [
    "421 NPC reference prices available. No prices applied automatically.",
    "421 prix NPC disponibles. Aucun prix appliqué automatiquement.",
    "421 NPC-Referenzpreise verfügbar. Keine automatisch übernommen.",
    "421 precios NPC disponibles. No se aplicaron automáticamente.",
    "NPC 참고 가격 421개 사용 가능. 자동 적용하지 않았습니다.",
    "421 条 NPC 参考价格可用。未自动应用价格。",
    "421件のNPC参考価格が利用可能です。自動適用していません。"
  ],
  [
    "References unavailable: ",
    "Références indisponibles : ",
    "Referenzen nicht verfügbar: ",
    "Referencias no disponibles: ",
    "참고값 사용 불가: ",
    "参考价不可用：",
    "参考値を利用できません："
  ],
  [
    "cost ",
    "coût ",
    "Kosten ",
    "coste ",
    "비용 ",
    "成本 ",
    "費用 "
  ],
  [
    "Shopping list copied.",
    "Liste d’achat copiée.",
    "Einkaufsliste kopiert.",
    "Lista de compras copiada.",
    "구매 목록을 복사했습니다.",
    "购物清单已复制。",
    "買い物リストをコピーしました。"
  ],
  [
    "Copy unavailable.",
    "Copie indisponible.",
    "Kopieren nicht verfügbar.",
    "No se pudo copiar.",
    "복사할 수 없습니다.",
    "无法复制。",
    "コピーできません。"
  ],
  [
    "Target item",
    "Objet cible",
    "Zielgegenstand",
    "Objeto objetivo",
    "목표 아이템",
    "目标物品",
    "目標アイテム"
  ],
  [
    "Manual batch",
    "Lot manuel",
    "Manueller Batch",
    "Lote manual",
    "수동 배치",
    "手动批量",
    "手入力バッチ"
  ],
  [
    "Limited by 10,000 of each ingredient per operation: ",
    "Limité à 10 000 de chaque ingrédient par opération : ",
    "Begrenzt durch 10.000 je Zutat und Vorgang: ",
    "Limitado a 10.000 de cada ingrediente por operación: ",
    "작업당 각 재료 10,000개 제한: ",
    "每次操作每种材料限 10,000：",
    "操作ごとに各素材10,000個の制限："
  ],
  [
    "Enter price",
    "Saisir le prix",
    "Preis eingeben",
    "Introducir precio",
    "가격 입력",
    "输入价格",
    "価格を入力"
  ],
  [
    "Unit price ",
    "Prix unitaire ",
    "Stückpreis: ",
    "Precio unitario ",
    "단가: ",
    "单价：",
    "単価："
  ],
  [
    "Invalid price.",
    "Prix invalide.",
    "Ungültiger Preis.",
    "Precio inválido.",
    "잘못된 가격입니다.",
    "价格无效。",
    "価格が無効です。"
  ],
  [
    "Plan calculated using the selected source recipes.",
    "Plan calculé avec les recettes source sélectionnées.",
    "Plan mit ausgewählten Quellrezepten berechnet.",
    "Plan calculado con recetas originales seleccionadas.",
    "선택한 원본 제작법으로 계획을 계산했습니다.",
    "已按所选原始配方计算计划。",
    "選択した元レシピで計画を計算しました。"
  ],
  [
    "Partial plan: review recipe and batch questions below.",
    "Plan partiel : vérifiez les questions de recettes et lots ci-dessous.",
    "Teilplan: offene Rezept- und Batchfragen unten prüfen.",
    "Plan parcial: revisa las preguntas de recetas y lotes.",
    "부분 계획: 아래 제작법 및 배치 확인 사항을 검토하세요.",
    "部分计划：请检查下方配方和批量问题。",
    "部分計画です。下のレシピ・バッチに関する確認事項をご覧ください。"
  ],
  [
    "Choose the original recipe variant:",
    "Choisissez la variante originale :",
    "Originale Rezeptvariante wählen:",
    "Elige la variante original:",
    "원본 제작법 유형 선택:",
    "选择原始配方变体：",
    "元レシピの種類を選択："
  ],
  [
    "Select a recipe",
    "Sélectionner une recette",
    "Rezept auswählen",
    "Seleccionar receta",
    "제작법 선택",
    "选择配方",
    "レシピを選択"
  ],
  [
    "This recipe requires over 10,000 of an ingredient in a single batch. No valid operation exists with the original client amounts.",
    "Cette recette dépasse 10 000 unités d’un ingrédient par lot. Aucune opération valide avec les quantités originales.",
    "Dieses Rezept benötigt über 10.000 einer Zutat je Batch. Kein gültiger Vorgang mit Originalmengen.",
    "Esta receta exige más de 10.000 de un ingrediente por lote. No existe operación válida con las cantidades originales.",
    "이 제작법은 한 배치에 재료 10,000개를 초과합니다. 원본 수량으로 유효한 작업을 구성할 수 없습니다.",
    "此配方单批某材料超过 10,000。按原始用量无法进行有效操作。",
    "このレシピは1バッチで素材10,000個を超えます。元の数量では有効な操作がありません。"
  ],
  [
    "Batch size missing or above 10,000. Supply units per batch manually (1–10,000).",
    "Lot absent ou supérieur à 10 000. Saisissez les unités par lot (1–10 000).",
    "Batch fehlt oder überschreitet 10.000. Einheiten pro Batch manuell eingeben (1–10.000).",
    "Lote ausente o superior a 10.000. Indica unidades por lote (1–10.000).",
    "배치 수량이 없거나 10,000 초과입니다. 배치당 수량(1~10,000)을 입력하세요.",
    "批量缺失或超过 10,000。手动输入每批数量（1–10,000）。",
    "バッチ数が不明または10,000超です。バッチあたりの数量（1～10,000）を入力してください。"
  ],
  [
    "Could not calculate: ",
    "Impossible de calculer : ",
    "Berechnung fehlgeschlagen: ",
    "No se pudo calcular: ",
    "계산 실패: ",
    "无法计算：",
    "計算できません："
  ],
  [
    "Select a valid source recipe and batch size.",
    "Sélectionnez une recette source et un lot valides.",
    "Gültiges Quellrezept und Batchgröße wählen.",
    "Selecciona receta original y lote válidos.",
    "유효한 원본 제작법과 배치를 선택하세요.",
    "选择有效原始配方和批量。",
    "有効な元レシピとバッチ数を選択してください。"
  ],
  [
    "Invalid quantity: enter an exact batch multiple up to 10,000.",
    "Quantité invalide : multiple exact du lot, maximum 10 000.",
    "Ungültige Menge: genaues Batchvielfaches bis 10.000 eingeben.",
    "Cantidad inválida: introduce un múltiplo exacto del lote hasta 10.000.",
    "잘못된 수량: 10,000 이하의 정확한 배치 배수를 입력하세요.",
    "数量无效：输入不超过 10,000 的完整批次倍数。",
    "数量が無効です。10,000以下の正確なバッチ倍数を入力してください。"
  ],
  [
    "Loading recipe dependencies…",
    "Chargement des dépendances de recettes…",
    "Rezeptabhängigkeiten werden geladen…",
    "Cargando dependencias de recetas…",
    "제작법 의존 재료 불러오는 중…",
    "正在加载配方依赖…",
    "レシピ依存素材を読み込み中…"
  ],
  [
    "Original recipe unavailable.",
    "Recette originale indisponible.",
    "Originalrezept nicht verfügbar.",
    "Receta original no disponible.",
    "원본 제작법 사용 불가.",
    "原始配方不可用。",
    "元レシピを利用できません。"
  ],
  [
    "Source data loaded.",
    "Données source chargées.",
    "Quelldaten geladen.",
    "Datos de origen cargados.",
    "원본 자료를 불러왔습니다.",
    "来源数据已加载。",
    "元データを読み込みました。"
  ],
  [
    "Error: ",
    "Erreur : ",
    "Fehler: ",
    "Error: ",
    "오류: ",
    "错误：",
    "エラー："
  ],
  [
    "This ItemID has no parsed source recipe.",
    "Cet ItemID n’a pas de recette source analysée.",
    "Diese ItemID hat kein geparstes Quellrezept.",
    "Este ItemID no tiene receta original analizada.",
    "이 ItemID에는 해석된 원본 제작법이 없습니다.",
    "此 ItemID 无已解析原始配方。",
    "このItemIDに解析済み元レシピがありません。"
  ],
  [
    "Could not load source recipe.",
    "Impossible de charger la recette source.",
    "Quellrezept konnte nicht geladen werden.",
    "No se pudo cargar la receta original.",
    "원본 제작법을 불러오지 못했습니다.",
    "无法加载原始配方。",
    "元レシピを読み込めませんでした。"
  ]
];
const map=new Map(craftingRows.map(row=>[row[0],row]));
export function craftingText(lang,key,pt=key){const i=LOCALE_IDS.indexOf(lang);return i>1&&map.has(key)?map.get(key)[i-1]:toolText(lang,key,pt);}
export const hasCraftingMessage=key=>map.has(key)||toolRows.some(row=>row[0]===key);
