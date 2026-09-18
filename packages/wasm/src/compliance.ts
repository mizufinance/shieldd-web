import {
  AssetPolicy,
  MsgRegisterAsset,
  MsgRegisterUser,
} from '@mizufinance/protobuf/shieldd/core/component/compliance/v1/compliance_pb';

import {
  validateUserRegistration as validateUserRegistrationWasm,
  validateAssetRegistration as validateAssetRegistrationWasm,
} from '../wasm/index.js';
import { ensureWasmInitialized } from './init.js';

export const validateAssetRegistration = async (
  message: MsgRegisterAsset,
  chainId: string,
): Promise<MsgRegisterAsset> => {
  await ensureWasmInitialized();
  return MsgRegisterAsset.fromBinary(
    validateAssetRegistrationWasm(
      message.toBinary(),
      chainId,
      BigInt(Math.floor(Date.now() / 1000)),
    ),
  );
};

export const validateUserRegistration = async (
  message: MsgRegisterUser,
  policy: AssetPolicy,
  chainId: string,
): Promise<MsgRegisterUser> => {
  await ensureWasmInitialized();
  return MsgRegisterUser.fromBinary(
    validateUserRegistrationWasm(
      message.toBinary(),
      policy.toBinary(),
      chainId,
      BigInt(Math.floor(Date.now() / 1000)),
    ),
  );
};
