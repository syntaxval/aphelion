/**
 * Cryptographic entropy generation and safe user-entropy mixing.
 *
 * @module @syntaxval/aphelion/entropy
 * @license Apache-2.0
 */

import { sha256 } from "@noble/hashes/sha256";

export const ENTROPY = {
  BITS_128: 128,
  BITS_256: 256,
} as const;

export type EntropyBits = (typeof ENTROPY)[keyof typeof ENTROPY];

const DOMAIN_SEPARATOR = new TextEncoder().encode("aphelion:entropy-mix:v1:");

/**
 * Overwrite one or more Uint8Arrays with zeros in-place.
 */
export function zeroBytes(...buffers: Array<Uint8Array | null | undefined>): void {
  for (const buf of buffers) {
    if (buf instanceof Uint8Array) {
      buf.fill(0);
    }
  }
}

/**
 * Generate cryptographically secure entropy bytes.
 *
 * Always draws full entropy from Web Crypto CSPRNG (`crypto.getRandomValues`).
 * If `userEntropy` (e.g., dice rolls or keyboard input) is supplied, it is
 * domain-separated and hashed together with the CSPRNG bytes via SHA-256 so
 * user input can only increase unpredictability and never degrade CSPRNG quality.
 */
export function generateEntropy(
  bits: EntropyBits = ENTROPY.BITS_256,
  userEntropy?: string | Uint8Array
): Uint8Array {
  if (bits !== ENTROPY.BITS_128 && bits !== ENTROPY.BITS_256) {
    throw new RangeError(`Unsupported entropy size: ${String(bits)}. Expected 128 or 256.`);
  }

  const byteLength = bits / 8;
  const csprng = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(csprng);

  if (userEntropy === undefined) {
    return csprng;
  }

  const extraBytes =
    typeof userEntropy === "string"
      ? new TextEncoder().encode(userEntropy.trim())
      : new Uint8Array(userEntropy);

  if (extraBytes.length === 0) {
    return csprng;
  }

  const combined = new Uint8Array(
    DOMAIN_SEPARATOR.length + csprng.length + extraBytes.length
  );
  let digest: Uint8Array | undefined;

  try {
    combined.set(DOMAIN_SEPARATOR, 0);
    combined.set(csprng, DOMAIN_SEPARATOR.length);
    combined.set(extraBytes, DOMAIN_SEPARATOR.length + csprng.length);

    digest = sha256(combined);
    return digest.slice(0, byteLength);
  } finally {
    zeroBytes(csprng, extraBytes, combined, digest);
  }
}
