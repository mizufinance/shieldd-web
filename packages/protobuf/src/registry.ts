import { createRegistry, IMessageTypeRegistry } from '@bufbuild/protobuf';

import * as ibcCore from './services/cosmos-ibc-core.js';
import * as shielddCnidarium from './services/shieldd-cnidarium.js';
import * as shielddCore from './services/shieldd-core.js';
import * as shielddCustody from './services/shieldd-custody.js';
import * as shielddUtil from './services/shieldd-util.js';
import * as shielddView from './services/shieldd-view.js';
import { ClientState, Header } from '../gen/ibc/lightclients/tendermint/v1/tendermint_pb.js';

/**
 * This type registry is for JSON serialization of protobuf messages.
 *
 * Some specced messages contain 'Any'-type fields, serialized with type
 * annotation URLs resolved with this registry.
 *
 * This registry currently contains types for all services used in communication
 * with a Shieldd extension, and should be able to resolve any message type
 * encountered.
 */

export const typeRegistry: IMessageTypeRegistry = createRegistry(
  ...Object.values(ibcCore),
  ...Object.values(shielddCnidarium),
  ...Object.values(shielddCore),
  ...Object.values(shielddCustody),
  ...Object.values(shielddUtil),
  ...Object.values(shielddView),

  // Types not explicitly referenced by any above services should be added here.
  // Otherwise, it will not be possible to serialize/deserialize these types if,
  // e.g., they're used in an `Any` protobuf.

  // gen/ibc/lightclients/tendermint/v1/tendermint_pb
  ClientState,
  Header,
);

/**
 * Appropriate for any ConnectRPC `Transport` object or protobuf `Any`
 * pack/unpack that handles protojson expected to contain these registry types.
 * @see https://docs.cosmos.network/v0.50/build/architecture/adr-027-deterministic-protobuf-serialization
 */
export const jsonOptions = {
  typeRegistry,

  // read options
  ignoreUnknownFields: true,

  // write options
  emitDefaultValues: false,
};
