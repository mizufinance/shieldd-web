import { describe } from 'vitest';
import { spendKeyFromBech32m, bech32mSpendKey } from '../shielddspendkey.js';
import { generateTests } from './util/generate-tests.js';
import { Prefixes } from '../format/prefix.js';
import { Inner } from '../format/inner.js';

describe('spend key conversion', () => {
  const okBech32 = 'shielddspendkey1q8xzg6c6d8achnqw7a3zzuccyz662p9tk647a2a6rkvfj0g6j4f6veu0d8h';
  const okInner = new Uint8Array([1, 204, 36, 107, 26, 105, 251, 139, 204, 14, 247, 98, 33, 115, 24, 32, 181, 165, 4, 171, 182, 171, 238, 171, 186, 29, 152, 153, 61, 26, 149, 83, 166]);

  generateTests(
    Prefixes.shielddspendkey,
    Inner.shielddspendkey,
    okInner,
    okBech32,
    bech32mSpendKey,
    spendKeyFromBech32m,
  );
});
