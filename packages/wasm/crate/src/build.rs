use crate::error::WasmResult;
use crate::utils;
use crate::view_server::{load_tree, StoredTree};
use anyhow::{anyhow, Context};
use rand_core::OsRng;
use serde::Serialize;
use shieldd_crypto::Fq;
use shieldd_keys::{keys::SpendKey, symmetric::PayloadKey, FullViewingKey};
use shieldd_proto::DomainType;
use shieldd_shielded_pool::{ShieldedWithdrawalProof, TransferProof};
use shieldd_tct::{self as tct, Proof, StateCommitment};
use shieldd_transaction::{
    plan::{ActionPlan, TransactionPlan},
    Action, AuthorizationData, Transaction, WitnessData,
};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProofRequest {
    family: &'static str,
    witness: Vec<u8>,
}

/// Authorize transaction using a spend key.
#[wasm_bindgen]
pub fn authorize(spend_key: &[u8], transaction_plan: &[u8]) -> WasmResult<Vec<u8>> {
    utils::set_panic_hook();

    let spend_key = SpendKey::decode(spend_key)?;
    let plan = TransactionPlan::decode(transaction_plan)?;
    let auth_data = plan.authorize(OsRng, &spend_key)?;

    Ok(auth_data.encode_to_vec())
}

/// Build witness data from a transaction plan and serialized IndexedDB SCT.
#[wasm_bindgen]
pub fn witness(transaction_plan: &[u8], stored_tree: JsValue) -> WasmResult<Vec<u8>> {
    utils::set_panic_hook();

    let plan = TransactionPlan::decode(transaction_plan)?;
    let stored_tree = serde_wasm_bindgen::from_value(stored_tree)?;
    let witness_data = witness_inner(plan, stored_tree)?;

    Ok(witness_data.encode_to_vec())
}

fn witness_inner(plan: TransactionPlan, stored_tree: StoredTree) -> WasmResult<WitnessData> {
    let sct = load_tree(stored_tree);
    let recent_position_floor = plan.recent_position_floor()?;
    if planned_spends(&plan).into_iter().any(|plan| {
        plan.note.amount() != 0u64.into() && u64::from(plan.position) < recent_position_floor
    }) {
        return Err(anyhow!(
            "historical nullifier proofs are required for one or more selected notes"
        )
        .into());
    }

    let mut note_commitments: Vec<StateCommitment> = planned_spends(&plan)
        .into_iter()
        .filter(|plan| plan.note.amount() != 0u64.into())
        .map(|spend| spend.note.commit())
        .collect();

    note_commitments.extend(plan.actions.iter().filter_map(|action| match action {
        ActionPlan::Transfer(plan) => plan.accumulator_prior_commitment(),
        ActionPlan::ShieldedHostWithdrawal(plan) => plan.accumulator_prior_commitment(),
        _ => None,
    }));
    let anchor = sct.root();
    let auth_paths = note_commitments
        .iter()
        .map(|nc| {
            sct.witness(*nc)
                .ok_or_else(|| anyhow!("note commitment is in the SCT"))
        })
        .collect::<Result<Vec<Proof>, anyhow::Error>>()?;
    drop(sct);

    let mut witness_data = WitnessData {
        anchor,
        state_commitment_proofs: auth_paths
            .into_iter()
            .map(|proof| (proof.commitment(), proof))
            .collect(),
        historical_nullifier_proofs: Vec::new(),
    };

    for nc in planned_spends(&plan)
        .into_iter()
        .filter(|plan| plan.note.amount() == 0u64.into())
        .map(|plan| plan.note.commit())
    {
        witness_data.add_proof(nc, Proof::dummy(&mut OsRng, nc));
    }

    Ok(witness_data)
}

/// Builds the witness payload required by the local HTTP prover for the
/// requested action. This is intentionally binary-only across the WASM
/// boundary; ActionPlan JSON is not accepted or produced.
#[wasm_bindgen]
pub fn build_action_proof_request(
    transaction_plan: &[u8],
    action_plan: &[u8],
    full_viewing_key: &[u8],
    witness_data: &[u8],
) -> WasmResult<JsValue> {
    utils::set_panic_hook();
    let transaction_plan = TransactionPlan::decode(transaction_plan)?;
    let witness = WitnessData::decode(witness_data)?;
    let action_plan = ActionPlan::decode(action_plan)?;
    let full_viewing_key = FullViewingKey::decode(full_viewing_key)?;

    let request =
        build_action_proof_request_inner(transaction_plan, action_plan, full_viewing_key, witness)?;
    Ok(serde_wasm_bindgen::to_value(&request)?)
}

