import 'fake-indexeddb/auto'; // Instanitating ViewServer requires opening up IndexedDb connection
import { describe, expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import { ViewServer } from '../wasm/index.js';
import { IdbConstants } from '@mizufinance/types/indexed-db';

const TEST_TABLES = {
  assets: 'assets',
  advice_notes: 'advice_notes',
  spendable_notes: 'spendable_notes',
  swaps: 'swaps',
  fmd_parameters: 'fmd_parameters',
  app_parameters: 'app_parameters',
  gas_prices: 'gas_prices',
  epochs: 'epochs',
  transactions: 'transactions',
  full_sync_height: 'full_sync_height',
  auctions: 'auctions',
  auction_outstanding_reserves: 'auction_outstanding_reserves',
  tree_commitments: 'tree_commitments',
  tree_hashes: 'tree_hashes',
  tree_last_position: 'tree_last_position',
  tree_last_forgotten: 'tree_last_forgotten',
} as const;

describe('wasmViewServer', () => {
  it('opens the view with typed storage constants', async () => {
    // Public fixture from keys.test.ts; key derivation has its own tests.
    const fullViewingKey = Uint8Array.from(
      Buffer.from(
        '0a40a8a1a19918efba962476e4f3f79d1477de74143941c1613cfb2e50e37cb6af03330170cc6f168bb5269fdfd12843915d2aa21f02fc942af4b707feaf15194e12',
        'hex',
      ),
    );
    const idbConstants = {
      name: 'dbName',
      version: 123,
      tables: TEST_TABLES,
    } satisfies IdbConstants;

    const storedTree = {
      hashes: [],
      commitments: [],
      last_forgotten: 0,
      last_position: {
        Position: {
          epoch: 0,
          block: 0,
          commitment: 0,
        },
      },
    };

    const server = await ViewServer.new(fullViewingKey, storedTree, idbConstants);
    expect(server).toBeInstanceOf(ViewServer);
    server.free();
  });
});
