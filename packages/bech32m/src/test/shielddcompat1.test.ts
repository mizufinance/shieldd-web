import { describe } from 'vitest';
import { generateTests } from './util/generate-tests.js';
import { bech32CompatAddress, compatAddressFromBech32 } from '../shielddcompat1.js';
import { Prefixes } from '../format/prefix.js';
import { Inner } from '../format/inner.js';

describe('compat address conversion', () => {
  const okInner = new Uint8Array([1, 38, 122, 160, 112, 219, 93, 105, 179, 14, 72, 66, 144, 98, 197, 88, 121, 142, 56, 176, 184, 216, 249, 17, 228, 246, 51, 1, 87, 243, 215, 48, 135, 89, 243, 253, 222, 147, 253, 229, 250, 128, 130, 54, 91, 90, 224, 37, 217]);
  const okBech32 = 'shielddcompat11qyn84grsmdwknvcwfppfqck9tpucuw9shrv0jy0y7cesz4ln6ucgwk0nlh0f8l09l2qgydjmttsztkg7tpuy6';

  generateTests(
    Prefixes.shielddcompat1,
    Inner.shielddcompat1,
    okInner,
    okBech32,
    bech32CompatAddress,
    compatAddressFromBech32,
  );
});
