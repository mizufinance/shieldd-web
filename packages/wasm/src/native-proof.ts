import { KeyValueResponse } from '@mizufinance/protobuf/shieldd/storage/v1/storage_pb';
import { NullifierResponse } from '@mizufinance/protobuf/shieldd/core/component/sct/v1/sct_pb';
import { verifyNativeValue, verifyNativeNullifier } from '../wasm/index.js';
import { ensureWasmInitialized } from './init.js';

/** sdkAnchor must come from the wallet's authenticated SDK state. */
export const verifyValue = async (
  response: KeyValueResponse,
  sdkAnchor: Uint8Array,
  key: string,
): Promise<Uint8Array | undefined> => {
  await ensureWasmInitialized();
  verifyNativeValue(response.proof, sdkAnchor, new TextEncoder().encode(key),
    response.value?.value ?? new Uint8Array(), response.value !== undefined);
  return response.value?.value;
};

export const verifyNullifier = async (
  response: NullifierResponse,
  sdkAnchor: Uint8Array,
  requested: Uint8Array,
): Promise<boolean> => {
  await ensureWasmInitialized();
  return verifyNativeNullifier(response.toBinary(), sdkAnchor, requested);
};


