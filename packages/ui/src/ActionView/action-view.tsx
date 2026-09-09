import { FC } from 'react';
import { ActionView as ActionViewMessage } from '@mizufinance/protobuf/shieldd/core/transaction/v1/transaction_pb';
import { ActionViewBaseProps, ActionViewType, ActionViewValueType, GetMetadata } from './types';
import { UnknownAction } from './actions/unknown';

import { HostWithdrawalAction } from './actions/host-withdrawal';

export interface ActionViewProps extends ActionViewBaseProps {
  action: ActionViewMessage;
}

const componentMap = {
  shieldedHostWithdrawal: HostWithdrawalAction,
  unknown: UnknownAction,
} as const satisfies Partial<Record<ActionViewType | 'unknown', unknown>>;

export const ActionView = ({ action, getMetadata }: ActionViewProps) => {
  const type = action.actionView.case ?? 'unknown';
  const Component = (
    type in componentMap ? componentMap[type as keyof typeof componentMap] : UnknownAction
  ) as FC<{
    value?: ActionViewValueType;
    getMetadata?: GetMetadata;
  }>;

  return <Component value={action.actionView.value} getMetadata={getMetadata} />;
};
