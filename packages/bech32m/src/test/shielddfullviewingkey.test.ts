import { describe } from 'vitest';
import { bech32mFullViewingKey, fullViewingKeyFromBech32m } from '../shielddfullviewingkey.js';
import { generateTests } from './util/generate-tests.js';
import { Prefixes } from '../format/prefix.js';
import { Inner } from '../format/inner.js';

describe('fvk conversion', () => {
  const okInner = new Uint8Array([1, 233, 156, 121, 254, 123, 37, 201, 174, 0, 78, 171, 237, 172, 164, 208, 52, 66, 193, 61, 66, 171, 0, 123, 215, 179, 105, 102, 99, 92, 95, 250, 94, 60, 51, 44, 46, 51, 221, 67, 223, 15, 100, 226, 109, 248, 245, 227, 234, 160, 159, 93, 153, 146, 140, 226, 43, 9, 183, 238, 2, 24, 17, 153, 112]);
  const okBech32 = 'shielddfullviewingkey1q85ec7070vjuntsqf647mt9y6q6y9sfag24sq77hkd5kvc6utla9u0pn9shr8h2rmu8kfcndlr67864qnaweny5vug4sndlwqgvprxts0vvmuu';

  generateTests(
    Prefixes.shielddfullviewingkey,
    Inner.shielddfullviewingkey,
    okInner,
    okBech32,
    bech32mFullViewingKey,
    fullViewingKeyFromBech32m,
  );
});
