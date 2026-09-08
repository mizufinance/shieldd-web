use anyhow::{ensure, Result};
use decaf377::Fq;
use serde::{Deserialize, Serialize};
use shieldd_keys::FullViewingKey;
use shieldd_sct::Nullifier;
use shieldd_shielded_pool::{
    accumulated_volume, select_accumulator_day, ActionWitness, VolumeAccumulatorPayload,
    VolumeAccumulatorPlan, VolumeAccumulatorState, VOLUME_ACCUMULATOR_RETENTION_SECS,
};
use shieldd_tct::{Position, StateCommitment};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfirmedVolume {
    pub state: VolumeAccumulatorState,
    pub commitment: StateCommitment,
    pub position: Position,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SeenVolume {
    day: u64,
    nullifier: Nullifier,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct VolumeJournal {
    pub height: Option<u64>,
    pub complete: bool,
    seen: Vec<SeenVolume>,
    tips: Vec<ConfirmedVolume>,
}

impl VolumeJournal {
    pub fn begin_block(&mut self, height: u64, skipped: bool) -> Result<()> {
        if self.height == Some(height) {
            return Ok(());
        }
        if height == 0 {
            self.complete = !skipped;
        } else if self.height.and_then(|h| h.checked_add(1)) != Some(height) || skipped {
            self.complete = false;
        }
        ensure!(
            self.height.is_none_or(|previous| height >= previous),
            "volume scan moved backwards"
        );
        self.height = Some(height);
        Ok(())
    }

    pub fn observe(&mut self, payload: &VolumeAccumulatorPayload) {
        if !self
            .seen
            .iter()
            .any(|entry| entry.day == payload.day_start && entry.nullifier == payload.nullifier)
        {
            self.seen.push(SeenVolume {
                day: payload.day_start,
                nullifier: payload.nullifier,
            });
        }
        let oldest = payload
            .day_start
            .saturating_sub(VOLUME_ACCUMULATOR_RETENTION_SECS);
        self.seen.retain(|entry| entry.day >= oldest);
        self.tips.retain(|entry| entry.state.day_start >= oldest);
    }

    pub fn confirm(
        &mut self,
        state: VolumeAccumulatorState,
        commitment: StateCommitment,
        position: Position,
    ) -> Result<()> {
        ensure!(
            state.commitment() == commitment,
            "volume state does not match commitment"
        );
        if let Some(old) = self.tips.iter_mut().find(|entry| {
            entry.state.subject == state.subject && entry.state.day_start == state.day_start
        }) {
            if old.position < position {
                *old = ConfirmedVolume {
                    state,
                    commitment,
                    position,
                };
            }
        } else {
            self.tips.push(ConfirmedVolume {
                state,
                commitment,
                position,
            });
        }
        Ok(())
    }

    pub fn plan(
        &self,
        witness: &ActionWitness,
        fvk: &FullViewingKey,
        timestamp: u64,
        amount: u128,
        eligible: bool,
    ) -> Result<VolumeAccumulatorPlan> {
        let padding = VolumeAccumulatorPlan::padding(timestamp);
        if !eligible || !witness.asset.is_regulated || !self.complete {
            return Ok(padding);
        }
        let limit = witness
            .policy
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("regulated action missing policy"))?
            .params
            .daily_volume_limit;
        let subject =
            VolumeAccumulatorState::subject(&witness.sender.leaf.address, witness.asset.asset_id);
        let day_start = select_accumulator_day(timestamp);
        let spent = |nullifier| {
            self.seen
                .iter()
                .any(|entry| entry.day == day_start && entry.nullifier == nullifier)
        };
        let blinding = Fq::rand(&mut rand_core::OsRng);
        if let Some(tip) = self
            .tips
            .iter()
            .find(|tip| tip.state.subject == subject && tip.state.day_start == day_start)
        {
            ensure!(
                tip.state.commitment() == tip.commitment,
                "stored volume commitment mismatch"
            );
            if spent(Nullifier::derive(
                fvk.nullifier_key(),
                tip.position,
                &tip.commitment,
            )) {
                return Ok(padding);
            }
            match accumulated_volume(tip.state.undisclosed_volume, amount, limit) {
                Some(volume) => VolumeAccumulatorPlan::continuation(
                    tip.state.clone(),
                    tip.commitment,
                    u64::from(tip.position),
                    volume,
                    blinding,
                ),
                None => Ok(padding),
            }
        } else {
            let mut state = VolumeAccumulatorState {
                subject,
                day_start,
                undisclosed_volume: 0,
                blinding,
            };
            if spent(state.origin_nullifier(fvk.nullifier_key())) {
                return Ok(padding);
            }
            match accumulated_volume(0, amount, limit) {
                Some(volume) => {
                    state.undisclosed_volume = volume;
                    Ok(VolumeAccumulatorPlan::origin(state))
                }
                None => Ok(padding),
            }
        }
    }
}
