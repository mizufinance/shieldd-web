import type { Prefix } from './prefix.js';

export const ByteLength = {
  passet: 32,
  pauctid: 32,
  shieldd: 49,
  shielddcompat1: 49,
  shielddfullviewingkey: 65,
  shielddgovern: 32,
  shielddspendkey: 33,
  shielddvalid: 32,
  shielddwalletid: 32,
  plpid: 32,
  tshieldd: 33,
} as const satisfies Required<Record<Prefix, number>>;
