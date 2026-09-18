import { Transaction, TransactionPlan } from '@mizufinance/protobuf/shieldd/core/transaction/v1/transaction_pb';
import { prepare_orbis_packages } from '../wasm/index.js';
import { ensureWasmInitialized } from './init.js';

export type AuditField = 'amount' | 'sender' | 'receiver';
export interface AuditPolicy {
  ring_id: string;
  policy_id: string;
  resource: string;
  permission: string;
}
export interface OrbisDelivery {
  ring_pk: number[];
  policy: AuditPolicy;
}

/** Contains upstream ciphertext only; it is separate from the transaction protobuf. */
export interface SealedAuditPackage {
  version: 1;
  binding: {
    chain_id: string;
    transaction_id: string;
    action: number;
    output: number;
    asset_id: string;
    field: AuditField;
    tier: 'output_core' | 'output_ext' | 'sender_ext';
    epoch: number;
    policy: AuditPolicy;
    delivery: AuditPolicy;
  };
  context: {
    ring_pk: number[];
    policy_id: string;
    resource: string;
    permission: string;
    tier: string;
    timestamp: number;
    salt: null;
  };
  secret: { enc_cmt: number[]; encrypted_data: number[]; nonce: number[] };
  proof: { challenge: number[]; response: number[] };
}

export async function prepareOrbisPackages(plan: TransactionPlan, transaction: Transaction, delivery: OrbisDelivery): Promise<SealedAuditPackage[]> {
  await ensureWasmInitialized();
  return JSON.parse(prepare_orbis_packages(plan.toBinary(), transaction.toBinary(), JSON.stringify(delivery))) as SealedAuditPackage[];
}
