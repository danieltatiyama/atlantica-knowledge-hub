/**
 * User-reviewed scope from in-game Equipment Box selection screenshots (2026-11-22).
 * Names and IDs were reconciled against ItemTypePack.ndt.
 * This is an inventory of BOX ITEMS, not verified reward distributions.
 */
export interface EquipmentBoxEntry {
  slug: string;
  name: string;
  itemUniqueId: string;
  nameTextId: string;
  group: "standard" | "variant";
  baseSlug?: string;
  variantKind?: "supreme" | "enchanted" | "infused";
  enhancementMin?: number;
  enhancementMax?: number;
  setName?: string;
  setLevel?: number;
}

export const EQUIPMENT_BOXES: EquipmentBoxEntry[] = [
  {slug:"spirit-equipment-box",name:"Spirit Equipment Box",itemUniqueId:"20900",nameTextId:"850",group:"standard"},
  {slug:"sea-kings-equipment-box",name:"Sea King's Equipment Box",itemUniqueId:"20904",nameTextId:"851",group:"standard"},
  {slug:"angkor-wat-equipment-box",name:"Angkor Wat Equipment Box",itemUniqueId:"20906",nameTextId:"852",group:"standard"},
  {slug:"asuras-equipment-box",name:"Asura's Equipment Box",itemUniqueId:"20907",nameTextId:"1391",group:"standard"},
  {slug:"insect-equipment-box",name:"Insect Equipment Box",itemUniqueId:"20908",nameTextId:"853",group:"standard"},
  {slug:"bran-castle-equipment-box",name:"Bran Castle Equipment Box",itemUniqueId:"20912",nameTextId:"854",group:"standard",setName:"Walachia",setLevel:50},
  {slug:"dark-knights-equipment-box",name:"Dark Knight's Equipment Box",itemUniqueId:"20913",nameTextId:"1392",group:"standard"},
  {slug:"babylons-equipment-box",name:"Babylon's Equipment Box",itemUniqueId:"20914",nameTextId:"855",group:"standard"},
  {slug:"pyramid-equipment-box",name:"Pyramid Equipment Box",itemUniqueId:"20916",nameTextId:"1208",group:"standard"},
  {slug:"osiris-equipment-box",name:"Osiris' Equipment Box",itemUniqueId:"20917",nameTextId:"1393",group:"standard"},
  {slug:"shoguns-equipment-box",name:"Shogun's Equipment Box",itemUniqueId:"20918",nameTextId:"856",group:"standard"},
  {slug:"volcano-valley-equipment-box",name:"Volcano Valley Equipment Box",itemUniqueId:"20920",nameTextId:"1754",group:"standard"},
  {slug:"conquerors-equipment-box",name:"Conqueror's Equipment Box",itemUniqueId:"20981",nameTextId:"2255",group:"standard"},
  {slug:"freezing-equipment-box",name:"Freezing Equipment Box",itemUniqueId:"25652",nameTextId:"3997",group:"standard"},
  {slug:"divine-equipment-box",name:"Divine Equipment Box",itemUniqueId:"25653",nameTextId:"3998",group:"standard"},
  {slug:"phoenixs-equipment-box",name:"Phoenix's Equipment Box",itemUniqueId:"25629",nameTextId:"3812",group:"standard"},
  {slug:"dragon-gods-equipment-box",name:"Dragon God's Equipment Box",itemUniqueId:"25893",nameTextId:"5921",group:"standard"},
  {slug:"evil-dragon-gods-equipment-box",name:"Evil Dragon God's Equipment Box",itemUniqueId:"22851",nameTextId:"9004",group:"standard"},
  {slug:"evil-phoenixs-equipment-box",name:"Evil Phoenix's Equipment Box",itemUniqueId:"22852",nameTextId:"9005",group:"standard"},
  {slug:"evil-equipment-box",name:"Evil Equipment Box",itemUniqueId:"27275",nameTextId:"9671",group:"standard",setName:"Evil",setLevel:130},
  {slug:"pegasus-equipment-box",name:"Pegasus Equipment Box",itemUniqueId:"13144",nameTextId:"11041",group:"standard",setName:"Pegasus",setLevel:140},
  {slug:"judgment-equipment-box",name:"Judgment Equipment Box",itemUniqueId:"13583",nameTextId:"27597",group:"standard",setName:"Judgment",setLevel:155},
  {slug:"dark-pegasus-equipment-box",name:"Dark Pegasus Equipment Box",itemUniqueId:"13718",nameTextId:"28099",group:"standard",setName:"Dark Pegasus",setLevel:150},
  {slug:"twilight-equipment-box",name:"Twilight Equipment Box",itemUniqueId:"14942",nameTextId:"31616",group:"standard"},
  {slug:"abyssal-equipment-box",name:"Abyssal Equipment Box",itemUniqueId:"16812",nameTextId:"35998",group:"standard"},
  {slug:"apocalypse-equipment-box",name:"Apocalypse Equipment Box",itemUniqueId:"4835",nameTextId:"43865",group:"standard"},

  // User report: Supreme/Enchanted use the base pool with +0..+3.
  {slug:"supreme-evil-equipment-box",name:"Supreme Evil Equipment Box",itemUniqueId:"22850",nameTextId:"9003",group:"variant",baseSlug:"evil-equipment-box",variantKind:"supreme",enhancementMin:0,enhancementMax:3},
  {slug:"enchanted-pegasus-equipment-box",name:"Enchanted Pegasus Equipment Box",itemUniqueId:"13400",nameTextId:"26937",group:"variant",baseSlug:"pegasus-equipment-box",variantKind:"enchanted",enhancementMin:0,enhancementMax:3},
  {slug:"enchanted-judgment-equipment-box",name:"Enchanted Judgment Equipment Box",itemUniqueId:"14065",nameTextId:"29389",group:"variant",baseSlug:"judgment-equipment-box",variantKind:"enchanted",enhancementMin:0,enhancementMax:3},
  {slug:"enchanted-dark-pegasus-equipment-box",name:"Enchanted Dark Pegasus Equipment Box",itemUniqueId:"14349",nameTextId:"30021",group:"variant",baseSlug:"dark-pegasus-equipment-box",variantKind:"enchanted",enhancementMin:0,enhancementMax:3},

  // User report: Infused boxes use the base pool with +4..+6.
  {slug:"infused-evil-equipment-box",name:"Infused Evil Equipment Box",itemUniqueId:"13403",nameTextId:"26940",group:"variant",baseSlug:"evil-equipment-box",variantKind:"infused",enhancementMin:4,enhancementMax:6},
  {slug:"infused-pegasus-equipment-box",name:"Infused Pegasus Equipment Box",itemUniqueId:"13404",nameTextId:"26941",group:"variant",baseSlug:"pegasus-equipment-box",variantKind:"infused",enhancementMin:4,enhancementMax:6},
  {slug:"infused-judgment-equipment-box",name:"Infused Judgment Equipment Box",itemUniqueId:"14516",nameTextId:"30502",group:"variant",baseSlug:"judgment-equipment-box",variantKind:"infused",enhancementMin:4,enhancementMax:6},
];

export function getEquipmentBoxBySlug(slug: string): EquipmentBoxEntry | undefined {
  return EQUIPMENT_BOXES.find((entry) => entry.slug === slug);
}
