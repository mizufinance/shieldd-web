import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AssetPolicy,
  MsgRegisterAsset,
  MsgRegisterUser,
} from '@mizufinance/protobuf/shieldd/core/component/compliance/v1/compliance_pb';
const nativeUrl = new URL('../wasm/index.js', import.meta.url);
const api = await import(nativeUrl.href);
await api.default({ module_or_path: await readFile(new URL('index_bg.wasm', nativeUrl)) });
const spend = api.generate_spend_key(
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
);
const fvk = api.get_full_viewing_key(spend);
const address = api.get_address_by_index(fvk, 0, new Uint8Array(12));
assert.equal(
  Buffer.from(address).toString('hex'),
  '0a30cd3f998f398c881a6e3e3d257aa60454d3f677440294c67353171720667a2ccd9aa2181e4ad19e1e7b8cdcf36e6ad61c',
);
const now = BigInt(Math.floor(Date.now() / 1000));
assert.throws(() => api.validateAssetRegistration(new MsgRegisterAsset().toBinary(), 'chain', now));
assert.throws(() =>
  api.validateUserRegistration(
    new MsgRegisterUser().toBinary(),
    new AssetPolicy().toBinary(),
    'chain',
    now,
  ),
);
console.log('WASM wallet address vector preserved; unsigned registration rejected.');
