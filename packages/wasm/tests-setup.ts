import { readFile } from 'node:fs/promises';
import { beforeAll } from 'vitest';
import { ensureWasmInitialized } from './src/init.js';

const originalFetch = globalThis.fetch.bind(globalThis);

globalThis.fetch = async (input, init) => {
  const url =
    input instanceof URL
      ? input
      : typeof input === 'string'
        ? new URL(input, import.meta.url)
        : undefined;

  if (url?.protocol === 'file:') {
    const bytes = await readFile(url);
    return new Response(bytes, {
      headers: {
        'content-type': 'application/wasm',
      },
    });
  }

  return originalFetch(input, init);
};

// Compile the development WASM as a fixture, outside each API assertion’s timeout.
beforeAll(ensureWasmInitialized);
