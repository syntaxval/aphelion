/**
 * Lightweight, zero-polyfill Ed25519 Stellar Keypair with explicit memory scrubbing.
 *
 * @module @syntaxval/aphelion/keypair
 * @license Apache-2.0
 */

import { ed25519 } from "@noble/curves/ed25519";
import { zeroBytes } from "./entropy";
import {
  decodeEd25519SecretSeed,
  encodeEd25519PublicKey,
  encodeEd25519SecretSeed,
} from "./strkey";

export class AphelionKeypair {
  private _secretSeed: Uint8Array;
  private _publicKey: Uint8Array;
  private _destroyed = false;

  private constructor(rawSeed: Uint8Array) {
    if (!(rawSeed instanceof Uint8Array) || rawSeed.length !== 32) {
      throw new TypeError("Ed25519 seed must be a 32-byte Uint8Array");
    }
    this._secretSeed = rawSeed.slice();
    this._publicKey = ed25519.getPublicKey(this._secretSeed);
  }

  /** Construct a keypair from a 32-byte raw Ed25519 seed (copies input bytes). */
  static fromRawEd25519Seed(rawSeed: Uint8Array): AphelionKeypair {
    return new AphelionKeypair(rawSeed);
  }

  /** Construct a keypair from a Stellar S... secret key string. */
  static fromSecret(secret: string): AphelionKeypair {
    const raw = decodeEd25519SecretSeed(secret);
    try {
      return new AphelionKeypair(raw);
    } finally {
      raw.fill(0);
    }
  }

  /** Whether secret key bytes have been wiped from memory. */
  get isDestroyed(): boolean {
    return this._destroyed;
  }

  /** Return the Stellar G... public address. */
  publicKey(): string {
    return encodeEd25519PublicKey(this._publicKey);
  }

  /** Return the Stellar S... secret key. Throws if destroyed. */
  secret(): string {
    if (this._destroyed) {
      throw new Error("AphelionKeypair has been destroyed; secret key is no longer available");
    }
    return encodeEd25519SecretSeed(this._secretSeed);
  }

  /** Return a defensive copy of the 32-byte public key. */
  rawPublicKey(): Uint8Array {
    return this._publicKey.slice();
  }

  /** Return a defensive copy of the 32-byte secret seed. Throws if destroyed. */
  rawSecretKey(): Uint8Array {
    if (this._destroyed) {
      throw new Error("AphelionKeypair has been destroyed; secret key is no longer available");
    }
    return this._secretSeed.slice();
  }

  /**
   * Explicitly overwrite private key bytes in memory with zeros.
   * Safe to call multiple times.
   */
  destroy(): void {
    if (!this._destroyed) {
      zeroBytes(this._secretSeed);
      this._destroyed = true;
    }
  }
}
