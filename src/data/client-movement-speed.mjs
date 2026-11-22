/** 
 * Original raw MoveSpeed values from the user-provided PRIVATE
 * Miner_ClientAttributes_Private_20_25.json, Items.csv, snapshot 1.
 *
 * Only the verified source row IDs and numeric values are published.
 * No unrelated original item fields, paths, names or client bytes.
 * A missing source row is NOT the same as a raw zero.
 */
const SOURCE_ROW_IDS_BY_RAW_VALUE = Object.freeze({
  "0": "969,971,972,973,974,975,976,977,978,979,980,981,982,986,987,988,992,993,994,995,996,997,998,999,1000,16799,16801,16802,16803,16804,16805,16806,16807,16808,16809,16810,16811,16812,16816,16817,16818,16822,16823,16824,16825,16826,16827,16828,16829,16830,16834,16835,16836,16837,16838,16839,16843,16844,16845,16849,16850,16851,16852,16853,16854,16855,16856,16857,16921,16922,16923,16924,16925,16926,16927,16928,16929,16936,16938,16939,16940,16941,16942,16943,16944,16945,16948,16949,16952,16953,16954,16955,16956,16957,16960,16961,16962,16963,16966,16967,16970,16971,16972,16973,16976,16977,16986,16987,16988,16989,16990,16991,16998,16999,17000,17001,17002,17003,17004,17005,17006,17007,17008,17009,17010,17014,17015,17016,17020,17021,17022,17023,17024,17025,17026,17027,17028,17032,17033,17034,17035,17036,17037,17041,17042,17043,17047,17048,17049,17050,17051,17052,17056,17057,17058,17071,17072,17073,17074,17075,17076,17077,17078,17079,17086,17088,17089,17090,17091,17092,17093,17094,17095,17096,17097,17098,17099,17103,17104,17105,17109,17110,17111,17112,17113,17114,17115,17116,17117,17121,17122,17123,17124,17125,17126,17130,17131,17132,17136,17137,17138,17139,17140,17141,17145,17146,17147,17160,17161,17162,17163,17164,17165,17166,17167,17168,17175,17177,17178,17179,17180,17181,17182,17183,17184,17185,17186,17187,17188,17192,17193,17194,17198,17199,17200,17201,17202,17203,17204,17205,17206,17264,17265,17266,17267,17268,17269,17272,17274,17275,17276,17277,17280,17281,17283,17285,17286,17288,17291,17292,17293,17297,17298,17299,17300,17301,17302,17305,17307,17308,17309,17310,17312,17313,17314,17316,17317,17319,17323,17324,17325,17561,17562,17563,17564,17565,17566,17567,17568,17569,17570,17571,17575,17576,17683,17684,17685,17686,17688,17689,17690,17691,17692,17693,17694,17695,17696,17702,17703,17705,17706,17707,17708,17710,17711,17712,17713,17715,17716,17717",
  "4": "1004,1005,1006,17210,17211,17212",
  "6": "1007,1008,1009,17213,17214,17215",
  "8": "1013,1014,1015,17219,17220,17221",
  "10": "1019,1020,1021,1022,1023,1024,1028,1029,1030,1043,1044,1045,1046,1047,1048,1049,1050,1051,17225,17226,17227,17228,17229,17230,17234,17235,17236,17249,17250,17251,17252,17253,17254,17255,17256,17257,17572,17573,17574,17687,17709,17714,17718"
});

const sourceByRow = new Map();
for (const [rawValue,encoded] of Object.entries(SOURCE_ROW_IDS_BY_RAW_VALUE)) {
  if (!/^(0|4|6|8|10)$/.test(rawValue)) {
    throw new Error("Unexpected client MoveSpeed value");
  }
  for (const token of encoded.split(",")) {
    if (!/^[1-9]\d*$/.test(token)) throw new Error("Invalid MoveSpeed source row ID");
    const row = Number(token);
    if (!Number.isSafeInteger(row) || sourceByRow.has(row)) {
      throw new Error("Duplicate MoveSpeed source row");
    }
    sourceByRow.set(row,rawValue);
  }
}
if(sourceByRow.size!==381)throw new Error("MoveSpeed source coverage changed");

export const CLIENT_MOVEMENT_SOURCE_ROW_COUNT = sourceByRow.size;
export const CLIENT_MOVEMENT_SOURCE_SNAPSHOT = 1;

export function getMoveSpeedFromSourceRow(sourceRowNumber) {
  return sourceByRow.get(sourceRowNumber);
}

/**
 * Attach only verified, source-row-matched MoveSpeed to existing
 * Items.csv raw attribute records; never fabricate values for absent rows.
 * This dataset uses the identical snapshot 1 and 551 reviewed item identities.
 */
export function withClientMovementSpeed(validatedRecords, snapshotId) {
  if (snapshotId !== CLIENT_MOVEMENT_SOURCE_SNAPSHOT ||
      !Array.isArray(validatedRecords) || validatedRecords.length!==551) {
    throw new Error("MoveSpeed overlay requires the validated 551-ID snapshot 1");
  }
  const used=new Set();
  const result=validatedRecords.map(item=>({
    ...item,
    sourceRows:item.sourceRows.map(row=>{
      const value=sourceByRow.get(row.sourceRowNumber);
      if(value===undefined)return row;
      if(used.has(row.sourceRowNumber)){
        throw new Error("Duplicate Items.csv source row");
      }
      if("MoveSpeed" in row.fieldsRaw && row.fieldsRaw.MoveSpeed!==value){
        throw new Error("MoveSpeed differs from original snapshot 1 source row");
      }
      used.add(row.sourceRowNumber);
      // A future full export may already include this key. Accept only
      // exact equality; never double-attach a different source fact.
      return "MoveSpeed" in row.fieldsRaw
        ? row
        : {...row,fieldsRaw:{...row.fieldsRaw,MoveSpeed:value}};
    }),
  }));
  if(used.size!==sourceByRow.size) {
    throw new Error("MoveSpeed overlay cannot account for every original Items.csv source row");
  }
  const itemsWithMoveSpeed=result.filter(item=>
    item.sourceRows.some(row=>"MoveSpeed" in row.fieldsRaw));
  const itemsWithNonzeroMoveSpeed=itemsWithMoveSpeed.filter(item=>
    item.sourceRows.some(row=>Number(row.fieldsRaw.MoveSpeed)>0));
  if(itemsWithMoveSpeed.length!==329||itemsWithNonzeroMoveSpeed.length!==34){
    throw new Error("Unexpected client MoveSpeed coverage");
  }
  return result;
}
