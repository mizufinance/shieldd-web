use anyhow::{anyhow, Result};
use decaf377_rdsa::{SigningKey, SpendAuth, VerificationKey};
use serde::Serialize;
use shieldd_compliance::structs::{
    AssetRegistrationGrant, MsgRegisterAsset, MsgRegisterUser, UserRegistrationGrant,
    UserRegistrationGrantBody,
};
use shieldd_compliance::ComplianceLeaf;
use shieldd_keys::Address;
use shieldd_proto::{core::component::compliance::v1 as pb, DomainType, Message};
use shieldd_transaction::{ActionPlan, TransactionPlan};
use wasm_bindgen::prelude::*;

const GRANT_VALID_UNTIL_UNIX: u64 = 4_102_444_800;

fn dev_signing_key(first_byte: u8) -> Result<SigningKey<SpendAuth>> {
    let mut bytes = [0u8; 32];
    bytes[0] = first_byte;
    SigningKey::<SpendAuth>::try_from(bytes.as_slice())
        .map_err(|_| anyhow!("invalid built-in development signing key"))
}

#[wasm_bindgen(js_name = deriveComplianceScalarForAddress)]
pub fn derive_compliance_scalar_for_address(address: &[u8]) -> Result<Vec<u8>, JsValue> {
    let address = Address::decode(address)
        .map_err(|error| JsValue::from_str(&format!("invalid address: {error}")))?;
    Ok(shieldd_compliance::derive_compliance_scalar(&address)
        .to_bytes()
        .to_vec())
}

// These signing keys are the public localnet registrar and authority defaults.
#[wasm_bindgen(js_name = pocSignDevAssetRegistration)]
pub fn poc_sign_dev_asset_registration(message: &[u8]) -> Result<Vec<u8>, JsValue> {
    let proto = pb::MsgRegisterAsset::decode(message)
        .map_err(|error| JsValue::from_str(&format!("invalid asset registration: {error}")))?;
    let mut message = MsgRegisterAsset::try_from(proto)
        .map_err(|error| JsValue::from_str(&format!("invalid asset registration: {error}")))?;
    let authority_sk = dev_signing_key(2).map_err(|error| JsValue::from_str(&error.to_string()))?;
    message.registration_authority_vk = Some(VerificationKey::from(&authority_sk));
    let registrar_sk = dev_signing_key(1).map_err(|error| JsValue::from_str(&error.to_string()))?;
    let body = message.registration_grant_body(GRANT_VALID_UNTIL_UNIX);
    message.asset_registration_grant = Some(AssetRegistrationGrant {
        signature: registrar_sk.sign(rand_core::OsRng, &body.signing_bytes()),
        registrar_vk: VerificationKey::from(&registrar_sk),
        body,
    });
    Ok(message.encode_to_vec())
}

#[wasm_bindgen(js_name = pocBuildDevUserRegistration)]
pub fn poc_build_dev_user_registration(
    address: &[u8],
    asset_id: &[u8],
    policy_id: String,
) -> Result<Vec<u8>, JsValue> {
    let address = Address::decode(address)
        .map_err(|error| JsValue::from_str(&format!("invalid address: {error}")))?;
    let asset_id = shieldd_proto::core::asset::v1::AssetId::decode(asset_id)
        .map_err(|error| JsValue::from_str(&format!("invalid asset id protobuf: {error}")))?
        .try_into()
        .map_err(|error| JsValue::from_str(&format!("invalid asset id: {error}")))?;
    let leaf = ComplianceLeaf::new(address, asset_id);
    let mut nonce = vec![0u8; 16];
    rand_core::RngCore::fill_bytes(&mut rand_core::OsRng, &mut nonce);
    let authority_sk = dev_signing_key(2).map_err(|error| JsValue::from_str(&error.to_string()))?;
    let body = UserRegistrationGrantBody {
        leaf: leaf.clone(),
        policy_id,
        valid_until_unix: GRANT_VALID_UNTIL_UNIX,
        nonce,
    };
    let message = MsgRegisterUser {
        leaf,
        grant: Some(UserRegistrationGrant {
            signature: authority_sk.sign(rand_core::OsRng, &body.signing_bytes()),
            body,
        }),
    };
    Ok(message.encode_to_vec())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LocatedOrbisAuditBundle {
    action_index: usize,
    output_index: usize,
    bundle: shieldd_compliance::PocOrbisAuditBundle,
}

#[wasm_bindgen(js_name = pocOrbisAuditBundles)]
pub fn poc_orbis_audit_bundles(plan: &[u8]) -> Result<JsValue, JsValue> {
    let plan = TransactionPlan::decode(plan)
        .map_err(|error| JsValue::from_str(&format!("invalid transaction plan: {error}")))?;
    let mut bundles = Vec::new();
    for (action_index, action) in plan.actions.iter().enumerate() {
        let ActionPlan::Transfer(transfer) = action else {
            continue;
        };
        if let Some(bundle) = transfer
            .poc_orbis_audit_bundle()
            .map_err(|error| JsValue::from_str(&format!("build Orbis sidecar: {error}")))?
        {
            bundles.push(LocatedOrbisAuditBundle {
                action_index,
                output_index: 0,
                bundle,
            });
        }
    }
    serde_wasm_bindgen::to_value(&bundles)
        .map_err(|error| JsValue::from_str(&format!("serialize Orbis sidecar: {error}")))
}
