/**
 * 2026-11-22 passive capture: selection UI messages 0x2139 (1,013 bytes).
 * The 11 nonzero item IDs are extracted from the item-ID field of each preview.
 * No selection odds, item quantities or chosen outcomes are inferred here.
 * No raw packets, network addresses, session identifiers or login data included.
 */
export interface CapturedSelectionPool {
  itemUniqueIds: readonly number[];
  opcode: "0x2139";
  capturedSelectionPreview: true;
  itemGrade: "unknown";
}
export const CAPTURED_SELECTION_POOLS: Readonly<Record<number, CapturedSelectionPool>> = {
  // Asura's Equipment Box, Unique 20907, observed at 17.369 s
  20907: {
    itemUniqueIds: [26,126,226,321,421,516,1403,19016,21016,21116,28203],
    opcode: "0x2139",
    capturedSelectionPreview: true,
    itemGrade: "unknown",
  },
  // Osiris' Equipment Box, Unique 20917, observed at 42.208 s
  20917: {
    itemUniqueIds: [86,161,256,366,461,556,1411,19046,21046,21146,28211],
    opcode: "0x2139",
    capturedSelectionPreview: true,
    itemGrade: "unknown",
  },
};
export function getCapturedSelectionPool(boxId: string | number): CapturedSelectionPool | undefined {
  return CAPTURED_SELECTION_POOLS[Number(boxId)];
}
