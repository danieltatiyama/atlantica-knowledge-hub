/**
 * English names for the 84 MATERIAL IDs referenced by the 551 reviewed
 * equipment definitions at NA Miner snapshot 1.
 *
 * Names were individually joined by numeric ID to the original
 * 23,586-item private Miner source inventory. Every included identity has
 * one unambiguous official English base name. Conflicted/untranslated
 * source IDs are NEVER guessed or included.
 *
 * Not a comprehensive item name registry; do not create public item pages
 * for these materials without a separate reviewed identity/catalog flow.
 */
const MATERIAL_NAMES_TSV = String.raw`2145|Alchemist's Stone
3006|Monster Egg
4322|Riederan's Soul Stone of the Dead
4819|Abyssal Oriharukon
4820|Abyssal Obsidian
5002|Oil
5004|Imitation Oriharukon
5009|Iron Sand
5013|Titanium Ingot
5014|Enhanced Titanium Ingot
5020|Copper Ore
5045|Gold Ingot
5051|Enriched Adamantium Ingot
5055|Silver Ingot
5068|Platinum Ingot
5080|Pearl
5096|Refined Mithril Ingot
5100|Coral
5333|Tanzanite
5334|Opal
5335|Ruby
5340|Large Diamond
5342|Adamantium
5343|Adamantium Ingot
5348|Fused Devil Stone
6001|Thick Tree Branch
6002|Slab of Lumber
6003|Big Slab of Lumber
6050|Pine
6080|Maple
7044|Colorful Fabric
7047|Gorgeous Colorful Fabric
7050|Thread
7060|Embroidery Thread
7080|Silver Thread
8000|Broken Animal Bones
8002|Thick Animal Bone
8003|Large Animal Bone
8047|Dragon God's Ire
8048|Weapon & Armor Mold
8067|Root of Life
8068|Sorcerer's Mask
8069|Pegasus Tear
8164|Corrupted Unicorn Tear
8165|Anarchy Stone
8189|Light of Judgment
8292|Shard of Beginning
8293|Sunset Afterglow
8357|Phoenix's Feather
8369|Dragon God's Wishstone
8374|Atlantis Platinum Coin
8377|Energy of Hail
8378|Energy of Sky
8385|Energy of Wind
8390|Frozen Soul
8398|Atlantis Silver Coin
8399|Atlantis Gold Coin
8462|Riederan's Soul Shard
8463|Voice of Terror
8464|Historical Essence
8494|Darkness Origin
16001|Oriental Mushroom
19110|Van Gogh's Soul Stone
19113|Heavenly Crystal
19115|Evil Imprint
19116|Vindictive Soul Imprint
20312|Crazy Lord's Seal
20313|Ghost Mask
20317|Evil Soul Extract
20319|Hydra's Poisonous Gland
20339|Oriharukon
21596|Obsidian Shard
28013|Animal Replica
28300|Earth Element Shard
28301|Sea Element Shard
28302|Flame Element Shard
28303|Storm Element Shard
28304|Earth Element
28305|Sea Element
28306|Flame Element
28307|Storm Element
28308|Earth Essence
29217|Craftsman's Soul
29218|Expert's Soul`;

const data = Object.create(null);
for (const line of MATERIAL_NAMES_TSV.split("\n")) {
  const separator = line.indexOf("|");
  const id = line.slice(0, separator);
  const name = line.slice(separator + 1);
  if (!/^[1-9]\d*$/.test(id) || !name || name !== name.trim() ||
      /[<>{}\n\r\\]/.test(name) || Object.hasOwn(data, id)) {
    throw new Error("Material name registry has an invalid source entry");
  }
  data[id] = name;
}

export const CLIENT_MATERIAL_NAMES_EN = Object.freeze(data);
export const CLIENT_MATERIAL_NAME_COUNT = Object.keys(data).length;
export const CLIENT_MATERIAL_SOURCE_SNAPSHOT = 1;
export function getClientMaterialName(id) {
  return Object.hasOwn(data, String(id)) ? data[String(id)] : undefined;
}
