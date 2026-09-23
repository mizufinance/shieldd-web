//! Loopback development adapter worker. Its input contains private wallet data.
use anyhow::{ensure, Context, Result};
use std::io::{self, Read, Write};

fn main() -> Result<()> {
    let mut args = std::env::args().skip(1);
    ensure!(
        args.next().as_deref() == Some("--circuit"),
        "expected --circuit"
    );
    let family = args.next().context("missing proof family")?;
    ensure!(
        matches!(family.as_str(), "transfer" | "shielded_withdrawal"),
        "unsupported proof family"
    );
    ensure!(args.next().is_none(), "unexpected argument");
    let registry = shieldd_proof_params::pari::Registry::load(
        std::env::var_os("SHIELDD_PARI_KEYS").context("SHIELDD_PARI_KEYS is required")?,
    )?;
    let mut input = io::stdin().lock();
    let mut output = io::stdout().lock();
    writeln!(
        output,
        "{}",
        serde_json::json!({"magic": "SPDR", "status": "ready", "circuit": family})
    )?;
    output.flush()?;
    loop {
        let mut header = [0; 12];
        if input.read(&mut header[..1])? == 0 {
            return Ok(());
        }
        input.read_exact(&mut header[1..])?;
        let length = u32::from_le_bytes(header[4..8].try_into()?) as usize;
        ensure!(
            &header[..4] == b"PGRQ" && header[8..] == 1u32.to_le_bytes(),
            "invalid request header"
        );
        ensure!(
            (12..=4 * 1024 * 1024 + 12).contains(&length),
            "invalid request length"
        );
        let mut witness = vec![0; length - 12];
        input.read_exact(&mut witness)?;
        let (status, result) =
            match shieldd_wasm::build::prove_request(&witness, &family, &registry) {
                Ok(proof) => (0u32, proof),
                Err(error) => (1u32, format!("{error:#}").into_bytes()),
            };
        output.write_all(b"PGRS")?;
        output.write_all(&u32::try_from(result.len() + 12)?.to_le_bytes())?;
        output.write_all(&status.to_le_bytes())?;
        output.write_all(&result)?;
        output.flush()?;
    }
}
