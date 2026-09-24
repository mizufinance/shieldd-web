//! Generate real encrypted notes for Bankd's independent Go reader tests.
//! The enclosing unsigned transaction is only a scan fixture.
use base64::{engine::general_purpose::STANDARD, Engine};
use shieldd_proto::{
    core::{component::shielded_pool::v1 as pool, transaction::v1 as tx},
    Message,
};
use shieldd_shielded_pool::{Note, RecoveryCommitment, Rseed};
fn main() -> anyhow::Result<()> {
    let fvk = &*shieldd_keys::test_keys::FULL_VIEWING_KEY;
    eprintln!("ivk={}", hex::encode(fvk.incoming().to_bytes()));
    let withdrawal = std::env::args().any(|arg| arg == "--withdrawal");
    let mut outputs = Vec::new();
    for (index, amount) in (if withdrawal {
        vec![5345u64]
    } else {
        vec![8000u64, 4345]
    })
    .into_iter()
    .enumerate()
    {
        let note = Note::from_parts(
            fvk.payment_address((index as u32).into()),
            shieldd_asset::Value {
                amount: amount.into(),
                asset_id: *shieldd_asset::BASE_ASSET_ID,
            },
            Rseed([index as u8 + 1; 32]),
            RecoveryCommitment::unavailable(),
        )?;
        let encrypted: pool::NoteCiphertext = note.encrypt().into();
        outputs.push(pool::TransferOutputBody {
            note_payload: Some(pool::NotePayload {
                note_commitment: Some(note.commit().into()),
                ephemeral_key: note.ephemeral_public_key().to_bytes().to_vec(),
                encrypted_note: Some(encrypted),
                ..Default::default()
            }),
            ..Default::default()
        });
    }
    let action = if withdrawal {
        tx::action::Action::ShieldedHostWithdrawal(pool::ShieldedHostWithdrawal {
            body: Some(pool::ShieldedHostWithdrawalBody {
                routing_tag: Some(pool::RoutingTag { value: 3824608156 }),
                change_output: Some(pool::ShieldedWithdrawalChangeBody {
                    note_payload: outputs.remove(0).note_payload,
                    ..Default::default()
                }),
                ..Default::default()
            }),
            ..Default::default()
        })
    } else {
        tx::action::Action::Transfer(pool::Transfer {
            body: Some(pool::TransferBody {
                outputs,
                routing: Some(pool::TransferRouting {
                    tags: vec![
                        pool::RoutingTag { value: 977200028 },
                        pool::RoutingTag { value: 1310103230 },
                    ],
                    ..Default::default()
                }),
                ..Default::default()
            }),
            ..Default::default()
        })
    };
    let tx = tx::Transaction {
        body: Some(tx::TransactionBody {
            actions: vec![tx::Action {
                action: Some(action),
            }],
            ..Default::default()
        }),
        ..Default::default()
    };
    println!("{}", STANDARD.encode(tx.encode_to_vec()));
    Ok(())
}