fn build_action_proof_request_inner(
    transaction_plan: TransactionPlan,
    action_plan: ActionPlan,
    full_viewing_key: FullViewingKey,
    witness: WitnessData,
) -> WasmResult<ProofRequest> {
    let family = match &action_plan {
        ActionPlan::Transfer(_) => "transfer",
        ActionPlan::ShieldedHostWithdrawal(_) => "shielded_withdrawal",
        other => {
            return Err(anyhow!(
                "browser proving unavailable for action {}",
                other.variant_index()
            )
            .into())
        }
    };
    let request = ProverWitness {
        transaction_plan: transaction_plan.encode_to_vec(),
        action_plan: action_plan.encode_to_vec(),
        full_viewing_key: full_viewing_key.encode_to_vec(),
        witness_data: witness.encode_to_vec(),
    };
    Ok(ProofRequest {
        family,
        witness: bincode::serialize(&request).map_err(anyhow::Error::from)?,
    })
}

/// Private local-prover input. Never send this to an untrusted service.
#[derive(serde::Serialize, serde::Deserialize)]
pub struct ProverWitness {
    transaction_plan: Vec<u8>,
    action_plan: Vec<u8>,
    full_viewing_key: Vec<u8>,
    witness_data: Vec<u8>,
}

/// Generate a native Pari proof using the same registry as the node.
pub fn prove_request(
    bytes: &[u8],
    family: &str,
    registry: &shieldd_proof_params::pari::Registry,
) -> anyhow::Result<Vec<u8>> {
    use bincode::Options;
    let request: ProverWitness = bincode::DefaultOptions::new()
        .with_fixint_encoding()
        .with_limit(4 * 1024 * 1024)
        .reject_trailing_bytes()
        .deserialize(bytes)?;
    let plan = TransactionPlan::decode(request.transaction_plan.as_slice())?;
    let action = ActionPlan::decode(request.action_plan.as_slice())?;
    let fvk = FullViewingKey::decode(request.full_viewing_key.as_slice())?;
    let witness = WitnessData::decode(request.witness_data.as_slice())?;
    let floor = plan.recent_position_floor()?;
    let (statement, proof) = match action {
        ActionPlan::Transfer(plan) if family == "transfer" => {
            let paths =
                transfer_auth_paths(&plan.spends, plan.accumulator_prior_commitment(), &witness)?;
            let (public, private) =
                plan.transfer_public_private(&fvk, &paths, witness.anchor, floor)?;
            (
                public.statement_hash()?,
                TransferProof::prove(public, private, registry)?.inner,
            )
        }
        ActionPlan::ShieldedHostWithdrawal(plan) if family == "shielded_withdrawal" => {
            let paths =
                transfer_auth_paths(&plan.spends, plan.accumulator_prior_commitment(), &witness)?;
            let (public, private) =
                plan.shielded_host_withdrawal_public_private(&fvk, &paths, witness.anchor, floor)?;
            (
                public.statement_hash()?,
                ShieldedWithdrawalProof::prove(public, private, registry)?.inner,
            )
        }
        _ => anyhow::bail!("unsupported or mismatched proof family"),
    };
    let mut result = statement.to_bytes().to_vec();
    result.extend(proof);
    Ok(result)
}

fn decode_proof_result(bytes: &[u8], expected: Fq) -> anyhow::Result<Vec<u8>> {
    anyhow::ensure!(bytes.len() == 32 + 244, "invalid Pari proof result length");
    let claimed = shieldd_crypto::encoding::field(bytes[..32].try_into()?)?;
    anyhow::ensure!(claimed == expected, "proof result statement hash mismatch");
    Ok(bytes[32..].to_vec())
}

/// Builds a binary Action from a binary ActionPlan and a native Pari proof
/// result returned by the local HTTP prover.
#[wasm_bindgen]
pub fn build_action_with_proof_result(
    transaction_plan: &[u8],
    action_plan: &[u8],
    full_viewing_key: &[u8],
    witness_data: &[u8],
    proof_result: &[u8],
) -> WasmResult<Vec<u8>> {
    utils::set_panic_hook();
    let transaction_plan = TransactionPlan::decode(transaction_plan)?;
    let witness = WitnessData::decode(witness_data)?;
    let action_plan = ActionPlan::decode(action_plan)?;
    let full_viewing_key = FullViewingKey::decode(full_viewing_key)?;

    let action = build_action_with_proof_result_inner(
        transaction_plan,
        action_plan,
        full_viewing_key,
        witness,
        proof_result,
    )?;

    Ok(action.encode_to_vec())
}

