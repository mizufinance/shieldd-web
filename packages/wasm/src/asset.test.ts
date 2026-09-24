import { describe, test, expect } from 'vitest';
import { assetIdFromBaseDenom } from './asset.js';
import { AssetId } from '@mizufinance/protobuf/shieldd/core/asset/v1/asset_pb';
import { randomBytes } from 'crypto';
import { assetIdFromBech32m } from '@mizufinance/bech32m/passet';

// not human legible or restricted to any charset
const randomString = (byteLength = 32) =>
  randomBytes(1 + Math.random() * (byteLength - 1)).toString();

describe('assetIdFromBaseDenom', () => {
  test('should return the correct asset id for a known asset id', async () => {
    // BLAKE2b-512(personal='Shieldd_AssetID', 'ushieldd'), reduced into
    // the BLS12-381 scalar field and encoded little-endian as passet.
    const ushielddFromBech32m = new AssetId(
      assetIdFromBech32m('passet1yqxkeed0gc2cfljnsqzmtcsxmdu49gfuj2dmsee67uwwedghsu7qkfpkzj'),
    );

    const ushielddFromBaseDenom = await assetIdFromBaseDenom('ushieldd');

    expect(AssetId.equals(ushielddFromBech32m, ushielddFromBaseDenom)).toBeTruthy();
  });

  test('should return a 32-byte asset id for any string', async () => {
    const randomIds = await Promise.all(
      Array.from(Array(10), randomString).map(denom => assetIdFromBaseDenom(denom)),
    );

    expect(
      randomIds.every(
        id => id instanceof AssetId && id.inner instanceof Uint8Array && id.inner.length === 32,
      ),
    ).toBeTruthy();
  });

  test('should return same asset id for same string', async () => {
    const sameAltBaseDenom = randomString();
    const a1 = await assetIdFromBaseDenom(sameAltBaseDenom);
    const a2 = await assetIdFromBaseDenom(sameAltBaseDenom);

    expect(a1.inner).toEqual(a2.inner);
  });

  test(
    'should return different asset id for different strings',
    { retry: 2 }, // there is a chance that this test could fail randomly :)
    async () => {
      const someAltBaseDenom = randomString();
      const differentAltBaseDenom = randomString();
      const a = await assetIdFromBaseDenom(someAltBaseDenom);
      const b = await assetIdFromBaseDenom(differentAltBaseDenom);

      expect(a.inner).not.toEqual(b.inner);
    },
  );
});
