/* tslint:disable */
/* eslint-disable */
/**
* Given a binary-encoded `Metadata`, returns a new binary-encoded `Metadata`
* with the symbol customized if the token is one of several specific types
* that don't have built-in symbols.
* @param {Uint8Array} metadata_bytes
* @returns {Uint8Array}
*/
export function customize_symbol(metadata_bytes: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} address
* @returns {Uint8Array}
*/
export function deriveComplianceScalarForAddress(address: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} message
* @returns {Uint8Array}
*/
export function pocSignDevAssetRegistration(message: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} address
* @param {Uint8Array} asset_id
* @param {string} policy_id
* @returns {Uint8Array}
*/
export function pocBuildDevUserRegistration(address: Uint8Array, asset_id: Uint8Array, policy_id: string): Uint8Array;
/**
* @param {Uint8Array} plan
* @returns {any}
*/
export function pocOrbisAuditBundles(plan: Uint8Array): any;
/**
* Authorize transaction using a spend key.
* @param {Uint8Array} spend_key
* @param {Uint8Array} transaction_plan
* @returns {Uint8Array}
*/
export function authorize(spend_key: Uint8Array, transaction_plan: Uint8Array): Uint8Array;
/**
* Build witness data from a transaction plan and serialized IndexedDB SCT.
* @param {Uint8Array} transaction_plan
* @param {any} stored_tree
* @returns {Uint8Array}
*/
export function witness(transaction_plan: Uint8Array, stored_tree: any): Uint8Array;
/**
* Builds the witness payload required by the local HTTP prover for the
* requested action. This is intentionally binary-only across the WASM
* boundary; ActionPlan JSON is not accepted or produced.
* @param {Uint8Array} transaction_plan
* @param {Uint8Array} action_plan
* @param {Uint8Array} full_viewing_key
* @param {Uint8Array} witness_data
* @returns {any}
*/
export function build_action_proof_request(transaction_plan: Uint8Array, action_plan: Uint8Array, full_viewing_key: Uint8Array, witness_data: Uint8Array): any;
/**
* Builds a binary Action from a binary ActionPlan and a packed gnark proof
* result returned by the local HTTP prover.
* @param {Uint8Array} transaction_plan
* @param {Uint8Array} action_plan
* @param {Uint8Array} full_viewing_key
* @param {Uint8Array} witness_data
* @param {Uint8Array} proof_result
* @returns {Uint8Array}
*/
export function build_action_with_proof_result(transaction_plan: Uint8Array, action_plan: Uint8Array, full_viewing_key: Uint8Array, witness_data: Uint8Array, proof_result: Uint8Array): Uint8Array;
/**
* Deprecated browser entrypoint retained as a hard error so stale consumers do
* not silently fall back to host-only proof generation.
* @param {Uint8Array} _transaction_plan
* @param {Uint8Array} _action_plan
* @param {Uint8Array} _full_viewing_key
* @param {Uint8Array} _witness_data
* @returns {Uint8Array}
*/
export function build_action(_transaction_plan: Uint8Array, _action_plan: Uint8Array, _full_viewing_key: Uint8Array, _witness_data: Uint8Array): Uint8Array;
/**
* Deprecated browser entrypoint retained as a hard error so stale consumers do
* not use host-only transaction proving in WASM.
* @param {Uint8Array} _full_viewing_key
* @param {Uint8Array} _transaction_plan
* @param {Uint8Array} _witness_data
* @param {Uint8Array} _auth_data
* @returns {Uint8Array}
*/
export function build_serial(_full_viewing_key: Uint8Array, _transaction_plan: Uint8Array, _witness_data: Uint8Array, _auth_data: Uint8Array): Uint8Array;
/**
* Build a transaction from binary Actions, a binary TransactionPlan, binary
* WitnessData, and binary AuthorizationData. No Action or ActionPlan JSON is
* accepted at this boundary.
* @param {any} actions
* @param {Uint8Array} transaction_plan
* @param {Uint8Array} witness_data
* @param {Uint8Array} auth_data
* @returns {Uint8Array}
*/
export function build_parallel(actions: any, transaction_plan: Uint8Array, witness_data: Uint8Array, auth_data: Uint8Array): Uint8Array;
/**
* @param {Uint8Array} _full_viewing_key
* @param {Uint8Array} _tx
* @param {any} _idb_constants
* @returns {Promise<TxpAndTxvBytes>}
*/
export function transaction_perspective_and_view(_full_viewing_key: Uint8Array, _tx: Uint8Array, _idb_constants: any): Promise<TxpAndTxvBytes>;
/**
* @param {Uint8Array} _txv
* @returns {Promise<Uint8Array>}
*/
export function transaction_summary(_txv: Uint8Array): Promise<Uint8Array>;
/**
* generate a spend key from a seed phrase
* Arguments:
*     seed_phrase: `string`
* Returns: `Uint8Array representing inner SpendKey`
* @param {string} seed_phrase
* @returns {Uint8Array}
*/
export function generate_spend_key(seed_phrase: string): Uint8Array;
/**
* get full viewing key from spend key
* Arguments:
*     spend_key: `byte representation inner SpendKey`
* Returns: `Uint8Array representing inner FullViewingKey`
* @param {Uint8Array} spend_key
* @returns {Uint8Array}
*/
export function get_full_viewing_key(spend_key: Uint8Array): Uint8Array;
/**
* Wallet id: the hash of a full viewing key, used as an account identifier
* Arguments:
*     full_viewing_key: `byte representation inner FullViewingKey`
* Returns: `WalletId`
* @param {Uint8Array} full_viewing_key
* @returns {Uint8Array}
*/
export function get_wallet_id(full_viewing_key: Uint8Array): Uint8Array;
/**
* get address by index using FVK
* Arguments:
*     full_viewing_key: `byte representation inner FullViewingKey`
*     account: `u32`
*     randomizer: `12 bytes, with 0 bytes representing all 0s implicitly`
* Returns: `Uint8Array representing inner Address`
* @param {Uint8Array} full_viewing_key
* @param {number} account
* @param {Uint8Array} randomizer
* @returns {Uint8Array}
*/
export function get_address_by_index(full_viewing_key: Uint8Array, account: number, randomizer: Uint8Array): Uint8Array;
/**
* get ephemeral (randomizer) address using FVK
* The derivation tree is like "spend key / address index / ephemeral address" so we must also pass index as an argument
* Arguments:
*     full_viewing_key: `byte representation inner FullViewingKey`
*     index: `u32`
* Returns: `Uint8Array representing inner Address`
* @param {Uint8Array} full_viewing_key
* @param {number} index
* @returns {Uint8Array}
*/
export function get_ephemeral_address(full_viewing_key: Uint8Array, index: number): Uint8Array;
/**
* Returns the AddressIndex of an address.
* If it is not controlled by the FVK, it returns a `None`
* Arguments:
*     full_viewing_key: `byte representation inner FullViewingKey`
*     address: `byte representation inner Address`
* Returns: `Option<AddressIndex>`
* @param {Uint8Array} full_viewing_key
* @param {Uint8Array} address
* @returns {any}
*/
export function get_index_by_address(full_viewing_key: Uint8Array, address: Uint8Array): any;
/**
* Checks if address is controlled by full viewing key provided
* @param {Uint8Array} full_viewing_key
* @param {Uint8Array} address
* @returns {boolean}
*/
export function is_controlled_address(full_viewing_key: Uint8Array, address: Uint8Array): boolean;
/**
* Generates an address that can be used as a forwarding address for Noble
* Returns: Uint8Array representing encoded Address
* @param {number} sequence
* @param {Uint8Array} full_viewing_key
* @param {string} channel
* @param {number | undefined} [account]
* @returns {ForwardingAddrResponse}
*/
export function get_noble_forwarding_addr(sequence: number, full_viewing_key: Uint8Array, channel: string, account?: number): ForwardingAddrResponse;
/**
* Returns the "truncated" address (t-addr) associated with the account.
* @param {Uint8Array} full_viewing_key
* @returns {TransparentAddrResponse}
*/
export function get_transparent_address(full_viewing_key: Uint8Array): TransparentAddrResponse;
/**
* get transmission key (public key for this payment address)
* Arguments:
*     address: `byte representation inner Address`
* Returns: `Uint8Array representing inner Address`
* @param {Uint8Array} address
* @returns {Uint8Array}
*/
export function get_transmission_key_by_address(address: Uint8Array): Uint8Array;
/**
* generate the appropriate AssetId for a binary-serialized protobuf
* `AssetId` potentially containing an `altBaseDenom` or `altBech32m` string
* field
*
* Arguments:
*     input_id_bin: `Uint8Array` representing a binary-serialized `AssetId`
*
* Returns:
*     `Uint8Array` representing a binary-serialized `AssetId`
* @param {Uint8Array} input_id_bin
* @returns {Uint8Array}
*/
export function get_asset_id(input_id_bin: Uint8Array): Uint8Array;
/**
* @param {bigint} block_height
* @param {Uint8Array} epoch_bytes
* @returns {bigint}
*/
export function sct_position(block_height: bigint, epoch_bytes: Uint8Array): bigint;
/**
* @param {any} idb_constants
* @param {Uint8Array} request
* @param {Uint8Array} full_viewing_key
* @param {Uint8Array} _gas_fee_token
* @param {string} grpc_url
* @returns {Promise<Uint8Array>}
*/
export function plan_transaction(idb_constants: any, request: Uint8Array, full_viewing_key: Uint8Array, _gas_fee_token: Uint8Array, grpc_url: string): Promise<Uint8Array>;
/**
*/
export class ForwardingAddrResponse {
  free(): void;
/**
* A noble address that will be used for registration on the noble network
*/
  noble_addr_bech32: string;
/**
* Byte representation of the noble forwarding address. Used for broadcasting cosmos message.
*/
  noble_addr_bytes: Uint8Array;
/**
* The shieldd address that a deposit to the noble address with forward to
* Vec encoded `pb::Address`
*/
  shieldd_addr_bytes: Uint8Array;
}
/**
*/
export class TransparentAddrResponse {
  free(): void;
/**
* The raw (binary) transparent address
*/
  address: Uint8Array;
/**
* The t-address encoding of the transparent address
*/
  encoding: string;
}
/**
*/
export class TxpAndTxvBytes {
  free(): void;
/**
*/
  txp: Uint8Array;
/**
*/
  txv: Uint8Array;
}
/**
*/
export class ViewServer {
  free(): void;
/**
* Create new instances of `ViewServer`
* Function opens a connection to indexedDb
* Arguments:
*     full_viewing_key: `byte representation inner FullViewingKey`
*     epoch_duration: `u64`
*     stored_tree: `StoredTree`
*     idb_constants: `IndexedDbConstants`
* Returns: `ViewServer`
* @param {Uint8Array} full_viewing_key
* @param {any} stored_tree
* @param {any} idb_constants
* @returns {Promise<ViewServer>}
*/
  static new(full_viewing_key: Uint8Array, stored_tree: any, idb_constants: any): Promise<ViewServer>;
/**
* Create new instances of `ViewServer` from SCT frontier snapshot.
* @param {Uint8Array} full_viewing_key
* @param {any} idb_constants
* @param {Uint8Array} compact_frontier
* @returns {Promise<ViewServer>}
*/
  static new_snapshot(full_viewing_key: Uint8Array, idb_constants: any, compact_frontier: Uint8Array): Promise<ViewServer>;
/**
* Scans a chunk of the genesis block for notes that can be trial decrypted with the viewing key.
* @param {bigint} start
* @param {Uint8Array} partial_compact_block
* @param {boolean} skip_trial_decrypt
* @returns {Promise<void>}
*/
  scan_genesis_chunk(start: bigint, partial_compact_block: Uint8Array, skip_trial_decrypt: boolean): Promise<void>;
/**
* Reconstructs the state commitment tree (SCT) from the full genesis block using
* the genesis advice.
* @param {Uint8Array} full_compact_block
* @returns {Promise<boolean>}
*/
  genesis_advice(full_compact_block: Uint8Array): Promise<boolean>;
/**
* Scans block for notes.
* Returns true if the block contains new notes or false if the block is empty for us.
*     compact_block: `v1::CompactBlock`
* Scan results are saved in-memory rather than returned
* Use `flush_updates()` to get the scan results
* Returns: `bool`
* @param {Uint8Array} compact_block
* @param {boolean} skip_trial_decrypt
* @returns {Promise<boolean>}
*/
  scan_block(compact_block: Uint8Array, skip_trial_decrypt: boolean): Promise<boolean>;
/**
* Get new notes and SCT state updates.
* Function also clears state
* Returns: `ScanBlockResult`
* @returns {any}
*/
  flush_updates(): any;
/**
* SCT root can be compared with the root obtained by GRPC and verify that there is no divergence
* Returns: `Uint8Array representing a Root`
* @returns {Uint8Array}
*/
  get_sct_root(): Uint8Array;
/**
* Checks if address is controlled by view server full viewing key
* @param {Uint8Array} address
* @returns {boolean}
*/
  is_controlled_address(address: Uint8Array): boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly customize_symbol: (a: number, b: number, c: number) => void;
  readonly deriveComplianceScalarForAddress: (a: number, b: number, c: number) => void;
  readonly pocSignDevAssetRegistration: (a: number, b: number, c: number) => void;
  readonly pocBuildDevUserRegistration: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly pocOrbisAuditBundles: (a: number, b: number, c: number) => void;
  readonly authorize: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly witness: (a: number, b: number, c: number, d: number) => void;
  readonly build_action_proof_request: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly build_action_with_proof_result: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly build_action: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly build_serial: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly build_parallel: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly __wbg_txpandtxvbytes_free: (a: number, b: number) => void;
  readonly __wbg_get_txpandtxvbytes_txp: (a: number, b: number) => void;
  readonly __wbg_set_txpandtxvbytes_txp: (a: number, b: number, c: number) => void;
  readonly __wbg_get_txpandtxvbytes_txv: (a: number, b: number) => void;
  readonly __wbg_set_txpandtxvbytes_txv: (a: number, b: number, c: number) => void;
  readonly transaction_perspective_and_view: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly transaction_summary: (a: number, b: number) => number;
  readonly generate_spend_key: (a: number, b: number, c: number) => void;
  readonly get_full_viewing_key: (a: number, b: number, c: number) => void;
  readonly get_wallet_id: (a: number, b: number, c: number) => void;
  readonly get_address_by_index: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly get_ephemeral_address: (a: number, b: number, c: number, d: number) => void;
  readonly get_index_by_address: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly is_controlled_address: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly __wbg_forwardingaddrresponse_free: (a: number, b: number) => void;
  readonly __wbg_get_forwardingaddrresponse_noble_addr_bech32: (a: number, b: number) => void;
  readonly __wbg_set_forwardingaddrresponse_noble_addr_bech32: (a: number, b: number, c: number) => void;
  readonly __wbg_get_forwardingaddrresponse_noble_addr_bytes: (a: number, b: number) => void;
  readonly __wbg_set_forwardingaddrresponse_noble_addr_bytes: (a: number, b: number, c: number) => void;
  readonly __wbg_get_forwardingaddrresponse_shieldd_addr_bytes: (a: number, b: number) => void;
  readonly __wbg_set_forwardingaddrresponse_shieldd_addr_bytes: (a: number, b: number, c: number) => void;
  readonly get_noble_forwarding_addr: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly __wbg_transparentaddrresponse_free: (a: number, b: number) => void;
  readonly __wbg_get_transparentaddrresponse_address: (a: number, b: number) => void;
  readonly __wbg_get_transparentaddrresponse_encoding: (a: number, b: number) => void;
  readonly get_transparent_address: (a: number, b: number, c: number) => void;
  readonly get_transmission_key_by_address: (a: number, b: number, c: number) => void;
  readonly __wbg_set_transparentaddrresponse_address: (a: number, b: number, c: number) => void;
  readonly __wbg_set_transparentaddrresponse_encoding: (a: number, b: number, c: number) => void;
  readonly get_asset_id: (a: number, b: number, c: number) => void;
  readonly sct_position: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_viewserver_free: (a: number, b: number) => void;
  readonly viewserver_new: (a: number, b: number, c: number, d: number) => number;
  readonly viewserver_new_snapshot: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly viewserver_scan_genesis_chunk: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly viewserver_genesis_advice: (a: number, b: number, c: number) => number;
  readonly viewserver_scan_block: (a: number, b: number, c: number, d: number) => number;
  readonly viewserver_flush_updates: (a: number, b: number) => void;
  readonly viewserver_get_sct_root: (a: number, b: number) => void;
  readonly viewserver_is_controlled_address: (a: number, b: number, c: number, d: number) => void;
  readonly plan_transaction: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly _dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hf5795f46210c030d: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__Fn__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc708157ed3c5a902: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h1f0c456e75ee6284: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h57af48eaa0d5870d: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
