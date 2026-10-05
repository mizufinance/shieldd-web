//! The Shieldd commitment is independently authenticated by the selected host.
use anyhow::{ensure, Context, Result};
use shieldd_proto::{core::component::sct::v1::NullifierResponse, Message};
use wasm_bindgen::prelude::*;

fn anchor(bytes: &[u8]) -> Result<[u8; 32]> {
    bytes
        .try_into()
        .context("Shieldd commitment must be 32 bytes")
}

#[wasm_bindgen(js_name = verifyNativeValue)]
pub fn verify_native_value(
    proof: &[u8],
    shieldd_commitment: &[u8],
    key: &[u8],
    value: &[u8],
    present: bool,
) -> Result<(), JsValue> {
    (|| -> Result<()> {
        ensure!(present || value.is_empty(), "absence cannot carry a value");
        shieldd_storage::StateProof::decode(proof)?.verify_application(
            anchor(shieldd_commitment)?,
            shieldd_storage::Space::Application,
            key,
            present.then_some(value),
        )
    })()
    .map_err(|error| JsValue::from_str(&error.to_string()))
}
#[wasm_bindgen(js_name = verifyNativeNullifier)]
pub fn verify_native_nullifier(
    response: &[u8],
    shieldd_commitment: &[u8],
    requested: &[u8],
) -> Result<bool, JsValue> {
    (|| -> Result<bool> {
        let status: shieldd_sct::permanent_nullifiers::Status =
            NullifierResponse::decode(response)?.try_into()?;
        ensure!(
            status.nullifier.to_bytes().as_slice() == requested,
            "proof is for a different nullifier"
        );
        status.verify(anchor(shieldd_commitment)?)?;
        Ok(status.spent)
    })()
    .map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen(js_name = verifyNativeArchiveRange)]
pub fn verify_native_archive_range(
    proof: &[u8],
    shieldd_commitment: &[u8],
    query: &[u8],
) -> Result<JsValue, JsValue> {
    (|| -> Result<JsValue> {
        let query = shieldd_proto::storage::v1::ArchiveRangeRequest::decode(query)?;
        let query = shieldd_storage::ArchiveQuery {
            height: query.height,
            prefix: query.prefix,
            start: query.start,
            end: query.end,
            limit: query.limit as usize,
        };
        let page = shieldd_storage::ArchiveRangeProof::decode_canonical(proof)?
            .verify(anchor(shieldd_commitment)?, &query)?;
        // JS receives only records and a continuation that passed shared Rust verification.
        serde_wasm_bindgen::to_value(&page).map_err(Into::into)
    })()
    .map_err(|error| JsValue::from_str(&error.to_string()))
}
