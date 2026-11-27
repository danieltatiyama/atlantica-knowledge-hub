const copy={
 en:['Sort ascending','Sort descending','Sorted ascending','Sorted descending'],
 'pt-br':['Ordenar em ordem crescente','Ordenar em ordem decrescente','Ordenado em ordem crescente','Ordenado em ordem decrescente'],
 fr:['Trier par ordre croissant','Trier par ordre décroissant','Tri croissant','Tri décroissant'],
 de:['Aufsteigend sortieren','Absteigend sortieren','Aufsteigend sortiert','Absteigend sortiert'],
 es:['Ordenar de forma ascendente','Ordenar de forma descendente','Orden ascendente','Orden descendente'],
 ko:['오름차순 정렬','내림차순 정렬','오름차순 정렬됨','내림차순 정렬됨'],
 'zh-hans':['升序排列','降序排列','已按升序排列','已按降序排列'],
 ja:['昇順で並べ替え','降順で並べ替え','昇順に並べ替え済み','降順に並べ替え済み'],
};
export const tableSortText=(lang,index)=>copy[lang]?.[index]??copy.en[index];
