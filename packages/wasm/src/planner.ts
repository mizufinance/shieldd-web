import { TransactionPlan } from '@mizufinance/protobuf/shieldd/core/transaction/v1/transaction_pb';
import { TransactionPlannerRequest } from '@mizufinance/protobuf/shieldd/view/v1/view_pb';
import { plan_transaction } from '../wasm/index.js';
import type { IdbConstants } from '@mizufinance/types/indexed-db';
import { FullViewingKey } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { AssetId } from '@mizufinance/protobuf/shieldd/core/asset/v1/asset_pb';
import { ensureWasmInitialized } from './init.js';

export const planTransaction = async (
  idbConstants: IdbConstants,
  request: TransactionPlannerRequest,
  fullViewingKey: FullViewingKey,
  gasFeeToken: AssetId,
  grpcUrl: string,
) => {
  await ensureWasmInitialized();
  const plan = await plan_transaction(
    idbConstants,
    request.toBinary(),
    fullViewingKey.toBinary(),
    gasFeeToken.toBinary(),
    grpcUrl,
  );
  return TransactionPlan.fromBinary(plan);
};