fn build_action_with_proof_result_inner(
    transaction_plan: TransactionPlan,
    action_plan: ActionPlan,
    full_viewing_key: FullViewingKey,
    witness: WitnessData,
    proof_result: &[u8],
) -> WasmResult<Action> {
    let anchor = witness.anchor;
    let memo_key = memo_key(&transaction_plan);
    let recent_position_floor = transaction_plan.recent_position_floor()?;

    let action = match action_plan {
        ActionPlan::Transfer(plan) => {
            let auth_paths =
                transfer_auth_paths(&plan.spends, plan.accumulator_prior_commitment(), &witness)?;
            let (public, _) = plan.transfer_public_private(
                &full_viewing_key,
                &auth_paths,
                anchor,
                recent_position_floor,
            )?;
            let proof = TransferProof {
                inner: decode_proof_result(proof_result, public.statement_hash()?)?,
            };
            proof.validate_encoding()?;
            Action::Transfer(plan.build_unauth_transfer_with_proof(
                &full_viewing_key,
                vec![[0u8; 64].into(); plan.spends.len()],
                anchor,
                &memo_key,
                proof,
                recent_position_floor,
            )?)
        }
        ActionPlan::ShieldedHostWithdrawal(plan) => {
            let auth_paths =
                transfer_auth_paths(&plan.spends, plan.accumulator_prior_commitment(), &witness)?;
            let (public, private) = plan.shielded_host_withdrawal_public_private(
                &full_viewing_key,
                &auth_paths,
                anchor,
                recent_position_floor,
            )?;
            let _ = private;
            let proof = ShieldedWithdrawalProof {
                inner: decode_proof_result(proof_result, public.statement_hash()?)?,
            };
            proof.validate_encoding()?;
            Action::ShieldedHostWithdrawal(plan.build_unauth_shielded_host_withdrawal_with_proof(
                &full_viewing_key,
                vec![[0u8; 64].into(); plan.spends.len()],
                anchor,
                &memo_key,
                proof,
                recent_position_floor,
            )?)
        }
        other => {
            return Err(anyhow!(
                "browser proving is not available for action plan variant {}",
                other.variant_index()
            )
            .into())
        }
    };

    Ok(action)
}

/// Deprecated browser entrypoint retained as a hard error so stale consumers do
/// not silently fall back to host-only proof generation.
#[wasm_bindgen]
pub fn build_action(
    _transaction_plan: &[u8],
    _action_plan: &[u8],
    _full_viewing_key: &[u8],
    _witness_data: &[u8],
) -> WasmResult<Vec<u8>> {
    utils::set_panic_hook();
    Err(anyhow!(
        "build_action is no longer supported in WASM; use build_action_proof_request and build_action_with_proof_result"
    )
    .into())
}

/// Deprecated browser entrypoint retained as a hard error so stale consumers do
/// not use host-only transaction proving in WASM.
#[wasm_bindgen]
pub fn build_serial(
    _full_viewing_key: &[u8],
    _transaction_plan: &[u8],
    _witness_data: &[u8],
    _auth_data: &[u8],
) -> WasmResult<Vec<u8>> {
    utils::set_panic_hook();
    Err(anyhow!(
        "build_serial is no longer supported in WASM; build actions with the local prover and call build_parallel"
    )
    .into())
}

/// Build a transaction from binary Actions, a binary TransactionPlan, binary
/// WitnessData, and binary AuthorizationData. No Action or ActionPlan JSON is
/// accepted at this boundary.
#[wasm_bindgen]
pub fn build_parallel(
    actions: JsValue,
    transaction_plan: &[u8],
    witness_data: &[u8],
    auth_data: &[u8],
) -> WasmResult<Vec<u8>> {
    utils::set_panic_hook();

    let plan = TransactionPlan::decode(transaction_plan)?;
    let witness = WitnessData::decode(witness_data)?;
    let auth = AuthorizationData::decode(auth_data)?;
    let actions: Vec<Vec<u8>> = serde_wasm_bindgen::from_value(actions)?;
    let actions = actions
        .into_iter()
        .map(|bytes| Action::decode(bytes.as_slice()).map_err(Into::into))
        .collect::<WasmResult<Vec<_>>>()?;

    let tx = build_parallel_inner(actions, plan, witness, auth)?;

    Ok(tx.encode_to_vec())
}

