import { Address } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { bech32mAddress } from '@mizufinance/bech32m/shieldd';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AssetPolicy,
  ComplianceLeaf,
  MsgRegisterAsset,
  MsgRegisterUser,
} from '@mizufinance/protobuf/shieldd/core/component/compliance/v1/compliance_pb';
// Generated bindings must not expose the removed per-person key bundle.
assert.equal(ComplianceLeaf.fields.find(9), undefined);
assert.equal('auditKeys' in new ComplianceLeaf(), false);
const nativeUrl = new URL('../wasm/index.js', import.meta.url);
const api = await import(nativeUrl.href);
await api.default({ module_or_path: await readFile(new URL('index_bg.wasm', nativeUrl)) });
const spend = api.generate_spend_key(
  'comfort ten front cycle churn burger oak absent rice ice urge result art couple benefit cabbage frequent obscure hurry trick segment cool job debate',
);
const fvk = api.get_full_viewing_key(spend);
const address = api.get_address_by_index(fvk, 0, new Uint8Array(12));
assert.equal(
  bech32mAddress(Address.fromBinary(address)),
  'shieldd1qyn84grsmdwknvcwfppfqck9tpucuw9shrv0jy0y7cesz4ln6ucgwk0nlh0f8l09l2qgydjmttsztkggak2g7',
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
console.log(
  'Current registration schema loaded; WASM wallet matches the canonical Jubjub test address; unsigned registration rejected.',
);
// The shipped WASM surface rejects unsupported capabilities and missing witnesses.
const request = {
  version: 2,
  chain_id: 'chain',
  recipient: null,
  challenge: null,
  total: null,
  outputs: [
    {
      reference: { transaction_id: '00'.repeat(32), height: 1, action: { Body: 0 }, output: 0 },
      amount: true,
      asset: true,
      recipient: true,
      predicate: null,
      memo: false,
      spending_control: false,
    },
  ],
};
assert.throws(() => api.disclosure_prepare(JSON.stringify(request), '[]', fvk));
request.outputs[0].spending_control = true;
request.challenge = '11'.repeat(32);
request.recipient = 'development-verifier';
assert.throws(
  () => api.disclosure_prepare(JSON.stringify(request), '[]', fvk),
  /custody signatures/,
);
assert.throws(() => api.disclosure_prepare(JSON.stringify(request), '[]', new Uint8Array()));
assert.throws(() => api.disclosure_export('{}', 'openings'));
assert.throws(() => api.disclosure_export('{}', 'zk'));
assert.throws(() => api.disclosure_inspect('{}'));
assert.throws(() => api.disclosure_verify('{}'));
assert.throws(() => api.disclosure_confirm_acceptance('{}', 'chain', '[]'));
console.log(
  'Shipped WASM disclosure rejects missing witnesses and unsupported custody capabilities.',
);
assert.equal(typeof api.prepare_orbis_packages, 'function');
assert.throws(() => api.prepare_orbis_packages(new Uint8Array(), new Uint8Array(), '{}'));
console.log('Shipped Orbis package adapter is present and rejects missing transaction material.');
