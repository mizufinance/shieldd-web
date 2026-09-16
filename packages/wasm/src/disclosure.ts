import { FullViewingKey } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import {
  disclosure_prepare,
  disclosure_export,
  disclosure_inspect,
  disclosure_verify,
  disclosure_confirm_acceptance,
} from '../wasm/index.js';
import { ensureWasmInitialized } from './init.js';

export type DisclosureMethod = 'openings' | 'payload-keys';

/** Witness JSON contains private notes. Keep it in memory, never upload it to a prover. */
export async function prepareDisclosure(
  requestJson: string,
  committedTransactionsBase64: readonly string[],
  fullViewingKey: FullViewingKey,
): Promise<string> {
  await ensureWasmInitialized();
  return disclosure_prepare(
    requestJson,
    JSON.stringify(committedTransactionsBase64),
    fullViewingKey.toBinary(),
  );
}

export async function exportDisclosure(
  witnessJson: string,
  method: DisclosureMethod,
): Promise<string> {
  await ensureWasmInitialized();
  return disclosure_export(witnessJson, method);
}

/** Preview includes payload-key access to transaction-wide memo data. */
export async function inspectDisclosure(packageJson: string): Promise<string> {
  await ensureWasmInitialized();
  return disclosure_inspect(packageJson);
}

/** Checks cryptography only; an unavailable ZK backend throws instead of reporting false. */
export async function verifyDisclosure(packageJson: string): Promise<string> {
  await ensureWasmInitialized();
  return disclosure_verify(packageJson);
}

export interface CommittedDisclosureBlock {
  height: string;
  transactions: readonly string[];
}

/** Fetch blocks independently of the evidence from the verifier's chosen node. */
export async function confirmDisclosureAcceptance(
  packageJson: string,
  chainId: string,
  blocks: readonly CommittedDisclosureBlock[],
): Promise<string> {
  await ensureWasmInitialized();
  // Rust's JSON u64 expects a number; reject values JS cannot represent exactly.
  const encoded = blocks.map(block => {
    if (!/^\d+$/.test(block.height) || !Number.isSafeInteger(Number(block.height))) {
      throw new Error('Block height exceeds the supported browser integer range');
    }
    return { height: Number(block.height), transactions: block.transactions };
  });
  return disclosure_confirm_acceptance(packageJson, chainId, JSON.stringify(encoded));
}