pub fn build_parallel_inner(
    actions: Vec<Action>,
    plan: TransactionPlan,
    witness: WitnessData,
    auth: AuthorizationData,
) -> WasmResult<Transaction> {
    let transaction = plan
        .clone()
        .build_unauth_with_actions(actions, None, &witness)?;
    let tx = plan.apply_auth_data(&auth, transaction)?;

    Ok(tx)
}

fn memo_key(transaction_plan: &TransactionPlan) -> PayloadKey {
    transaction_plan
        .memo
        .as_ref()
        .map(|memo_plan| memo_plan.key)
        .unwrap_or([0u8; 32].into())
}

fn transfer_auth_paths(
    spends: &[shieldd_shielded_pool::ShieldedInputPlan],
    accumulator: Option<StateCommitment>,
    witness: &WitnessData,
) -> WasmResult<Vec<tct::Proof>> {
    spends
        .iter()
        .map(|spend| spend.note.commit())
        .chain(accumulator)
        .map(|note_commitment| {
            witness
                .state_commitment_proofs
                .get(&note_commitment)
                .cloned()
                .context(format!("could not get proof for {note_commitment:?}"))
                .map_err(Into::into)
        })
        .collect()
}

fn planned_spends(plan: &TransactionPlan) -> Vec<&shieldd_shielded_pool::ShieldedInputPlan> {
    let mut spends = Vec::new();
    for action in &plan.actions {
        match action {
            ActionPlan::Transfer(plan) => spends.extend(plan.spends.iter()),
            ActionPlan::NoteReshape(plan) => spends.extend(plan.spends.iter()),
            ActionPlan::ShieldedHostWithdrawal(plan) => spends.extend(plan.spends.iter()),
            _ => {}
        }
    }
    if let Some(fee_funding) = &plan.fee_funding {
        spends.extend(fee_funding.transfer.spends.iter());
    }
    spends
}

#[wasm_bindgen(getter_with_clone)]
pub struct TxpAndTxvBytes {
    pub txp: Vec<u8>,
    pub txv: Vec<u8>,
}

#[wasm_bindgen]
pub async fn transaction_perspective_and_view(
    _full_viewing_key: &[u8],
    _tx: &[u8],
    _idb_constants: JsValue,
) -> WasmResult<TxpAndTxvBytes> {
    Err(
        anyhow!("transaction_perspective_and_view is not available in the bankD demo wasm build")
            .into(),
    )
}

