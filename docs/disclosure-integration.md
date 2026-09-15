# Disclosure SDK

The `codex/disclosure-integration` branch pins Shieldd
`6e4140fd28c0c8e3082c616a3fa60b8b516cf603`. Transaction planning, witness
encoding, registration validation and scanning use that Rust dependency.

The ring bundle contains independent amount, sender-address, receiver-address
and ownership-checking keys plus an epoch (136 bytes). User registration leaves
carry no per-person audit keys. Transfer construction includes two proof-bound
ownership ciphertexts; the compliance ciphertext is 832 bytes. Development keys
are synthetic fixtures, not authenticated committee provisioning. Live PET and
protected Orbis delivery are unavailable.

## Building and checking

Use Rust 1.89.0 and the committed Cargo.lock. Generate protocol bindings from
`vendor/shieldd` with `pnpm --filter @mizufinance/protobuf run gen:shieldd`.
The Bankd WASM workflow builds development WASM, tests the Rust wrappers, builds
the TypeScript packages and checks the shipped registration API. It records both
repository revisions with the resulting artifact.

Run heavy jobs sequentially with `CARGO_BUILD_JOBS=2`, `RAYON_NUM_THREADS=2` and
Rust `--test-threads=2`. The browser build delegates proving to the configured
prover; compiling this SDK does not verify browser-to-node proving or acceptance.

Reset prototype wallet databases and transaction plans before using this format;
rescan a freshly reset compatible development chain. There is no migration or
legacy format support.

## Bankd integration boundary

Bankd must package the resulting WASM and regenerated protobufs with matching
source provenance before enabling its browser/mobile transaction entry points.
Its currently committed bundles remain disabled until that integration is
verified. The authoritative requirements and acceptance criteria are in
[Bankd GAPS.md](https://github.com/mizufinance/bankd/blob/codex/disclosure-integration/infra/disclosure-audit/GAPS.md),
including SDK-1 and the Orbis/Defra limitations.

## Verification

Local verification on 2026-09-15 passed with Rust 1.89.0:

- Development WASM build and TypeScript dependency/package builds.
- Three Rust library tests, including volume recovery and withdrawal proof requests.
- Fifteen JavaScript tests covering keys, addresses, assets and scanner initialization.
- Shipped WASM address vector, unsigned-registration rejection and generated
  registration-schema checks.

No release-mode prover, browser/mobile transaction acceptance or live PET check
was run for this SDK update. Shieldd's native proving/acceptance verification is
recorded separately in Bankd's disclosure verification report.
