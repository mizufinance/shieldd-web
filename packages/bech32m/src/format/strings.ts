import type { Prefix } from './prefix.js';

export const StringLength = {
  passet: 65,
  pauctid: 66,
  shieldd: 93,
  shielddfullviewingkey: 132,
  shielddgovern: 72,
  shielddspendkey: 75,
  shielddvalid: 71,
  shielddwalletid: 74,
  plpid: 64,
  shielddcompat1: 100,
  tshieldd: 68,
} as const satisfies Required<Record<Prefix, number>>;
