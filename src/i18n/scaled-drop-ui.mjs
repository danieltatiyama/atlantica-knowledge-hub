const keys=['notice','direct','level'];
const copy={
 en:['These enemies scale to the main character. Group drops are separated by main-character level; raw monster level 1 does not select the band. Only one band applies within each group at a given main level. Rates are client estimates.','Direct source drops (not band-selected)','Main character level'],
 'pt-br':['Estes inimigos se adaptam ao main. Os drops de grupo estão separados pelo nível do personagem principal; o nível bruto 1 do mob não seleciona a faixa. Dentro de cada grupo, apenas uma faixa se aplica ao nível do main. Taxas estimadas pelo cliente.','Drops diretos da fonte (sem seleção por faixa)','Nível do personagem principal'],
 fr:['Ces ennemis suivent le niveau du personnage principal. Les drops de groupe sont séparés par ce niveau, pas par le niveau brut 1. Une seule tranche par groupe s’applique au niveau du personnage. Taux estimés du client.','Drops directs de la source (hors tranches)','Niveau du personnage principal'],
 de:['Diese Gegner skalieren mit dem Hauptcharakter. Gruppendrops sind nach dessen Level getrennt, nicht nach Rohlevel 1. Pro Gruppe gilt nur ein Bereich für den jeweiligen Hauptcharakterlevel. Raten sind Clientschätzungen.','Direkte Quelldrops (ohne Bereichsauswahl)','Level des Hauptcharakters'],
 es:['Estos enemigos se adaptan al personaje principal. Los drops de grupo se separan por su nivel, no por el nivel bruto 1. Solo una franja por grupo corresponde al nivel del personaje. Tasas estimadas del cliente.','Drops directos de la fuente (sin franja)','Nivel del personaje principal'],
 ko:['이 적은 메인 캐릭터 레벨에 맞춰집니다. 그룹 드롭은 원시 몬스터 레벨 1이 아닌 메인 레벨 구간별로 나뉩니다. 각 그룹에서는 메인 레벨에 맞는 구간 하나만 적용됩니다. 확률은 클라이언트 추정치입니다.','원본 직접 드롭 (구간 선택 없음)','메인 캐릭터 레벨'],
 'zh-hans':['这些敌人随主角等级变化。组掉落按主角等级分段，不能用怪物原始等级 1 选择。每组只适用主角等级对应的一个区间。概率为客户端估算。','来源直接掉落（不按区间选择）','主角等级'],
 ja:['これらの敵は主人公のレベルに合わせて変化します。グループドロップは生のモンスターレベル1ではなく主人公のレベル帯別です。各グループでは主人公レベルに対応する帯が一つだけ適用されます。確率はクライアント推定値です。','原本の直接ドロップ（帯選択なし）','主人公レベル']
};
export function scaledDropText(lang,key){return (copy[lang]??copy.en)[keys.indexOf(key)]??key;}
