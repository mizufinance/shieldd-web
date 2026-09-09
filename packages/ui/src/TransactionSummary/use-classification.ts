import { useMemo } from 'react';
import { TransactionClassification } from '@mizufinance/perspective/transaction/classification';
import { Metadata } from '@mizufinance/protobuf/shieldd/core/asset/v1/asset_pb';
import { AddressView } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { TransactionInfo } from '@mizufinance/protobuf/shieldd/view/v1/view_pb';
import { classifyTransaction } from '@mizufinance/perspective/transaction/classify';
import { findRelevantAssets } from '@mizufinance/perspective/action-view/relevant-assets';
import { GetMetadata } from '../ActionView/types';
import { isMetadata } from '../AssetSelector';
import { adaptEffects, SummaryEffect } from './adapt-effects';

interface SummaryData {
  type: TransactionClassification;
  effects: SummaryEffect[];
  label: string;
  memo?: string;
  additionalText?: string;
  assets: Metadata[];
  tickers?: string[];
  address?: AddressView;
}

const DEFAULT_MEMO = 'Memo empty';

const CLASSIFICATION_LABEL_MAP: Record<TransactionClassification, string> = {
  unknown: 'Unknown',
  unknownInternal: 'Unknown (Internal)',
  receive: 'Receive',
  send: 'Send',
  internalTransfer: 'Internal Transfer',
  transfer: 'Transfer',
  noteReshape: 'Note Maintenance',
  shieldedHostWithdrawal: 'Withdrawal',
  complianceRegisterAsset: 'Compliance: Register Asset',
  complianceRegisterUser: 'Compliance: Register User',
  aggregateBundle: 'Aggregate Bundle',
};

export const useClassification = (info: TransactionInfo, getMetadataByAssetId?: GetMetadata) => {
  const { type, action } = classifyTransaction(info.view);

  const effects = adaptEffects(info.summary?.effects ?? [], getMetadataByAssetId);

  const relevantAssets = findRelevantAssets(action);
  const assets = useMemo(() => {
    return relevantAssets
      .map(asset => {
        if (isMetadata(asset)) {
          return asset;
        }
        return getMetadataByAssetId?.(asset);
      })
      .filter(Boolean) as Metadata[];
  }, [getMetadataByAssetId, relevantAssets]);

  const memo = info.view?.bodyView?.memoView?.memoView;
  const address = memo?.case === 'visible' ? memo.value.plaintext?.returnAddress : undefined;
  const memoText = memo?.case === 'visible' ? (memo.value.plaintext?.text ?? '') : '';

  let data: SummaryData = {
    type,
    assets,
    effects,
    label: CLASSIFICATION_LABEL_MAP[type],
  };

  if (type === 'send') {
    const recipientEffect = effects.find(
      effect => effect.balances.some(balance => !balance.negative) && effect.address,
    );
    data = {
      ...data,
      address: recipientEffect?.address ?? address,
      memo: memoText || DEFAULT_MEMO,
      additionalText: 'to',
    };
  }

  if (type === 'receive') {
    data = {
      ...data,
      address,
      memo: memoText || DEFAULT_MEMO,
      additionalText: 'from',
    };
  }

  if (type === 'internalTransfer') {
    const sourceEffect = effects.find(
      effect => effect.balances.some(balance => balance.negative) && effect.address,
    );
    const destinationEffect = effects.find(
      effect => effect.balances.some(balance => !balance.negative) && effect.address,
    );
    data = {
      ...data,
      address: destinationEffect?.address ?? sourceEffect?.address,
      memo: memoText || DEFAULT_MEMO,
      additionalText: destinationEffect?.address ? 'to' : 'from',
    };
  }

  return data;
};
