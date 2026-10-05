import {
  ArchiveRangeRequest,
  ArchiveRangeResponse,
  KeyValueResponse,
} from '@mizufinance/protobuf/shieldd/storage/v1/storage_pb';
import { NullifierResponse } from '@mizufinance/protobuf/shieldd/core/component/sct/v1/sct_pb';
import {
  verifyNativeValue,
  verifyNativeNullifier,
  verifyNativeArchiveRange,
} from '../wasm/index.js';
import { ensureWasmInitialized } from './init.js';

/** sdkAnchor must come from the wallet's authenticated SDK state. */
export const verifyValue = async (
  response: KeyValueResponse,
  sdkAnchor: Uint8Array,
  key: string,
): Promise<Uint8Array | undefined> => {
  await ensureWasmInitialized();
  verifyNativeValue(
    response.proof,
    sdkAnchor,
    new TextEncoder().encode(key),
    response.value?.value ?? new Uint8Array(),
    response.value !== undefined,
  );
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

export interface VerifiedArchivePage {
  records: { key: Uint8Array; value: Uint8Array }[];
  next?: Uint8Array;
}

export const verifyArchiveRange = async (
  response: ArchiveRangeResponse,
  sdkAnchor: Uint8Array,
  query: ArchiveRangeRequest,
): Promise<VerifiedArchivePage> => {
  await ensureWasmInitialized();
  const verified = verifyNativeArchiveRange(response.proof, sdkAnchor, query.toBinary()) as {
    records: { key: number[]; value: number[] }[];
    next?: number[];
  };
  return {
    records: verified.records.map(({ key, value }) => ({
      key: new Uint8Array(key),
      value: new Uint8Array(value),
    })),
    ...(verified.next === undefined ? {} : { next: new Uint8Array(verified.next) }),
  };
};
