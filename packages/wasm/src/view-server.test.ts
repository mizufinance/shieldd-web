import 'fake-indexeddb/auto'; // Instanitating ViewServer requires opening up IndexedDb connection
import { describe, expect, it } from 'vitest';
import { generateSpendKey, getFullViewingKey } from './keys.js';
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
    const spendKey = await generateSpendKey(
      'benefit cherry cannon tooth exhibit law avocado spare tooth that amount pumpkin scene foil tape mobile shine apology add crouch situate sun business explain',
    );
    const fullViewingKey = (await getFullViewingKey(spendKey)).toBinary();
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
