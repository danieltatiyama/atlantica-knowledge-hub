/**
 * Curated, payload-free extract from the player's 2026-11-22 passive box session.
 * 30 box-opening previews (0x2137) and 30 matching result messages (0x2138).
 *
 * Explicitly not a probability table. A repeated item under several grade codes
 * represents distinguishable item+grade possibilities, NOT an inferred weight.
 *
 * Grade code 5 -> +0 is consistent with in-game-verified standard Judgment,
 * 5..8 -> +0..+3 with Supreme/Enchanted, and 9..11 -> +4..+6 with Infused.
 * Enhancement labels remain an interpretation; not an official protocol spec.
 *
 * No original PCAP, packet payloads, connection identifiers or login data
 * are published in this source file.
 */

export interface CapturedEquipmentPool {
  itemUniqueIds: number[];
  gradeCodes: number[];
  source: "game-packet-preview";
  observedItemId: number;
  observedGradeCode: number;
  observedOrder: number;
  rawPreviewPositionCount: number;
  repeatedIdenticalPairs: number;
}
const BASE_POOL_IDS: Record<number, string> = {
  4835: "18800 18801 18802 18803 18804 18805 18806 18807 18808 18809 18810 18811 18812 18813",
  13144: "266 301 401 606 607 608 1322 1422 1506 1507 1508 1806 1807 1808 8595 8705 9162 10185 10186 10187 10405 10406 11102 11245 19001 28222 3771",
  13583: "47 136 224 387 430 545 645 646 647 1358 1458 1531 1532 1533 1831 1832 1833 9345 10197 10198 10199 10413 10414 11105 11249 28224 3773",
  13718: "49 138 283 389 431 547 653 654 655 1360 1460 1536 1537 1538 1836 1837 1838 9347 10200 10201 10202 10415 10416 11106 11250 28223 3772",
  14942: "185 186 187 188 189 190 191 192 193 194 3774 195 196 656 657 658 1546 1547 1548 1846 1847 1848 10205 10206 10207 10397 10398",
  16812: "351 352 353 354 355 356 357 358 359 360 361 363 362 6328 6329 6330 6331 6332 6338 6339 6340 6341 6342 6348 6349 6350 6351",
  20900: "1 100 200 300 400 500 600 700 1200 1400 1500 1800 19000 21000 21100 28200",
  20904: "15 115 220 310 415 510 631 632 650 731 732 750 1230 1231 1301 1401 1520 1525 1530 1820 1825 1830 19010 21010 21110 28201",
  20906: "25 125 225 320 420 515 651 652 660 751 752 760 1250 1251 1302 1402 1535 1540 1545 1835 1840 1845 19015 21015 21115 28202",
  20908: "35 135 230 330 425 520 661 662 665 761 762 765 1260 1261 1304 1404 1550 1555 1560 1850 1855 1860 19020 21020 21120 28204",
  20912: "55 145 240 345 435 530 671 672 675 771 772 775 1270 1271 1305 1405 1580 1585 1590 1880 1885 1890 19030 21030 21130 28205",
  20914: "65 150 245 350 440 535 676 677 680 776 777 780 1275 1276 1308 1408 1595 1600 1605 1895 1900 1905 19035 21035 21135 28208",
  20916: "85 160 255 365 450 555 686 687 696 786 787 795 1285 1286 1310 1410 1625 1630 1635 1925 1930 1935 19045 21045 21145 28210",
  20918: "87 162 257 367 452 557 603 604 605 703 704 705 1203 1204 1312 1412 1503 1504 1505 1803 1804 1805 19047 21047 21147 28212",
  20920: "89 164 259 369 454 559 610 611 612 710 711 712 1207 1208 1313 1413 1510 1511 1512 1810 1811 1812 19049 21049 21149 28213",
  20981: "91 166 261 371 456 561 616 617 618 716 717 718 1211 1212 1315 1415 1516 1517 1518 1816 1817 1818 19051 21051 21151 28215",
  25629: "263 1320 1420 8593 8703 8813 9093 9202 9312 9851 9852 9853 10161 10162 10163 10391 10392 10671 10672 10673 10981 10982 10983 11142 11242 28219",
  25652: "1316 1416 8572 8672 8782 9062 9172 9282 9462 9762 9772 9782 10072 10082 10092 10332 10342 10582 10592 10602 10892 10902 10912 11112 11211 28216",
  25653: "93 170 260 370 460 565 668 669 670 800 801 802 1296 1297 1317 1417 1655 1656 1657 1940 1941 1942 19050 21050 21150 28217",
  25893: "262 1319 1419 8592 8702 8812 9092 9201 9311 9803 9812 9813 10113 10122 10123 10362 10363 10623 10632 10633 10933 10942 10943 11123 11241 28220",
  27275: "99 171 264 372 697 698 699 1298 1299 1321 1421 9094 9203 9313 10164 10171 10172 10674 10681 10682 10984 10991 10992 11143 11243 28221",
};
// Variant content is taken from each variant's OWN captured preview,
// compared against its corresponding captured base box. Missing IDs are
// deliberately omitted and not copied into the variant.
const VARIANT_POOLS: Record<number, {base:number;grades:number[];omit:number[]}> = {
  13400: { base: 13144, grades: [5,6,7,8], omit: [3771] },
  13403: { base: 27275, grades: [9,10,11], omit: [28221] },
  13404: { base: 13144, grades: [9,10,11], omit: [] },
  14065: { base: 13583, grades: [5,6,7,8], omit: [3773] },
  14349: { base: 13718, grades: [5,6,7,8], omit: [431,3772] },
  14516: { base: 13583, grades: [9,10,11], omit: [] },
  22850: { base: 27275, grades: [5,6,7,8], omit: [] },
  22851: { base: 25893, grades: [5,6,7,8], omit: [] },
  22852: { base: 25629, grades: [5,6,7,8], omit: [] },
};

