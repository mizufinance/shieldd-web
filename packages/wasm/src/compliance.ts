import { upgradeOrbisAuditPackage } from './orbis.js';
import type { LegacyOrbisAuditPackage, OrbisAuditPackage } from './orbis.js';
export { upgradeOrbisAuditPackage } from './orbis.js';
export type { LegacyOrbisAuditPackage, OrbisAuditPackage } from './orbis.js';
import { Address } from '@mizufinance/protobuf/shieldd/core/keys/v1/keys_pb';
import { AssetId } from '@mizufinance/protobuf/shieldd/core/asset/v1/asset_pb';
import {
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

const bindTier = async (tier: {
  sender_core: LegacyOrbisAuditPackage;
  sender_ext: LegacyOrbisAuditPackage;
  output_core: LegacyOrbisAuditPackage;
  output_ext: LegacyOrbisAuditPackage;
}) => ({
  sender_core: await upgradeOrbisAuditPackage(tier.sender_core),
  sender_ext: await upgradeOrbisAuditPackage(tier.sender_ext),
  output_core: await upgradeOrbisAuditPackage(tier.output_core),
  output_ext: await upgradeOrbisAuditPackage(tier.output_ext),
});

export const deriveComplianceScalar = async (address: Address): Promise<Uint8Array> => {
  await ensureWasmInitialized();
  return deriveComplianceScalarForAddress(address.toBinary());
};

export const pocOrbisAuditBundles = async (
  plan: Uint8Array,
): Promise<LocatedOrbisAuditBundle[]> => {
  await ensureWasmInitialized();
  const bundles = pocOrbisAuditBundlesWasm(plan) as Array<
    Omit<LocatedOrbisAuditBundle, 'bundle'> & {
      bundle: {
        subject: Parameters<typeof bindTier>[0];
        investigation: Parameters<typeof bindTier>[0];
      };
    }
  >;
  return Promise.all(
    bundles.map(async located => ({
      ...located,
      bundle: {
        subject: await bindTier(located.bundle.subject),
        investigation: await bindTier(located.bundle.investigation),
      },
    })),
  );
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
  policyId: string,
): Promise<MsgRegisterUser> => {
  await ensureWasmInitialized();
  return MsgRegisterUser.fromBinary(
    pocBuildDevUserRegistration(address.toBinary(), assetId.toBinary(), policyId),
  );
};
