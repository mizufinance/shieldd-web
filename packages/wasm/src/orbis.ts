export interface LegacyOrbisAuditPackage {
  access: 'subject' | 'investigation'
  derivation?: number[] | Uint8Array | null
  ring_id: string
  policy_id: string
  resource: string
  permission: string
  tier_label: string
  timestamp: number
  salt: string
  encrypted_document: number[] | Uint8Array
  enc_cmt: number[] | Uint8Array
  shared_point: number[] | Uint8Array
  orbis_challenge: number[] | Uint8Array
  orbis_response: number[] | Uint8Array
  effective_pk: number[] | Uint8Array
  metadata_hash: number[] | Uint8Array
  transfer_epk: number[] | Uint8Array
  transfer_c2: number[] | Uint8Array
  transfer_shared_fq: number[] | Uint8Array
  tier_ciphertext: number[] | Uint8Array
}

export type OrbisAuditPackage = Omit<LegacyOrbisAuditPackage, 'transfer_shared_fq'> & { transfer_seed_binding: number[] }

const FQ_MODULUS = BigInt('0x12ab655e9a2ca55660b44d1e5c37b00159aa76fed00000010a11800000000001');
const TRANSFER_SEED_BINDING_DOMAIN = new TextEncoder().encode('shieldd-transfer-seed-binding-v1');
const littleEndianBigInt = (value: number[] | Uint8Array) => Array.from(value).reduceRight((result, byte) => (result << 8n) | BigInt(byte), 0n);
const littleEndianBytes = (value: bigint) => {
    const result = new Array(32);
    for (let index = 0; index < result.length; index += 1) {
        result[index] = Number(value & 0xffn);
        value >>= 8n;
    }
    return result;
};
export const upgradeOrbisAuditPackage = async (pkg: LegacyOrbisAuditPackage): Promise<OrbisAuditPackage> => {
    const epk = Array.from(pkg.transfer_epk);
    const c2 = Array.from(pkg.transfer_c2);
    const shared = Array.from(pkg.transfer_shared_fq);
    if (epk.length !== 32 || c2.length !== 32 || shared.length !== 32) {
        throw new Error('Shieldd transfer audit fields must be 32 bytes');
    }
    const c2Field = littleEndianBigInt(c2);
    const sharedField = littleEndianBigInt(shared);
    if (c2Field >= FQ_MODULUS || sharedField >= FQ_MODULUS) {
        throw new Error('Shieldd transfer audit field is not canonical');
    }
    const seed = littleEndianBytes((c2Field - sharedField + FQ_MODULUS) % FQ_MODULUS);
    const input = new Uint8Array(TRANSFER_SEED_BINDING_DOMAIN.length + 96);
    input.set(TRANSFER_SEED_BINDING_DOMAIN);
    input.set(epk, TRANSFER_SEED_BINDING_DOMAIN.length);
    input.set(c2, TRANSFER_SEED_BINDING_DOMAIN.length + 32);
    input.set(seed, TRANSFER_SEED_BINDING_DOMAIN.length + 64);
    const transfer_seed_binding = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', input)));
    const { transfer_shared_fq: _transferSharedFq, ...current } = pkg;
    return { ...current, transfer_seed_binding };
};