const OBSERVED: Record<number, {itemId:number; gradeCode:number; openingOrder:number}> = {
  20900: { itemId: 1200, gradeCode: 5, openingOrder: 1 },
  20904: { itemId: 415, gradeCode: 5, openingOrder: 2 },
  20906: { itemId: 652, gradeCode: 5, openingOrder: 3 },
  20908: { itemId: 1404, gradeCode: 5, openingOrder: 4 },
  20912: { itemId: 145, gradeCode: 5, openingOrder: 5 },
  20914: { itemId: 676, gradeCode: 5, openingOrder: 6 },
  20916: { itemId: 795, gradeCode: 5, openingOrder: 7 },
  20918: { itemId: 1505, gradeCode: 5, openingOrder: 8 },
  20920: { itemId: 164, gradeCode: 5, openingOrder: 9 },
  20981: { itemId: 261, gradeCode: 5, openingOrder: 10 },
  25652: { itemId: 1416, gradeCode: 5, openingOrder: 11 },
  25653: { itemId: 565, gradeCode: 5, openingOrder: 12 },
  25629: { itemId: 9851, gradeCode: 5, openingOrder: 13 },
  25893: { itemId: 9201, gradeCode: 5, openingOrder: 14 },
  22850: { itemId: 699, gradeCode: 7, openingOrder: 15 },
  22851: { itemId: 1419, gradeCode: 5, openingOrder: 16 },
  22852: { itemId: 10392, gradeCode: 7, openingOrder: 17 },
  27275: { itemId: 11243, gradeCode: 5, openingOrder: 18 },
  13144: { itemId: 10405, gradeCode: 5, openingOrder: 19 },
  13400: { itemId: 10405, gradeCode: 6, openingOrder: 20 },
  13403: { itemId: 10164, gradeCode: 9, openingOrder: 21 },
  13404: { itemId: 1322, gradeCode: 10, openingOrder: 22 },
  13583: { itemId: 9345, gradeCode: 5, openingOrder: 23 },
  13718: { itemId: 11106, gradeCode: 5, openingOrder: 24 },
  14065: { itemId: 645, gradeCode: 7, openingOrder: 25 },
  14349: { itemId: 547, gradeCode: 5, openingOrder: 26 },
  14516: { itemId: 387, gradeCode: 11, openingOrder: 27 },
  14942: { itemId: 10398, gradeCode: 5, openingOrder: 28 },
  16812: { itemId: 359, gradeCode: 5, openingOrder: 29 },
  4835: { itemId: 18808, gradeCode: 5, openingOrder: 30 },
};

function parseIds(text:string):number[] {
  return text.split(" ").map(Number);
}

export const CAPTURED_EQUIPMENT_POOLS: Record<number,CapturedEquipmentPool> = {};
for (const [idString,rawIds] of Object.entries(BASE_POOL_IDS)) {
  const id=Number(idString), sample=OBSERVED[id];
  CAPTURED_EQUIPMENT_POOLS[id]={
    itemUniqueIds:parseIds(rawIds), gradeCodes:[5],
    source:"game-packet-preview",
    observedItemId:sample.itemId, observedGradeCode:sample.gradeCode,
    observedOrder:sample.openingOrder,
    rawPreviewPositionCount:parseIds(rawIds).length,
    repeatedIdenticalPairs:0,
  };
}
for (const [idString,def] of Object.entries(VARIANT_POOLS)) {
  const id=Number(idString), sample=OBSERVED[id];
  const base=CAPTURED_EQUIPMENT_POOLS[def.base];
  const itemUniqueIds=base.itemUniqueIds.filter((x)=>!def.omit.includes(x));
  CAPTURED_EQUIPMENT_POOLS[id]={
    itemUniqueIds,gradeCodes:def.grades,source:"game-packet-preview",
    observedItemId:sample.itemId, observedGradeCode:sample.gradeCode,
    observedOrder:sample.openingOrder,
    rawPreviewPositionCount:itemUniqueIds.length*def.grades.length+(id===14349?4:0),
    repeatedIdenticalPairs:id===14349?4:0,
  };
}

// During the capture, Evil Dragon God and Evil Phoenix (IDs 22851, 22852)
// each transmitted 26 items × 4 grade codes, although the box name does not
// include "Supreme" or "Enchanted".
export const UNCAPTURED_STANDARD_BOX_IDS=[20907,20913,20917];

export function getCapturedEquipmentPool(itemUniqueId:string|number):CapturedEquipmentPool|undefined {
  return CAPTURED_EQUIPMENT_POOLS[Number(itemUniqueId)];
}

export function decodedEnhancementCandidate(code:number):number|undefined {
  return code>=5&&code<=15 ? code-5 : undefined;
}
