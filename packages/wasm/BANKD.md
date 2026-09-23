# Bankd browser SDK

`vendor/shieldd` pins the Pari/Jubjub protocol from Shieldd #155. Addresses and
keys use the new suite-tagged encoding; old wallet databases and chains require
a fresh start. The Bankd WASM workflow records both source revisions.

Build TypeScript with `pnpm --filter @mizufinance/wasm... build`. Generate protobuf
bindings first with `pnpm --filter @mizufinance/protobuf proto`.

## Native browser prover

From `packages/wasm/crate`, build with Rust 1.95:

```sh
CARGO_BUILD_JOBS=2 RAYON_NUM_THREADS=2 cargo build --locked --bin pari-prover
SHIELDD_PARI_KEYS=/absolute/shared/registry target/debug/pari-prover --circuit transfer
```

The worker supports `transfer` and `shielded_withdrawal`. It receives private
witness protobufs in a bounded bincode frame and returns a statement hash plus
the native Pari envelope. Bankd's loopback HTTP adapter preserves its existing
JSON API. Use only on trusted local infrastructure: proving reveals witnesses
to the worker. Node verification remains authoritative.

Generate the registry once with Shieldd's `pari_setup` example and distribute
the exact directory to every node and worker. Missing or mismatched keys fail;
there is no simulated proving path.

```sh
SHIELDD_PARI_KEYS=/absolute/shared/registry CARGO_BUILD_JOBS=2 RAYON_NUM_THREADS=2 \
  cargo test --locked --lib native_prover_round_trip -- --ignored
```

This opt-in test produces and verifies a real host-withdrawal Pari proof. The
ordinary Rust tests check framing and action construction; admin API vectors
and bech32 tests check encoding compatibility. `note_reader_fixture` generates
real Rust-encrypted notes in unsigned transaction wrappers for Bankd's Go
reader tests; those fixtures do not claim chain acceptance.

Orbis integration requires a separate upstream migration. Bankd's audit demo
can simulate its results on the backend; this SDK never simulates proof tests.
