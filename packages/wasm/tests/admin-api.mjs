import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const dir = new URL('../wasm/', import.meta.url).pathname;
const api = await import(pathToFileURL(`${dir}/index.js`));
await api.default({ module_or_path: await readFile(`${dir}/index_bg.wasm`) });
const spend = api.generate_spend_key(
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
);
const fvk = api.get_full_viewing_key(spend);
const address = api.get_address_by_index(fvk, 0, new Uint8Array(12));
const scalar = api.deriveComplianceScalarForAddress(address);
function field(number, bytes) {
  return Buffer.concat([Buffer.from([number * 8 + 2, bytes.length]), Buffer.from(bytes)]);
}
const generator = Uint8Array.from([8, ...Array(31).fill(0)]);
const policy = Buffer.concat([
  field(1, generator),
  field(2, Array(16).fill(255)),
  field(4, Buffer.from('bankd-dev-ring')),
  field(5, generator),
  field(6, Buffer.from('bankd-api-vector')),
  field(7, Buffer.from('read')),
  field(8, Buffer.from('document')),
]);
const asset = Uint8Array.from([10, 32, ...Array(32).fill(0)]);
const registration = api.pocBuildDevUserRegistration(address, asset, policy, fvk, 'bankd-vector');
assert.throws(() => api.pocBuildDevUserRegistration(address, asset, policy, fvk, ''));
function fields(bytes) {
  let p = 0;
  const out = [];
  function varint() {
    let n = 0,
      shift = 0;
    for (;;) {
      const b = bytes[p++];
      n += (b & 127) * 2 ** shift;
      if (!(b & 128)) return n;
      shift += 7;
    }
  }
  while (p < bytes.length) {
    const tag = varint(),
      wire = tag & 7;
    if (wire === 2) {
      const len = varint();
      out.push([tag >>> 3, Buffer.from(bytes.slice(p, p + len)).toString('hex')]);
      p += len;
    } else if (wire === 0) out.push([tag >>> 3, varint()]);
    else throw Error(`unsupported wire ${wire}`);
  }
  return out;
}
const actual = {
  exports: Object.keys(api).sort(),
  address: Buffer.from(address).toString('hex'),
  scalar: Buffer.from(scalar).toString('hex'),
  registrationLeaf: fields(registration).find(([n]) => n === 1)?.[1],
};
const expected = JSON.parse(await readFile(new URL('./admin-api.json', import.meta.url), 'utf8'));
for (const name of expected.exports)
  assert.ok(actual.exports.includes(name), `missing shipped export: ${name}`);
for (const key of ['address', 'scalar']) assert.equal(actual[key], expected[key], key);
const leaf = fields(Buffer.from(actual.registrationLeaf, 'hex'));
const oldLeaf = fields(Buffer.from(expected.registrationLeaf, 'hex'));
for (const tag of [1, 2])
  assert.deepEqual(
    leaf.find(([n]) => n === tag),
    oldLeaf.find(([n]) => n === tag),
  );
for (const tag of [3, 4, 5]) assert.equal(leaf.find(([n]) => n === tag)?.[1].length, 64);
const certificate = fields(registration).find(([n]) => n === 3)?.[1];
assert.ok(certificate, 'current registration must carry a capability certificate');
console.log(
  'Shipped exports and key vectors match; current registration contains a certified leaf',
);
