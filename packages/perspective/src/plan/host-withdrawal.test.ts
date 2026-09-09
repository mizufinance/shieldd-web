import { describe, expect, test } from 'vitest';
import { AssetId, Value } from '@mizufinance/protobuf/shieldd/core/asset/v1/asset_pb';
import { AddressIndex } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { Amount } from '@mizufinance/protobuf/shieldd/core/num/v1/num_pb';
import { createHostWithdrawalRequest } from './host-withdrawal.js';

describe('createHostWithdrawalRequest()', () => {
  test('builds a native host transfer', () => {
    const source = new AddressIndex({ account: 7 });
    const value = new Value({
      amount: new Amount({ lo: 42n }),
      assetId: new AssetId({ inner: new Uint8Array(32).fill(3) }),
    });

    const request = createHostWithdrawalRequest({
      value,
      recipient: '  wallet1recipient  ',
      source,
    });

    expect(request.hostWithdrawals).toHaveLength(1);
    expect(request.hostWithdrawals[0]?.value?.equals(value)).toBe(true);
    expect(request.hostWithdrawals[0]?.destination).toEqual({
      case: 'transfer',
      value: expect.objectContaining({ recipient: 'wallet1recipient' }),
    });
    expect(request.source?.equals(source)).toBe(true);
  });

  test('rejects an empty Bankd recipient', () => {
    expect(() =>
      createHostWithdrawalRequest({
        value: new Value(),
        recipient: ' ',
        source: new AddressIndex(),
      }),
    ).toThrow('Bankd recipient is required');
  });
});
