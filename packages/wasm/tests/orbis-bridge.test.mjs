import assert from 'node:assert/strict';
import { test } from 'node:test';
import { upgradeOrbisAuditPackage } from '../src/orbis.ts';

const field = (value) => [value, ...Array(31).fill(0)];
const pkg = {
  transfer_epk: [...Buffer.from('bc5ffbb7f13ea8eeb0f0364910fb6331945996a1d2389d6ac48ded74b3e2a503', 'hex')],
  transfer_c2: field(140),
  transfer_shared_fq: field(41),
};

test('matches the shipped admin cross-language seed-binding vector', async () => {
  const result = await upgradeOrbisAuditPackage(pkg);
  assert.equal(Buffer.from(result.transfer_seed_binding).toString('hex'),
    '888b78b7406ed3064191e25970e26bde485486b23681db68db710491b1b6b849');
  assert.equal('transfer_shared_fq' in result, false);
  assert.deepEqual(result.transfer_epk, pkg.transfer_epk);
});

test('rejects malformed lengths and noncanonical fields', async () => {
  await assert.rejects(upgradeOrbisAuditPackage({ ...pkg, transfer_epk: [0] }), /32 bytes/);
  await assert.rejects(upgradeOrbisAuditPackage({ ...pkg, transfer_c2: Array(32).fill(255) }), /canonical/);
});
