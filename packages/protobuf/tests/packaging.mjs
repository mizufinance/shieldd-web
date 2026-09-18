import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
let checked = 0;
for (const file of await readdir(root, { recursive: true })) {
  if (!file.endsWith('.js')) continue;
  const module = resolve(root, file);
  for (const [, dependency] of (await readFile(module, 'utf8')).matchAll(
    /(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g,
  )) {
    const path = resolve(dirname(module), dependency);
    assert.ok(
      await stat(path).then(
        value => value.isFile(),
        () => false,
      ),
      `${file} imports missing ${dependency}`,
    );
    checked++;
  }
}
assert.ok(checked > 0, 'No generated module dependencies checked');
console.log(`Checked ${checked} generated protobuf module dependencies.`);
