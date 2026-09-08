import type { OrbisAuditPackage } from './orbis.js';
import { Address } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { FullViewingKey } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { AssetId } from '@mizufinance/protobuf/shieldd/core/asset/v1/asset_pb';
import {
  AssetPolicy,
  MsgRegisterAsset,
  MsgRegisterUser,
} from '@mizufinance/protobuf/shieldd/core/component/compliance/v1/compliance_pb';

import {
  deriveComplianceScalarForAddress,
  pocBuildDevUserRegistration,
  pocOrbisAuditBundles as pocOrbisAuditBundlesWasm,
  pocSignDevAssetRegistration,
} from '../wasm/index.js';
import { ensureWasmInitialized } from './init.js';

export {
  upgradeOrbisAuditPackage,
  type LegacyOrbisAuditPackage,
  type OrbisAuditPackage,
} from './orbis.js';

export interface OrbisTierBundle {
  sender_core: OrbisAuditPackage;
  sender_ext: OrbisAuditPackage;
  output_core: OrbisAuditPackage;
  output_ext: OrbisAuditPackage;
}

export interface OrbisAuditBundle {
  subject: OrbisTierBundle;
  investigation: OrbisTierBundle;
}

export interface LocatedOrbisAuditBundle {
  actionIndex: number;
  outputIndex: number;
  bundle: OrbisAuditBundle;
}

export const deriveComplianceScalar = async (address: Address): Promise<Uint8Array> => {
  await ensureWasmInitialized();
  return deriveComplianceScalarForAddress(address.toBinary());
};

export const pocOrbisAuditBundles = async (
  plan: Uint8Array,
): Promise<LocatedOrbisAuditBundle[]> => {
  await ensureWasmInitialized();
  return pocOrbisAuditBundlesWasm(plan) as LocatedOrbisAuditBundle[];
};

export const signDevAssetRegistration = async (
  message: MsgRegisterAsset,
): Promise<MsgRegisterAsset> => {
  await ensureWasmInitialized();
  return MsgRegisterAsset.fromBinary(pocSignDevAssetRegistration(message.toBinary()));
};

export const buildDevUserRegistration = async (
  address: Address,
  assetId: AssetId,
  policy: AssetPolicy,
  fullViewingKey: FullViewingKey,
  chainId: string,
): Promise<MsgRegisterUser> => {
  await ensureWasmInitialized();
  return MsgRegisterUser.fromBinary(
    pocBuildDevUserRegistration(
      address.toBinary(),
      assetId.toBinary(),
      policy.toBinary(),
      fullViewingKey.toBinary(),
      chainId,
    ),
  );
};
