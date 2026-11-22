/** Gate for previously profiled Items.csv raw client numeric attributes.
 *
 * Values retain their exact decimal source strings; no stat inference,
 * enhancement scaling or default numerical constants are added.
 * Every row attaches an explicit source row number and reviewed item ID.
 */
const fields=new Set([
"MinDamage","MaxDamage","Attack","AC","Defence","MagicDef",
"Str","Dex","Vit","Mag","Intl","Int","Critical","CriticalPlus",
"Critical_Damage","HitRate","Dodge","EV","Magic_Damage",
"Magic","MagicSkillPlus","ActivePower","BuffUpPercentage",
"AddElementalBuff","AddAWKPoint","ElementPoint",
"ADDJobDmg_AXE","ADDJobDmg_BOW","ADDJobDmg_CAN",
"ADDJobDmg_GUN","ADDJobDmg_SPR","ADDJobDmg_STF","ADDJobDmg_SWD",
"EnmyJobDmg_AXE","EnmyJobDmg_BOW","EnmyJobDmg_CAN",
"EnmyJobDmg_GTR","EnmyJobDmg_GUN","EnmyJobDmg_KNU",
"EnmyJobDmg_SAW","EnmyJobDmg_SPR","EnmyJobDmg_STF",
"EnmyJobDmg_SWD","EnmyJobDmg_WHIP",
]);
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const exact=(x,ks)=>obj(x)&&Object.keys(x).length===ks.length&&
  Object.keys(x).every(k=>ks.includes(k));
const positive=x=>Number.isSafeInteger(x)&&x>0;
const raw=x=>typeof x==="string"&&/^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/.test(x);

export function validateClientItemAttributes(data,names){
  const errors=[];
  if(!exact(data,["schemaVersion","dataset","sourceDataset","snapshotId","records"])||
     data.schemaVersion!=="1.0"||data.dataset!=="client-item-attributes"||
     data.sourceDataset!=="Items.csv"||
     !(data.snapshotId===null||positive(data.snapshotId))||
     !Array.isArray(data.records)||data.records.length>100000||!obj(names)){
    return {ok:false,errors:["Invalid Items.csv source attribute contract"],records:[]};
  }
  if(data.records.length>0&&data.snapshotId===null){
    errors.push("Attributes require an explicit Miner snapshot");
  }
  const ids=new Set(),recordRows=new Set();
  for(const item of data.records){
    if(!exact(item,["id","nameEn","identity","sourceRows"])||
       typeof item.id!=="string"||!/^[1-9]\d{0,12}$/.test(item.id)||
       !Object.prototype.hasOwnProperty.call(names,item.id)||
       names[item.id]!==item.nameEn||item.identity!=="exact-official-english-source-name"||
       ids.has(item.id)||!Array.isArray(item.sourceRows)||
       item.sourceRows.length<1||item.sourceRows.length>50){
      errors.push("Invalid source item ID or unreviewed name");continue;
    }
    ids.add(item.id);
    for(const row of item.sourceRows){
      if(!exact(row,["sourceRowNumber","fieldsRaw"])||
         !positive(row.sourceRowNumber)||recordRows.has(row.sourceRowNumber)||
         !obj(row.fieldsRaw)||!Object.keys(row.fieldsRaw).length||
         Object.keys(row.fieldsRaw).some(k=>!fields.has(k)||!raw(row.fieldsRaw[k]))){
        errors.push("Invalid source row/field value");continue;
      }
      recordRows.add(row.sourceRowNumber);
    }
  }
  return {ok:errors.length===0,errors,records:errors.length?[]:data.records};
}
export function assertClientItemAttributes(data,names){
  const checked=validateClientItemAttributes(data,names);
  if(!checked.ok)throw new Error("Unreviewed client item combat fields: "+checked.errors.join("; "));
  return checked.records;
}
