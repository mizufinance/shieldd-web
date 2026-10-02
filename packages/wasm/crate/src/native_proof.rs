//! The anchor is supplied by the wallet's existing SDK trust boundary.
use anyhow::{ensure, Context, Result};
use shieldd_proto::{core::component::sct::v1::NullifierResponse, Message};
use wasm_bindgen::prelude::*;

fn anchor(bytes: &[u8]) -> Result<[u8; 32]> {
    bytes
        .try_into()
        .context("SDK Shieldd anchor must be 32 bytes")
}

#[wasm_bindgen(js_name = verifyNativeValue)]
pub fn verify_native_value(
    proof: &[u8],
    sdk_anchor: &[u8],
    key: &[u8],
    value: &[u8],
    present: bool,
) -> Result<(), JsValue> {
    (|| -> Result<()> {
        ensure!(present || value.is_empty(), "absence cannot carry a value");
        shieldd_storage::StateProof::decode(proof)?.verify_application(
            anchor(sdk_anchor)?,
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
    sdk_anchor: &[u8],
    requested: &[u8],
) -> Result<bool, JsValue> {
    (|| -> Result<bool> {
        let status: shieldd_sct::permanent_nullifiers::Status =
            NullifierResponse::decode(response)?.try_into()?;
        ensure!(
            status.nullifier.to_bytes().as_slice() == requested,
            "proof is for a different nullifier"
        );
        status.verify(anchor(sdk_anchor)?)?;
        Ok(status.spent)
    })()
    .map_err(|error| JsValue::from_str(&error.to_string()))
}

