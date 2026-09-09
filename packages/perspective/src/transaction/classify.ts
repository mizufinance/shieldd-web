import {
  TransactionView,
  ActionView,
} from '@mizufinance/protobuf/shieldd/core/transaction/v1/transaction_pb';
import { ActionClassification, TransactionClassification } from './classification.js';

export interface ClassificationReturn {
  type: TransactionClassification;
  action?: ActionView;
}

const SIGNATURE_CASES: ActionClassification[] = [
  'transfer',
  'noteReshape',
  'shieldedHostWithdrawal',
  'complianceRegisterAsset',
  'complianceRegisterUser',
  'aggregateBundle',
];

export const TRANSACTION_LABEL_BY_CLASSIFICATION: Record<TransactionClassification, string> = {
  unknown: 'Unknown',
  unknownInternal: 'Unknown (Internal)',
  internalTransfer: 'Internal Transfer',
  send: 'Send',
  receive: 'Receive',
  transfer: 'Transfer',
  noteReshape: 'Note Maintenance',
  shieldedHostWithdrawal: 'Host Withdrawal',
  complianceRegisterAsset: 'Compliance: Register Asset',
  complianceRegisterUser: 'Compliance: Register User',
  aggregateBundle: 'Aggregate Bundle',
};

export const getTransactionClassificationLabel = (txv?: TransactionView): string =>
  TRANSACTION_LABEL_BY_CLASSIFICATION[classifyTransaction(txv).type];

export const classifyTransaction = (txv?: TransactionView): ClassificationReturn => {
  if (!txv) {
    return { type: 'unknown' };
  }

  const actionViews = txv.bodyView?.actionViews ?? [];
  const cases = new Map<string, ActionView>(
    actionViews.flatMap(a => (a.actionView.case ? [[a.actionView.case, a]] : [])),
  );

  for (const signature of SIGNATURE_CASES) {
    const action = cases.get(signature);
    if (action) {
      return { type: signature, action };
    }
  }

  return { type: 'unknown' };
};
