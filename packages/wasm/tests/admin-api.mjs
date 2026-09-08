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
const registration = api.pocBuildDevUserRegistration(
  address,
  Uint8Array.from([10, 32, ...Array(32).fill(0)]),
  'bankd-api-vector',
);
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
for (const key of ['address', 'scalar', 'registrationLeaf'])
  assert.equal(actual[key], expected[key], key);
console.log('Shipped admin exports, address derivation, scalar, and registration leaf match');
