import {LOCALE_IDS} from "./locales.mjs";
import {sharedText} from "./shared-ui.mjs";
// UI labels only; raw client names and category identifiers are not translated.
export const catalogRows=[
  [
    "Equipment Item Catalog",
    "Catálogo de Equipamentos",
    "Catalogue des équipements",
    "Ausrüstungskatalog",
    "Catálogo de equipamiento",
    "장비 도감",
    "装备图鉴",
    "装備図鑑"
  ],
  [
    "Explore 2,462 equipment-like source IDs: 551 reviewed profiles plus 1,911 additional client-source profiles.",
    "Explore 2.462 IDs em categorias de equipamento do cliente, com 551 fichas revisadas e 1.911 fichas adicionais com dados originais.",
    "Explorez 2 462 ID d’équipements du client : 551 fiches vérifiées et 1 911 fiches issues des données du client.",
    "Entdecke 2.462 ausrüstungsähnliche Client-IDs: 551 geprüfte und 1.911 zusätzliche Profile aus Clientdaten.",
    "Explora 2.462 ID de equipamiento del cliente: 551 fichas revisadas y 1.911 adicionales basadas en datos del cliente.",
    "장비 관련 ID 2,462개를 확인하세요. 검토된 정보 551개와 클라이언트 기반 정보 1,911개를 제공합니다.",
    "查看 2,462 个装备类客户端 ID：551 份已审核资料和 1,911 份额外客户端资料。",
    "装備関連ID 2,462件を収録。確認済みの551件とクライアントデータ由来の1,911件を掲載しています。"
  ],
  [
    "ITEM DATABASE",
    "BANCO DE DADOS",
    "BASE DE DONNÉES D’OBJETS",
    "GEGENSTANDSDATENBANK",
    "BASE DE DATOS DE OBJETOS",
    "아이템 데이터베이스",
    "物品数据库",
    "アイテムデータベース"
  ],
  [
    "This catalog now includes all 2,462 identified equipment-like source IDs. The original 551 profiles retain their reviewed evidence; the other 1,911 are client-source profiles, not live-server availability or equippability claims. Browse all 23,586 original IDs in the complete item database.",
    "O catálogo agora inclui todos os 2.462 IDs identificados nas categorias semelhantes a equipamentos. Os 551 perfis anteriores continuam revisados; os outros 1.911 são perfis gerados a partir das definições do cliente, sem confirmação de uso ou obtenção no servidor atual. Para os demais materiais e itens, use o banco completo de 23.586 IDs.",
    "Le catalogue couvre les 2 462 ID d’équipements identifiés. Les 551 fiches initiales restent vérifiées ; les 1 911 autres proviennent du client, sans garantie de disponibilité ou de possibilité d’équipement sur le serveur. La base complète contient 23 586 ID.",
    "Der Katalog umfasst alle 2.462 identifizierten ausrüstungsähnlichen IDs. Die 551 ursprünglichen Profile bleiben geprüft; 1.911 weitere stammen aus dem Client und belegen weder Verfügbarkeit noch Ausrüstbarkeit auf dem Server. Die vollständige Datenbank umfasst 23.586 IDs.",
    "El catálogo incluye los 2.462 ID de equipamiento identificados. Las 551 fichas originales conservan su revisión; las otras 1.911 proceden del cliente y no confirman disponibilidad ni posibilidad de equiparlas en el servidor. La base completa contiene 23.586 ID.",
    "이 도감에는 장비 관련 ID 2,462개가 모두 포함됩니다. 기존 551개 정보는 검토된 근거를 유지하며, 나머지 1,911개는 클라이언트 자료로서 실제 서버에서 획득하거나 착용할 수 있음을 보장하지 않습니다. 전체 아이템 DB에서 23,586개 ID를 확인할 수 있습니다.",
    "本图鉴收录全部 2,462 个已识别的装备类 ID。原有 551 份资料保留审核依据，其余 1,911 份来自客户端，不代表当前服务器可获取或可装备。完整物品数据库包含 23,586 个 ID。",
    "識別済みの装備関連ID 2,462件を収録しています。既存の551件は確認済み資料を維持し、残る1,911件はクライアント由来で、現行サーバーでの入手・装備可否を保証しません。全アイテムDBには23,586件のIDがあります。"
  ],
  [
    "Browse ALL 23,586 client item IDs",
    "Explorar TODOS os 23.586 IDs do cliente",
    "Parcourir les 23 586 ID d’objets",
    "Alle 23.586 Client-IDs durchsuchen",
    "Consultar los 23.586 ID de objetos",
    "전체 아이템 ID 23,586개 보기",
    "浏览全部 23,586 个物品 ID",
    "全23,586件のアイテムIDを見る"
  ],
  [
    "Explore Equipment Boxes",
    "Explorar Equipment Boxes",
    "Explorer les coffres d’équipement",
    "Ausrüstungstruhen ansehen",
    "Explorar cofres de equipamiento",
    "장비 상자 보기",
    "查看装备宝箱",
    "装備ボックスを見る"
  ],
  [
    "Research: Legendary enhancement (L)",
    "Pesquisa: encantamento lendário (L)",
    "Recherche : amélioration légendaire (L)",
    "Forschung: legendäre Verstärkung (L)",
    "Investigación: mejora legendaria (L)",
    "연구: 전설 강화 (L)",
    "研究：传说强化 (L)",
    "研究：レジェンド強化 (L)"
  ],
  [
    "Download CSV: 551 items × 11 grades",
    "Baixar tabela CSV: 551 equipamentos × 11 graus",
    "Télécharger le CSV : 551 objets × 11 grades",
    "CSV herunterladen: 551 Gegenstände × 11 Stufen",
    "Descargar CSV: 551 objetos × 11 grados",
    "CSV 다운로드: 아이템 551개 × 강화 11단계",
    "下载 CSV：551 件物品 × 11 个强化等级",
    "CSVダウンロード：551アイテム × 11強化段階"
  ],
  [
    "Search name or ID",
    "Pesquisar nome ou ID",
    "Rechercher par nom ou ID",
    "Name oder ID suchen",
    "Buscar por nombre o ID",
    "이름 또는 ID 검색",
    "搜索名称或 ID",
    "名前またはIDで検索"
  ],
  [
    "e.g. Judgment Sword or 47",
    "Ex.: Judgment Sword ou 47",
    "Ex. : Judgment Sword ou 47",
    "Z. B. Judgment Sword oder 47",
    "Ej.: Judgment Sword o 47",
    "예: Judgment Sword 또는 47",
    "例如：Judgment Sword 或 47",
    "例：Judgment Sword または 47"
  ],
  [
    "Client source category",
    "Categoria do arquivo",
    "Catégorie des fichiers client",
    "Kategorie der Clientdatei",
    "Categoría del archivo del cliente",
    "클라이언트 원본 분류",
    "客户端原始分类",
    "クライアント元データ分類"
  ],
  [
    "All categories",
    "Todas as categorias",
    "Toutes les catégories",
    "Alle Kategorien",
    "Todas las categorías",
    "모든 분류",
    "全部分类",
    "すべてのカテゴリ"
  ],
  [
    "Min. raw level",
    "Nível bruto mínimo",
    "Niveau brut min.",
    "Min. Rohlevel",
    "Nivel bruto mín.",
    "최소 원본 레벨",
    "最低原始等级",
    "最低元データレベル"
  ],
  [
    "Any level",
    "Qualquer nível",
    "Tous niveaux",
    "Beliebiges Level",
    "Cualquier nivel",
    "모든 레벨",
    "任意等级",
    "すべてのレベル"
  ],
  [
    "Profile evidence",
    "Tipo de ficha",
    "Type de fiche",
    "Profilnachweis",
    "Tipo de ficha",
    "정보 근거 유형",
    "资料依据类型",
    "情報の根拠"
  ],
  [
    "All 2,462 source IDs",
    "Todos os 2.462 IDs",
    "Les 2 462 ID source",
    "Alle 2.462 Quell-IDs",
    "Los 2.462 ID de origen",
    "전체 원본 ID 2,462개",
    "全部 2,462 个来源 ID",
    "全2,462件の元ID"
  ],
  [
    "551 reviewed profiles",
    "551 perfis revisados",
    "551 fiches vérifiées",
    "551 geprüfte Profile",
    "551 fichas revisadas",
    "검토된 정보 551개",
    "551 份已审核资料",
    "確認済み551件"
  ],
  [
    "1,911 client-source profiles",
    "1.911 perfis do cliente",
    "1 911 fiches issues du client",
    "1.911 Clientprofile",
    "1.911 fichas del cliente",
    "클라이언트 기반 정보 1,911개",
    "1,911 份客户端资料",
    "クライアント由来1,911件"
  ],
  [
    "Sort by",
    "Ordenar por",
    "Trier par",
    "Sortieren nach",
    "Ordenar por",
    "정렬 기준",
    "排序方式",
    "並び替え"
  ],
  [
    "Name A–Z",
    "Nome A–Z",
    "Nom A–Z",
    "Name A–Z",
    "Nombre A–Z",
    "이름 A–Z",
    "名称 A–Z",
    "名前 A–Z"
  ],
  [
    "Raw level ↑",
    "Nível bruto ↑",
    "Niveau brut ↑",
    "Rohlevel ↑",
    "Nivel bruto ↑",
    "원본 레벨 ↑",
    "原始等级 ↑",
    "元データレベル ↑"
  ],
  [
    "Base attack ↓",
    "Ataque base ↓",
    "Attaque de base ↓",
    "Basisangriff ↓",
    "Ataque base ↓",
    "기본 공격력 ↓",
    "基础攻击力 ↓",
    "基本攻撃力 ↓"
  ],
  [
    "Base AC ↓",
    "Defesa física base ↓",
    "Défense physique de base ↓",
    "Basis-AC ↓",
    "Defensa física base ↓",
    "기본 방어력 ↓",
    "基础物理防御 ↓",
    "基本防御力 ↓"
  ],
  [
    " equipment items found",
    " equipamentos encontrados",
    " équipements trouvés",
    " Ausrüstungsgegenstände gefunden",
    " objetos de equipamiento encontrados",
    "개 장비 검색됨",
    " 件装备",
    "件の装備"
  ],
  [
    "Official English name",
    "Nome (inglês oficial)",
    "Nom anglais officiel",
    "Offizieller englischer Name",
    "Nombre oficial en inglés",
    "공식 영문 이름",
    "官方英文名称",
    "公式英語名"
  ],
  [
    "Item ID",
    "ID do item",
    "ID d’objet",
    "Gegenstands-ID",
    "ID de objeto",
    "아이템 ID",
    "物品 ID",
    "アイテムID"
  ],
  [
    "Client category",
    "Categoria do cliente",
    "Catégorie client",
    "Clientkategorie",
    "Categoría del cliente",
    "클라이언트 분류",
    "客户端分类",
    "クライアント分類"
  ],
  [
    "Raw level",
    "Nível bruto",
    "Niveau brut",
    "Rohlevel",
    "Nivel bruto",
    "원본 레벨",
    "原始等级",
    "元データレベル"
  ],
  [
    "Base attack",
    "Ataque base",
    "Attaque de base",
    "Basisangriff",
    "Ataque base",
    "기본 공격력",
    "基础攻击力",
    "基本攻撃力"
  ],
  [
    "Base AC",
    "AC base",
    "Défense physique de base",
    "Basis-AC",
    "Defensa física base",
    "기본 방어력",
    "基础物理防御",
    "基本防御力"
  ],
  [
    "Associated boxes",
    "Boxes associadas",
    "Coffres associés",
    "Zugehörige Truhen",
    "Cofres asociados",
    "관련 상자",
    "关联宝箱",
    "関連ボックス"
  ],
  [
    "Client metadata",
    "Metadados do cliente",
    "Métadonnées client",
    "Clientmetadaten",
    "Metadatos del cliente",
    "클라이언트 메타데이터",
    "客户端元数据",
    "クライアントメタデータ"
  ],
  [
    "Reviewed profile",
    "Ficha revisada",
    "Fiche vérifiée",
    "Geprüftes Profil",
    "Ficha revisada",
    "검토된 정보",
    "已审核资料",
    "確認済み情報"
  ],
  [
    "Client source",
    "Dados do cliente",
    "Source client",
    "Clientdaten",
    "Datos del cliente",
    "클라이언트 자료",
    "客户端来源",
    "クライアント由来"
  ],
  [
    "Extracted · Reviewed",
    "Extraído · Revisado",
    "Extrait · Vérifié",
    "Extrahiert · Geprüft",
    "Extraído · Revisado",
    "추출 · 검토 완료",
    "已提取 · 已审核",
    "抽出・確認済み"
  ],
  [
    "Client source only",
    "Fonte do cliente",
    "Source client uniquement",
    "Nur Clientdaten",
    "Solo datos del cliente",
    "클라이언트 자료만",
    "仅客户端来源",
    "クライアント資料のみ"
  ],
  [
    "No equipment items match your search.",
    "Nenhum equipamento corresponde à busca.",
    "Aucun équipement ne correspond à votre recherche.",
    "Keine Ausrüstung entspricht deiner Suche.",
    "Ningún equipamiento coincide con la búsqueda.",
    "검색 조건에 맞는 장비가 없습니다.",
    "没有符合搜索条件的装备。",
    "検索条件に一致する装備はありません。"
  ],
  [
    "Category, level, attack and AC here are RAW client-file values, not verified equipment requirements or measured combat stats. Zero or unavailable attack/armor is abbreviated as —. Box associations reflect captured previews, not drop odds or guaranteed rewards.",
    "Categoria, nível, ataque e AC nesta tabela são campos BRUTOS extraídos dos arquivos do cliente, não requisitos de equipamento nem valores confirmados em combate. Zero ou campo sem ataque/defesa é abreviado como —. As boxes mostram prévias capturadas, não probabilidades ou garantia de obtenção.",
    "Catégorie, niveau, attaque et défense sont des valeurs brutes du client, et non des conditions d’équipement ou des statistiques de combat vérifiées. — indique une valeur nulle ou indisponible. Les coffres associés proviennent d’aperçus capturés, sans garantie de butin ni de probabilité.",
    "Kategorie, Level, Angriff und AC sind Rohwerte der Clientdateien, keine geprüften Ausrüstungsanforderungen oder Kampfwerte. — steht für null oder fehlende Werte. Truhenbezüge stammen aus Vorschauen, nicht aus bestätigten Dropchancen oder garantierten Belohnungen.",
    "Categoría, nivel, ataque y defensa son valores brutos del cliente, no requisitos de equipamiento ni estadísticas de combate verificadas. — indica cero o dato no disponible. Los cofres asociados proceden de vistas previas, no de probabilidades ni recompensas garantizadas.",
    "분류, 레벨, 공격력 및 방어력은 클라이언트 파일의 원본 수치이며, 확인된 착용 조건이나 실측 전투 능력치가 아닙니다. 공격력 또는 방어력이 0이거나 자료가 없으면 —로 표시합니다. 상자 정보는 확인한 미리보기이며 드롭 확률이나 보상을 보장하지 않습니다.",
    "分类、等级、攻击力和防御力均为客户端原始数值，并非已验证的装备要求或实测战斗属性。零值或缺失值以 — 表示。宝箱关联来自已记录的预览，不代表掉落概率或保证获得奖励。",
    "分類、レベル、攻撃力、防御力はクライアントの元データであり、確認済みの装備条件や実測戦闘値ではありません。0またはデータなしは — と表示します。関連ボックスは記録したプレビューに基づき、ドロップ率や報酬を保証しません。"
  ],
  [
    "Some linked pages and game names are still in English.",
    "Algumas páginas vinculadas e nomes do jogo ainda estão em inglês.",
    "Certaines pages liées et certains noms du jeu restent en anglais.",
    "Einige verlinkte Seiten und Spielnamen sind weiterhin auf Englisch.",
    "Algunas páginas enlazadas y nombres del juego siguen en inglés.",
    "일부 연결 페이지와 게임 내 명칭은 아직 영어로 제공됩니다.",
    "部分链接页面和游戏名称仍为英文。",
    "一部のリンク先ページとゲーム内名称は英語のままです。"
  ],
  [
    "Editorial catalog of verified events, passes, challenges, and updates.",
    "Calendário editorial de eventos, passes, desafios e atualizações verificados.",
    "Catalogue des événements, passes, défis et mises à jour vérifiés.",
    "Redaktioneller Katalog geprüfter Events, Pässe, Herausforderungen und Updates.",
    "Catálogo editorial de eventos, pases, desafíos y actualizaciones verificados.",
    "확인된 이벤트, 패스, 도전 및 업데이트 정보입니다.",
    "经过核实的活动、通行证、挑战与更新目录。",
    "確認済みのイベント、パス、チャレンジ、アップデートの一覧です。"
  ],
  [
    "Reviewed information about mercenaries and their mechanics.",
    "Informações revisadas sobre os mercenários e suas mecânicas.",
    "Informations vérifiées sur les mercenaires et leurs mécaniques.",
    "Geprüfte Informationen über Söldner und ihre Spielmechaniken.",
    "Información revisada sobre mercenarios y sus mecánicas.",
    "용병과 관련 시스템에 대한 검토된 정보입니다.",
    "经过审核的佣兵及其机制资料。",
    "傭兵と関連システムに関する確認済み情報です。"
  ],
  [
    "Only reviewed content appears here. Dates and items found only in client files do not establish server availability.",
    "Somente conteúdos revisados aparecem aqui. Datas e itens encontrados apenas nos arquivos do cliente não comprovam disponibilidade no servidor.",
    "Seul le contenu vérifié est affiché. Les dates et objets trouvés uniquement dans le client ne prouvent pas leur disponibilité sur le serveur.",
    "Hier erscheinen nur geprüfte Inhalte. Daten und Gegenstände aus Clientdateien allein belegen keine Serververfügbarkeit.",
    "Aquí solo se muestra contenido revisado. Las fechas y objetos hallados únicamente en el cliente no prueban disponibilidad en el servidor.",
    "검토된 콘텐츠만 표시합니다. 클라이언트 파일에서만 발견된 날짜와 아이템은 서버에서의 이용 가능 여부를 보장하지 않습니다.",
    "仅展示经过审核的内容。仅在客户端文件中发现的日期和物品不能证明服务器上的可用性。",
    "確認済みの内容のみ掲載します。クライアントファイルだけで見つかった日付やアイテムは、サーバーでの提供を保証しません。"
  ],
  [
    "Search by name",
    "Pesquisar pelo nome",
    "Rechercher par nom",
    "Nach Namen suchen",
    "Buscar por nombre",
    "이름으로 검색",
    "按名称搜索",
    "名前で検索"
  ],
  [
    "No articles have been published in this section yet.",
    "Ainda não há artigos publicados nesta seção.",
    "Aucun article n’a encore été publié dans cette section.",
    "In diesem Bereich wurden noch keine Artikel veröffentlicht.",
    "Aún no hay artículos publicados en esta sección.",
    "이 섹션에는 아직 게시된 글이 없습니다.",
    "此栏目尚未发布文章。",
    "このセクションにはまだ記事がありません。"
  ],
  [
    "No results match the filter.",
    "Nenhum resultado corresponde ao filtro.",
    "Aucun résultat ne correspond au filtre.",
    "Keine Ergebnisse entsprechen dem Filter.",
    "Ningún resultado coincide con el filtro.",
    "필터 조건에 맞는 결과가 없습니다.",
    "没有符合筛选条件的结果。",
    "フィルターに一致する結果はありません。"
  ],
  [
    "KNOWLEDGE BASE",
    "BASE DE CONHECIMENTO",
    "BASE DE CONNAISSANCES",
    "WISSENSDATENBANK",
    "BASE DE CONOCIMIENTO",
    "지식 베이스",
    "知识库",
    "ナレッジベース"
  ],
  [
    "Type",
    "Categoria",
    "Type",
    "Typ",
    "Tipo",
    "유형",
    "类型",
    "種類"
  ],
  [
    "All types",
    "Todos os tipos",
    "Tous les types",
    "Alle Typen",
    "Todos los tipos",
    "모든 유형",
    "全部类型",
    "すべての種類"
  ],
  [
    " articles",
    " artigos",
    " articles",
    " Artikel",
    " artículos",
    "개 글",
    " 篇文章",
    "件の記事"
  ],
  [
    "event",
    "Evento",
    "Événement",
    "Event",
    "Evento",
    "이벤트",
    "活动",
    "イベント"
  ],
  [
    "pass",
    "Passe",
    "Pass",
    "Pass",
    "Pase",
    "패스",
    "通行证",
    "パス"
  ],
  [
    "challenge",
    "Desafio",
    "Défi",
    "Herausforderung",
    "Desafío",
    "도전",
    "挑战",
    "チャレンジ"
  ],
  [
    "promotion",
    "Promoção",
    "Promotion",
    "Aktion",
    "Promoción",
    "프로모션",
    "促销",
    "プロモーション"
  ],
  [
    "update",
    "Atualização",
    "Mise à jour",
    "Update",
    "Actualización",
    "업데이트",
    "更新",
    "アップデート"
  ],
  [
    "mercenary",
    "Mercenário",
    "Mercenaire",
    "Söldner",
    "Mercenario",
    "용병",
    "佣兵",
    "傭兵"
  ],
  [
    "English articles are shown until reviewed translations are available.",
    "Artigos em inglês são exibidos até que traduções revisadas estejam disponíveis.",
    "Les articles en anglais sont affichés en attendant des traductions vérifiées.",
    "Englische Artikel werden angezeigt, bis geprüfte Übersetzungen verfügbar sind.",
    "Se muestran artículos en inglés hasta que haya traducciones revisadas.",
    "검토된 번역이 제공될 때까지 영문 글을 표시합니다.",
    "在审核后的译文可用之前，将显示英文文章。",
    "確認済みの翻訳が公開されるまで英語の記事を表示します。"
  ],
  [
    "Some catalogs and tools are still available only in English.",
    "Alguns catálogos e ferramentas ainda estão disponíveis apenas em inglês.",
    "Certains catalogues et outils sont encore disponibles uniquement en anglais.",
    "Einige Kataloge und Werkzeuge sind noch nur auf Englisch verfügbar.",
    "Algunos catálogos y herramientas aún están disponibles solo en inglés.",
    "일부 도감과 도구는 아직 영어로만 제공됩니다.",
    "部分图鉴和工具仍仅提供英文版本。",
    "一部の図鑑とツールはまだ英語のみ対応しています。"
  ],
  [
    "Open section →",
    "Abrir seção →",
    "Ouvrir la section →",
    "Bereich öffnen →",
    "Abrir sección →",
    "섹션 열기 →",
    "打开栏目 →",
    "セクションを開く →"
  ]
];
const messages=new Map(catalogRows.map(row=>[row[0],row]));
export function catalogText(lang,key){return messages.get(key)?.[Math.max(0,LOCALE_IDS.indexOf(lang))]??sharedText(lang,key);}
