import {
  IbcChannelMsgService,
  IbcChannelService,
  IbcClientMsgService,
  IbcClientService,
  IbcConnectionMsgService,
  IbcConnectionService,
} from './services/cosmos-ibc-core.js';
import type { CustodyService } from './services/shieldd-custody.js';
import type { ViewService } from './services/shieldd-view.js';
import type {
  AppService,
  CompactBlockService,
  FeeService,
  SctService,
  ShieldedPoolService,
} from './services/shieldd-core.js';
import type { TendermintProxyService } from './services/shieldd-util.js';

export type ShielddService =
  | typeof AppService
  | typeof CompactBlockService
  | typeof CustodyService
  | typeof FeeService
  | typeof IbcChannelService
  | typeof IbcChannelMsgService
  | typeof IbcClientService
  | typeof IbcClientMsgService
  | typeof IbcConnectionService
  | typeof IbcConnectionMsgService
  | typeof SctService
  | typeof ShieldedPoolService
  | typeof TendermintProxyService
  | typeof ViewService;
