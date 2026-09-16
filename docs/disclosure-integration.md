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
`vendor/shieldd` and the pinned Cosmos/ICS23 dependencies with
`pnpm --filter @mizufinance/protobuf proto`, then force the TypeScript rebuild.
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

Bankd bundles matching development WASM and protobuf packages from SDK commit
`80899a03b44c7ea4aa8dce391fea8aa99b62a7b7`. Browser and mobile transaction
entry points are enabled. Real Chromium admin and mobile WebView transfers
were proved and accepted by a local Bankd node. Reproduction and reset steps
are in [Bankd SDK.md](https://github.com/mizufinance/bankd/blob/codex/disclosure-integration/tests/e2e/SDK.md).
The authoritative requirements and acceptance criteria are in
[Bankd GAPS.md](https://github.com/mizufinance/bankd/blob/codex/disclosure-integration/infra/disclosure-audit/GAPS.md),
including SDK-1 and the Orbis/Defra limitations.

## Verification

Local verification on 2026-09-15 passed with Rust 1.89.0:

- Development WASM build and TypeScript dependency/package builds.
- Three Rust library tests, including volume recovery and withdrawal proof requests.
- Fifteen JavaScript tests covering keys, addresses, assets and scanner initialization.
- Shipped WASM address vector, unsigned-registration rejection and generated
  registration-schema checks.

Bankd integration additionally verified real browser/WebView transaction
acceptance with development proofs. No release-mode proof setup, physical
iOS/Android WebView or live PET check was run. Exact results are recorded in
Bankd's disclosure verification report.