#[wasm_bindgen]
pub async fn transaction_summary(_txv: &[u8]) -> WasmResult<Vec<u8>> {
    Err(anyhow!("transaction_summary is not available in the bankD demo wasm build").into())
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use rand_core::OsRng;
    use shieldd_asset::{Value, BASE_ASSET_ID};
    use shieldd_keys::keys::{AddressIndex, SpendKey, SpendKeyBytes};
    use shieldd_sct::nullifier_generation::{
        empty_history_head, NullifierWindow, PROTOCOL_VERSION,
    };
    use shieldd_shielded_pool::{
        HostTransfer, HostWithdrawal, HostWithdrawalDestination, Note, Rseed,
        ShieldedHostWithdrawalPlan, ShieldedInputPlan, ShieldedOutputPlan,
    };
    use shieldd_tct::{Tree, Witness};
    use shieldd_transaction::{ActionPlan, TransactionParameters, TransactionPlan, WitnessData};

    use super::build_action_proof_request_inner;

    fn host_withdrawal_fixture() -> (
        TransactionPlan,
        ActionPlan,
        shieldd_keys::FullViewingKey,
        WitnessData,
    ) {
        let spend_key = SpendKey::try_from(SpendKeyBytes::from([7u8; 32])).unwrap();
        let fvk = spend_key.full_viewing_key().clone();
        let address = fvk.payment_address(AddressIndex::new(0));
        let asset_id = *BASE_ASSET_ID;
        let note = Note::from_parts(
            address.clone(),
            Value {
                amount: 10u64.into(),
                asset_id,
            },
            Rseed::generate(&mut OsRng),
            shieldd_shielded_pool::RecoveryCommitment::unavailable(),
        )
        .unwrap();

        let mut tree = Tree::new();
        let position = tree.insert(Witness::Keep, note.commit()).unwrap();
        let proof = tree.witness(note.commit()).unwrap();
        let anchor = tree.root();

        let spend = ShieldedInputPlan::new(&mut OsRng, note, position);
        let change = ShieldedOutputPlan::new(
            &mut OsRng,
            Value {
                amount: 5u64.into(),
                asset_id,
            },
            address.clone(),
        );
        let host_plan = ShieldedHostWithdrawalPlan::new(
            vec![spend],
            Some(change),
            HostWithdrawal {
                value: Value {
                    amount: 5u64.into(),
                    asset_id,
                },
                destination: HostWithdrawalDestination::Transfer(HostTransfer {
                    recipient: "bankd1recipient".to_owned(),
                }),
            },
            shieldd_crypto::Fr::from(9u64),
            {
                let assets = shieldd_compliance::IndexedMerkleTree::new();
                let (position, leaf, path) = assets.non_membership_proof(asset_id.0).unwrap();
                shieldd_shielded_pool::WithdrawalContext {
                    witness: shieldd_shielded_pool::ActionWitness {
                        asset: shieldd_shielded_pool::AssetWitness {
                            asset_id,
                            root: assets.root(),
                            leaf,
                            position,
                            path: path.into(),
                            is_regulated: false,
                        },
                        user_root: shieldd_tct::StateCommitment(shieldd_crypto::Fq::from(0u64)),
                        sender: shieldd_shielded_pool::UserWitness {
                            leaf: shieldd_compliance::ComplianceLeaf::synthetic_unregulated(
                                address, asset_id,
                            ),
                            position: 0,
                            path: Default::default(),
                        },
                        policy: None,
                    },
                    timestamp: 86_400,
                    nonce: shieldd_crypto::Fr::from(7u64),
                }
            },
            shieldd_shielded_pool::VolumeAccumulatorPlan::padding(86_400),
            Default::default(),
        )
        .unwrap();
        let action_plan = ActionPlan::ShieldedHostWithdrawal(host_plan);
        let transaction_plan = TransactionPlan {
            actions: vec![action_plan.clone()],
            transaction_parameters: TransactionParameters::default(),
            fee_funding: None,
            memo: None,
            nullifier_window: Some(NullifierWindow {
                protocol_version: PROTOCOL_VERSION,
                current_generation: 1,
                recent_position_floor: 0,
                archived_generation_count: 0,
                archived_history_head: empty_history_head(),
            }),
        };
        let witness = WitnessData {
            anchor,
            state_commitment_proofs: BTreeMap::from([(proof.commitment(), proof)]),
            historical_nullifier_proofs: Vec::new(),
        };

        (transaction_plan, action_plan, fvk, witness)
    }

    #[test]
    fn host_withdrawal_reuses_shielded_withdrawal_prover_family() {
        let (plan, action, fvk, witness) = host_withdrawal_fixture();
        let request = build_action_proof_request_inner(plan, action, fvk, witness).unwrap();
        assert_eq!(request.family, "shielded_withdrawal");
        assert!(!request.witness.is_empty());
    }

    #[test]
    fn proof_response_rejects_malformed_length_and_wrong_statement() {
        use shieldd_crypto::Fq;
        assert!(super::decode_proof_result(&[0; 275], Fq::from(1)).is_err());
        let mut result = vec![0; 276];
        result[..32].copy_from_slice(&Fq::from(2).to_bytes());
        assert!(super::decode_proof_result(&result, Fq::from(1)).is_err());
    }

    #[test]
    #[ignore = "requires SHIELDD_PARI_KEYS and generates a real Pari proof"]
    fn native_prover_round_trip() {
        let registry =
            shieldd_proof_params::pari::Registry::load(std::env::var("SHIELDD_PARI_KEYS").unwrap())
                .unwrap();
        let (plan, action, fvk, witness) = host_withdrawal_fixture();
        let request = build_action_proof_request_inner(
            plan.clone(),
            action.clone(),
            fvk.clone(),
            witness.clone(),
        )
        .unwrap();
        assert!(super::prove_request(&request.witness, "transfer", &registry).is_err());
        let result = super::prove_request(&request.witness, request.family, &registry).unwrap();
        let built =
            super::build_action_with_proof_result_inner(plan, action, fvk, witness, &result)
                .unwrap();
        assert!(matches!(
            built,
            shieldd_transaction::Action::ShieldedHostWithdrawal(_)
        ));
        let mut trailing = request.witness;
        trailing.push(0);
        assert!(super::prove_request(&trailing, request.family, &registry).is_err());
    }
}
