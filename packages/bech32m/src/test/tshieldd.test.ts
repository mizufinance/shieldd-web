import { describe } from 'vitest';
import { generateTests } from './util/generate-tests.js';
import { bech32TransparentAddress, transparentAddressFromBech32 } from '../tshieldd.js';
import { Prefixes } from '../format/prefix.js';
import { Inner } from '../format/inner.js';

describe('transparent address conversion', () => {
  const okInner = new Uint8Array([
    1, 102, 236, 169, 166, 203, 152, 194, 89, 236, 246, 59, 69, 221, 32, 49, 49, 83, 29, 119, 117,
    124, 201, 194, 156, 219, 251, 137, 202, 157, 235, 1, 15,
  ]);
  const okBech32 = 'tshieldd1q9nwe2dxewvvyk0v7ca5thfqxyc4x8thw47vns5um0acnj5aavqs702t7j9';

  generateTests(
    Prefixes.tshieldd,
    Inner.tshieldd,
    okInner,
    okBech32,
    bech32TransparentAddress,
    transparentAddressFromBech32,
  );
});
