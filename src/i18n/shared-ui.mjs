import {LOCALE_IDS} from "./locales.mjs";

// Shared UI only. Game entity names remain sourced from the original client.
export const sharedRows = [
  [
    "Equipment & Boxes",
    "Equipamentos e Boxes",
    "Équipements et coffres",
    "Ausrüstung und Truhen",
    "Equipamiento y cofres",
    "장비 및 상자",
    "装备与宝箱",
    "装備とボックス"
  ],
  [
    "Equipment catalog with 2,462 equipment-like IDs, boxes, and source-backed item profiles.",
    "Catálogo de 2.462 IDs semelhantes a equipamentos, boxes e fichas com dados extraídos do cliente.",
    "Catalogue de 2 462 identifiants apparentés à des équipements, de coffres et de fiches issues du client.",
    "Katalog mit 2.462 ausrüstungsähnlichen IDs, Truhen und Gegenstandsprofilen auf Basis der Clientdaten.",
    "Catálogo de 2.462 ID relacionados con equipamiento, cofres y fichas basadas en datos del cliente.",
    "장비로 분류된 2,462개 ID, 상자 및 게임 클라이언트 데이터를 기반으로 한 아이템 정보입니다.",
    "收录 2,462 个装备类 ID、宝箱及基于客户端数据的物品资料。",
    "装備に該当する2,462件のID、ボックス、クライアントデータに基づくアイテム情報。"
  ],
  [
    "All Items",
    "Todos os itens",
    "Tous les objets",
    "Alle Gegenstände",
    "Todos los objetos",
    "모든 아이템",
    "全部物品",
    "全アイテム"
  ],
  [
    "Search 23,586 client item IDs, including materials, consumables and equipment. Explore crafting, uses and possible drops.",
    "Pesquise 23.586 IDs do cliente, incluindo materiais, consumíveis e equipamentos. Consulte fabricação, usos e possíveis drops.",
    "Recherchez 23 586 identifiants d’objets du client : matériaux, consommables et équipements. Consultez recettes, usages et sources de butin possibles.",
    "Durchsuche 23.586 Gegenstands-IDs des Clients, darunter Materialien, Verbrauchsgegenstände und Ausrüstung. Entdecke Herstellung, Verwendung und mögliche Beutequellen.",
    "Busca 23.586 ID de objetos del cliente, incluidos materiales, consumibles y equipamiento. Consulta fabricación, usos y posibles botines.",
    "재료, 소비 아이템, 장비 등 클라이언트의 23,586개 아이템 ID를 검색하고 제작법, 용도 및 드롭 가능성을 확인하세요.",
    "搜索客户端中的 23,586 个物品 ID，包括材料、消耗品和装备。查看制作、用途及可能的掉落来源。",
    "素材、消耗品、装備など、クライアントの23,586件のアイテムIDを検索し、製造レシピ、用途、ドロップ候補を確認できます。"
  ],
  [
    "Events & Updates",
    "Eventos e Atualizações",
    "Événements et mises à jour",
    "Events und Updates",
    "Eventos y actualizaciones",
    "이벤트 및 업데이트",
    "活动与更新",
    "イベントとアップデート"
  ],
  [
    "Curated event calendar and recent updates.",
    "Calendário de eventos e histórico de novidades revisados.",
    "Calendrier des événements et dernières actualités vérifiées.",
    "Redaktionell geprüfter Eventkalender und aktuelle Neuigkeiten.",
    "Calendario de eventos y novedades revisadas.",
    "검토된 이벤트 일정과 최신 업데이트 소식입니다.",
    "经过整理的活动日历与近期更新。",
    "確認済みのイベントカレンダーと最新の更新情報。"
  ],
  [
    "Monsters & Drops",
    "Monstros e Drops",
    "Monstres et butin",
    "Monster und Beute",
    "Monstruos y botín",
    "몬스터 및 드롭 아이템",
    "怪物与掉落",
    "モンスターとドロップ"
  ],
  [
    "Explore original client creature and loot-source records as they pass source review. Raw rates are not confirmed drop percentages.",
    "Explore o catálogo de criaturas e as relações de loot extraídas do cliente, após revisão dos arquivos originais. Taxas brutas não são porcentagens comprovadas.",
    "Consultez les données du client sur les créatures et les sources de butin après vérification. Les taux bruts ne constituent pas des probabilités de butin confirmées.",
    "Erkunde geprüfte Clientdaten zu Kreaturen und Beutequellen. Rohwerte sind keine bestätigten Dropraten.",
    "Explora los datos revisados del cliente sobre criaturas y fuentes de botín. Los valores brutos no son porcentajes de caída confirmados.",
    "검토된 클라이언트의 몬스터 및 드롭 출처 정보를 확인하세요. 원본 수치는 실제 드롭 확률로 확인된 값이 아닙니다.",
    "查看经过审核的客户端怪物与掉落来源记录。原始数值并非已确认的掉落概率。",
    "検証済みのクライアント内のモンスターとドロップ元の記録を確認できます。元データの数値は確定したドロップ率ではありません。"
  ],
  [
    "Mercenaries",
    "Mercenários",
    "Mercenaires",
    "Söldner",
    "Mercenarios",
    "용병",
    "佣兵",
    "傭兵"
  ],
  [
    "Mercenary profiles and skills with verified evidence.",
    "Informações e habilidades dos mercenários, com evidências verificadas.",
    "Fiches et compétences des mercenaires, avec sources vérifiées.",
    "Söldnerprofile und Fähigkeiten mit geprüften Belegen.",
    "Fichas y habilidades de mercenarios con evidencias verificadas.",
    "확인된 근거를 바탕으로 한 용병 정보와 스킬입니다.",
    "基于已核实资料的佣兵信息与技能。",
    "確認済みの根拠に基づく傭兵情報とスキル。"
  ],
  [
    "Search items, monsters and guides",
    "Pesquisar itens, monstros e guias",
    "Rechercher objets, monstres et guides",
    "Gegenstände, Monster und Anleitungen suchen",
    "Buscar objetos, monstruos y guías",
    "아이템, 몬스터 및 가이드 검색",
    "搜索物品、怪物与攻略",
    "アイテム・モンスター・ガイドを検索"
  ],
  [
    "English ↗",
    "Inglês ↗",
    "Anglais ↗",
    "Englisch ↗",
    "Inglés ↗",
    "영어 ↗",
    "英文 ↗",
    "英語 ↗"
  ],
  [
    "Open global search",
    "Abrir busca global",
    "Ouvrir la recherche globale",
    "Globale Suche öffnen",
    "Abrir búsqueda global",
    "통합 검색 열기",
    "打开全站搜索",
    "サイト内検索を開く"
  ],
  [
    "Home",
    "Início",
    "Accueil",
    "Startseite",
    "Inicio",
    "홈",
    "首页",
    "ホーム"
  ],
  [
    "Breadcrumb",
    "Caminho de navegação",
    "Fil d’Ariane",
    "Brotkrumennavigation",
    "Ruta de navegación",
    "현재 위치",
    "面包屑导航",
    "パンくずリスト"
  ],
  [
    "A community knowledge hub for Atlantica Online.",
    "Uma base de conhecimento comunitária de Atlantica Online.",
    "Une base de connaissances communautaire pour Atlantica Online.",
    "Eine Wissensdatenbank der Atlantica-Online-Community.",
    "Una base de conocimiento comunitaria de Atlantica Online.",
    "아틀란티카 온라인 커뮤니티 지식 허브입니다.",
    "Atlantica Online 社区知识库。",
    "アトランティカオンラインのコミュニティ知識ベース。"
  ],
  [
    "Community Project",
    "Projeto da comunidade",
    "Projet communautaire",
    "Community-Projekt",
    "Proyecto comunitario",
    "커뮤니티 프로젝트",
    "社区项目",
    "コミュニティプロジェクト"
  ],
  [
    "Unofficial community resource.",
    "Recurso não oficial da comunidade.",
    "Ressource communautaire non officielle.",
    "Inoffizielle Community-Ressource.",
    "Recurso comunitario no oficial.",
    "비공식 커뮤니티 자료입니다.",
    "非官方社区资源。",
    "非公式のコミュニティ資料です。"
  ],
  [
    "Wiki global search",
    "Busca global da Wiki",
    "Recherche globale du wiki",
    "Globale Wiki-Suche",
    "Búsqueda global de la wiki",
    "위키 통합 검색",
    "Wiki 全站搜索",
    "Wiki 全体検索"
  ],
  [
    "Search the Wiki",
    "Pesquisar na Wiki",
    "Rechercher dans le wiki",
    "Wiki durchsuchen",
    "Buscar en la wiki",
    "위키 검색",
    "搜索 Wiki",
    "Wiki を検索"
  ],
  [
    "Close search",
    "Fechar busca",
    "Fermer la recherche",
    "Suche schließen",
    "Cerrar búsqueda",
    "검색 닫기",
    "关闭搜索",
    "検索を閉じる"
  ],
  [
    "Item, monster or guide name or ID",
    "Nome ou ID do item, monstro ou guia",
    "Nom ou ID d’objet, de monstre ou de guide",
    "Name oder ID eines Gegenstands, Monsters oder einer Anleitung",
    "Nombre o ID de objeto, monstruo o guía",
    "아이템, 몬스터, 가이드 이름 또는 ID",
    "物品、怪物或攻略名称或 ID",
    "アイテム・モンスター・ガイドの名前またはID"
  ],
  [
    "e.g. Silver Thread, Huge Crocodile, 7080",
    "Ex.: Silver Thread, Huge Crocodile, 7080",
    "Ex. : Silver Thread, Huge Crocodile, 7080",
    "Z. B. Silver Thread, Huge Crocodile, 7080",
    "Ej.: Silver Thread, Huge Crocodile, 7080",
    "예: Silver Thread, Huge Crocodile, 7080",
    "例如：Silver Thread、Huge Crocodile、7080",
    "例：Silver Thread、Huge Crocodile、7080"
  ],
  [
    "Category",
    "Categoria",
    "Catégorie",
    "Kategorie",
    "Categoría",
    "분류",
    "分类",
    "カテゴリ"
  ],
  [
    "All",
    "Todas",
    "Toutes",
    "Alle",
    "Todas",
    "전체",
    "全部",
    "すべて"
  ],
  [
    "Items",
    "Itens",
    "Objets",
    "Gegenstände",
    "Objetos",
    "아이템",
    "物品",
    "アイテム"
  ],
  [
    "Monsters",
    "Monstros",
    "Monstres",
    "Monster",
    "Monstruos",
    "몬스터",
    "怪物",
    "モンスター"
  ],
  [
    "Guides",
    "Guias",
    "Guides",
    "Anleitungen",
    "Guías",
    "가이드",
    "攻略",
    "ガイド"
  ],
  [
    "Enter at least 2 characters.",
    "Digite pelo menos 2 caracteres.",
    "Saisissez au moins 2 caractères.",
    "Gib mindestens 2 Zeichen ein.",
    "Introduce al menos 2 caracteres.",
    "두 글자 이상 입력하세요.",
    "请输入至少 2 个字符。",
    "2文字以上入力してください。"
  ],
  [
    "Names and IDs come from the game client; they do not confirm server availability.",
    "Os nomes e IDs são extraídos do cliente; isso não confirma disponibilidade no servidor.",
    "Les noms et identifiants proviennent du client ; ils ne confirment pas la disponibilité sur le serveur.",
    "Namen und IDs stammen aus dem Spielclient; sie bestätigen keine Verfügbarkeit auf dem Server.",
    "Los nombres e ID proceden del cliente; no confirman la disponibilidad en el servidor.",
    "이름과 ID는 게임 클라이언트에서 추출한 것으로 서버에서의 획득 가능 여부를 보장하지 않습니다.",
    "名称和 ID 来自游戏客户端，不代表服务器上一定可用。",
    "名前とIDはゲームクライアント由来で、サーバーでの入手可否を保証するものではありません。"
  ],
  [
    "Item",
    "Item",
    "Objet",
    "Gegenstand",
    "Objeto",
    "아이템",
    "物品",
    "アイテム"
  ],
  [
    "Monster",
    "Monstro",
    "Monstre",
    "Monster",
    "Monstruo",
    "몬스터",
    "怪物",
    "モンスター"
  ],
  [
    "Guide",
    "Guia",
    "Guide",
    "Anleitung",
    "Guía",
    "가이드",
    "攻略",
    "ガイド"
  ],
  [
    "Searching client indexes…",
    "Pesquisando índices do cliente…",
    "Recherche dans les index du client…",
    "Clientindizes werden durchsucht…",
    "Buscando en los índices del cliente…",
    "클라이언트 데이터 검색 중…",
    "正在搜索客户端索引…",
    "クライアントデータを検索中…"
  ],
  [
    "Results shown: ",
    "Resultados exibidos: ",
    "Résultats affichés : ",
    "Angezeigte Ergebnisse: ",
    "Resultados mostrados: ",
    "표시된 결과: ",
    "显示结果：",
    "表示件数："
  ],
  [
    "No results found.",
    "Nenhum resultado encontrado.",
    "Aucun résultat trouvé.",
    "Keine Ergebnisse gefunden.",
    "No se encontraron resultados.",
    "검색 결과가 없습니다.",
    "未找到结果。",
    "検索結果がありません。"
  ],
  [
    "Could not load search indexes.",
    "Não foi possível carregar os índices de busca.",
    "Impossible de charger les index de recherche.",
    "Suchindizes konnten nicht geladen werden.",
    "No se pudieron cargar los índices de búsqueda.",
    "검색 데이터를 불러오지 못했습니다.",
    "无法加载搜索索引。",
    "検索データを読み込めませんでした。"
  ],
  [
    "On this page",
    "Nesta página",
    "Sur cette page",
    "Auf dieser Seite",
    "En esta página",
    "이 페이지의 목차",
    "本页目录",
    "このページの目次"
  ],
  [
    "Hide navigation",
    "Esconder navegação",
    "Masquer la navigation",
    "Navigation ausblenden",
    "Ocultar navegación",
    "목차 숨기기",
    "隐藏导航",
    "ナビゲーションを非表示"
  ],
  [
    "Navigation position",
    "Posição da navegação",
    "Position de la navigation",
    "Navigationsposition",
    "Posición de la navegación",
    "목차 위치",
    "导航位置",
    "ナビゲーションの位置"
  ],
  [
    "Left",
    "Esquerda",
    "Gauche",
    "Links",
    "Izquierda",
    "왼쪽",
    "左侧",
    "左"
  ],
  [
    "Right",
    "Direita",
    "Droite",
    "Rechts",
    "Derecha",
    "오른쪽",
    "右侧",
    "右"
  ],
  [
    "Section table of contents",
    "Índice das seções",
    "Sommaire des sections",
    "Abschnittsverzeichnis",
    "Índice de secciones",
    "섹션 목차",
    "章节目录",
    "セクション目次"
  ],
  [
    "Explore",
    "Explorar",
    "Explorer",
    "Entdecken",
    "Explorar",
    "둘러보기",
    "探索",
    "探索"
  ],
  [
    "Open profile",
    "Ficha aberta",
    "Fiche ouverte",
    "Geöffnetes Profil",
    "Ficha abierta",
    "열린 상세 정보",
    "当前详情",
    "表示中の詳細"
  ],
  [
    "Use +/− beside headings to collapse or expand sections.",
    "Use +/− nos títulos para recolher ou expandir seções.",
    "Utilisez +/− à côté des titres pour replier ou développer les sections.",
    "Nutze +/− neben den Überschriften, um Abschnitte ein- oder auszuklappen.",
    "Usa +/− junto a los títulos para plegar o desplegar secciones.",
    "제목 옆의 +/− 버튼으로 섹션을 접거나 펼칠 수 있습니다.",
    "使用标题旁的 +/− 折叠或展开章节。",
    "見出し横の +/− でセクションを折りたたんだり展開したりできます。"
  ],
  [
    "Show section navigation",
    "Mostrar navegação de seções",
    "Afficher le sommaire",
    "Abschnittsnavigation anzeigen",
    "Mostrar navegación de secciones",
    "목차 표시",
    "显示章节导航",
    "セクション目次を表示"
  ],
  [
    "Contents",
    "Índice",
    "Sommaire",
    "Inhalt",
    "Índice",
    "목차",
    "目录",
    "目次"
  ],
  [
    "Expand section",
    "Expandir seção",
    "Développer la section",
    "Abschnitt ausklappen",
    "Expandir sección",
    "섹션 펼치기",
    "展开章节",
    "セクションを展開"
  ],
  [
    "Collapse section",
    "Recolher seção",
    "Replier la section",
    "Abschnitt einklappen",
    "Plegar sección",
    "섹션 접기",
    "折叠章节",
    "セクションを折りたたむ"
  ],
  [
    "section",
    "seção",
    "section",
    "Abschnitt",
    "sección",
    "섹션",
    "章节",
    "セクション"
  ],
  [
    "Image viewer",
    "Visualizador de imagens",
    "Visionneuse d’images",
    "Bildbetrachter",
    "Visor de imágenes",
    "이미지 뷰어",
    "图片查看器",
    "画像ビューアー"
  ],
  [
    "Image controls",
    "Controles da imagem",
    "Commandes de l’image",
    "Bildsteuerung",
    "Controles de imagen",
    "이미지 조작",
    "图片控制",
    "画像操作"
  ],
  [
    "Previous image",
    "Imagem anterior",
    "Image précédente",
    "Vorheriges Bild",
    "Imagen anterior",
    "이전 이미지",
    "上一张图片",
    "前の画像"
  ],
  [
    "Next image",
    "Próxima imagem",
    "Image suivante",
    "Nächstes Bild",
    "Imagen siguiente",
    "다음 이미지",
    "下一张图片",
    "次の画像"
  ],
  [
    "Zoom out",
    "Diminuir zoom",
    "Réduire le zoom",
    "Verkleinern",
    "Reducir zoom",
    "축소",
    "缩小",
    "縮小"
  ],
  [
    "Zoom in",
    "Aumentar zoom",
    "Agrandir",
    "Vergrößern",
    "Aumentar zoom",
    "확대",
    "放大",
    "拡大"
  ],
  [
    "Fit to window",
    "Ajustar à janela",
    "Adapter à la fenêtre",
    "An Fenster anpassen",
    "Ajustar a la ventana",
    "창 크기에 맞추기",
    "适应窗口",
    "ウィンドウに合わせる"
  ],
  [
    "Fit",
    "Ajustar",
    "Adapter",
    "Anpassen",
    "Ajustar",
    "맞추기",
    "适应",
    "合わせる"
  ],
  [
    "Close image viewer",
    "Fechar visualizador de imagens",
    "Fermer la visionneuse",
    "Bildbetrachter schließen",
    "Cerrar visor de imágenes",
    "이미지 뷰어 닫기",
    "关闭图片查看器",
    "画像ビューアーを閉じる"
  ],
  [
    "Close",
    "Fechar",
    "Fermer",
    "Schließen",
    "Cerrar",
    "닫기",
    "关闭",
    "閉じる"
  ],
  [
    "←/→: images · +/−: zoom · 0: fit · Esc: close",
    "←/→: imagens · +/−: zoom · 0: ajustar · Esc: fechar",
    "←/→ : images · +/− : zoom · 0 : adapter · Esc : fermer",
    "←/→: Bilder · +/−: Zoom · 0: anpassen · Esc: schließen",
    "←/→: imágenes · +/−: zoom · 0: ajustar · Esc: cerrar",
    "←/→: 이미지 이동 · +/−: 확대/축소 · 0: 맞추기 · Esc: 닫기",
    "←/→：切换图片 · +/−：缩放 · 0：适应窗口 · Esc：关闭",
    "←/→: 画像切替 · +/−: 拡大・縮小 · 0: サイズ調整 · Esc: 閉じる"
  ],
  [
    "Article image",
    "Imagem do artigo",
    "Image de l’article",
    "Artikelbild",
    "Imagen del artículo",
    "문서 이미지",
    "文章图片",
    "記事の画像"
  ],
  [
    "Could not load this image.",
    "Não foi possível carregar esta imagem.",
    "Impossible de charger cette image.",
    "Dieses Bild konnte nicht geladen werden.",
    "No se pudo cargar esta imagen.",
    "이미지를 불러오지 못했습니다.",
    "无法加载此图片。",
    "画像を読み込めませんでした。"
  ],
  [
    "Expand image",
    "Ampliar imagem",
    "Agrandir l’image",
    "Bild vergrößern",
    "Ampliar imagen",
    "이미지 확대",
    "放大图片",
    "画像を拡大"
  ],
  [
    "Expand {section}",
    "Expandir {section}",
    "Développer {section}",
    "{section} ausklappen",
    "Expandir {section}",
    "{section} 펼치기",
    "展开{section}",
    "{section}を展開"
  ],
  [
    "Collapse {section}",
    "Recolher {section}",
    "Replier {section}",
    "{section} einklappen",
    "Plegar {section}",
    "{section} 접기",
    "折叠{section}",
    "{section}を折りたたむ"
  ]
];
const messages=new Map(sharedRows.map(row=>[row[0],row]));
export function sharedText(lang,english){
 const index=LOCALE_IDS.indexOf(lang);
 return messages.get(english)?.[index<0?0:index]??english;
}
export function sectionAction(lang,expanded,section){
 return sharedText(lang,expanded?"Expand {section}":"Collapse {section}").replace("{section}",()=>section);
}
