/**
 * SLIP-0010 / SEP-0005 Hierarchical Deterministic Ed25519 key derivation for Stellar.
 * Path: m / 44' / 148' / account'
 *
 * @module @syntaxval/aphelion/hd
 * @license Apache-2.0
 */

import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import { zeroBytes } from "./entropy";
import { AphelionKeypair } from "./keypair";

const ED25519_CURVE = new TextEncoder().encode("ed25519 seed");
const HARDENED_OFFSET = 0x80000000;

export const MAX_ACCOUNT_INDEX = 0x7fffffff; // 2,147,483,647 (max uint31 hardened index)
export const STELLAR_DERIVATION_PREFIX = "m/44'/148'";

export interface DerivedAccount {
  index: number;
  path: string;
  keypair: AphelionKeypair;
}

function assertValidSeed(seed: Uint8Array): void {
  if (!(seed instanceof Uint8Array)) {
    throw new TypeError("Seed must be a Uint8Array");
  }
  if (seed.length < 16 || seed.length > 64) {
    throw new RangeError(
      `Invalid seed byte length: ${seed.length}. Expected between 16 and 64 bytes.`
    );
  }
}

function assertValidAccountIndex(account: number): void {
  if (
    typeof account !== "number" ||
    !Number.isInteger(account) ||
    account < 0 ||
    account > MAX_ACCOUNT_INDEX
  ) {
    throw new RangeError(
      `Invalid account index: ${String(account)}. Must be an integer between 0 and ${MAX_ACCOUNT_INDEX}.`
    );
  }
}

/**
 * Format the canonical SEP-0005 derivation path for an account index.
 */
export function formatDerivationPath(account: number): string {
  assertValidAccountIndex(account);
  return `${STELLAR_DERIVATION_PREFIX}/${account}'`;
}

/**
 * Derive a Stellar Ed25519 keypair at m/44'/148'/account' from a BIP39 seed.
 * Zeroes all intermediate SLIP-0010 buffers before returning.
 */
export function deriveKeypair(seed: Uint8Array, account: number = 0): AphelionKeypair {
  assertValidSeed(seed);
  assertValidAccountIndex(account);

  let parent: Uint8Array = hmac(sha512, ED25519_CURVE, seed);
  const data = new Uint8Array(1 + 32 + 4);
  const view = new DataView(data.buffer);

  try {
    for (const idx of [44, 148, account]) {
      const hardenedIndex = (HARDENED_OFFSET + idx) >>> 0;
      data[0] = 0x00;
      data.set(parent.subarray(0, 32), 1);
      view.setUint32(33, hardenedIndex, false); // Big-endian

      const next: Uint8Array = hmac(sha512, parent.subarray(32, 64), data);
      zeroBytes(parent);
      parent = next;
    }

    return AphelionKeypair.fromRawEd25519Seed(parent.subarray(0, 32));
  } finally {
    zeroBytes(parent, data);
  }
}

/**
 * Derive a contiguous range of Stellar HD accounts starting at `startIndex`.
 */
export function deriveAccounts(
  seed: Uint8Array,
  startIndex: number = 0,
  count: number = 5
): DerivedAccount[] {
  assertValidSeed(seed);
  assertValidAccountIndex(startIndex);
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new RangeError(`Invalid account count: ${String(count)}. Expected integer 1..100.`);
  }
  assertValidAccountIndex(startIndex + count - 1);

  const accounts: DerivedAccount[] = [];
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    accounts.push({
      index,
      path: formatDerivationPath(index),
      keypair: deriveKeypair(seed, index),
    });
  }
  return accounts;
}
