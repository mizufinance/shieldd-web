# Bankd browser SDK

The tracked source includes the admin registration helpers, Orbis audit sidecars,
and transfer seed-binding bridge as well as the mobile browser API.
`vendor/shieldd` pins the Rust protocol implementation. The Bankd WASM workflow
compiles this checkout and records both source revisions with its output.
Build the TypeScript package with `pnpm --filter @mizufinance/wasm build`, then
pack with `pnpm --dir packages/wasm pack --pack-destination /tmp`.

The admin API fixture was captured from Bankd's shipped `.8` bundle. CI checks
that its exports remain present and compares address derivation, compliance
scalar, and registration leaf bytes. The seed-binding bridge uses the existing
cross-language test vector. These checks do not validate proof generation.
