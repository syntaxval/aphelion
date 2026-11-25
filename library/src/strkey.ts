/**
 * SEP-0023 Stellar StrKey encoder/decoder (Ed25519 public keys & secret seeds).
 * Pure Uint8Array implementation using RFC 4648 Base32 and CRC16-XModem.
 *
 * @module @syntaxval/aphelion/strkey
 * @license Apache-2.0
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const BASE32_LOOKUP = new Int8Array(128).fill(-1);
for (let i = 0; i < BASE32_ALPHABET.length; i++) {
  BASE32_LOOKUP[BASE32_ALPHABET.charCodeAt(i)] = i;
}

export const STRKEY_VERSION = {
  ED25519_PUBLIC_KEY: 6 << 3, // 'G' (48 / 0x30)
  ED25519_SECRET_SEED: 18 << 3, // 'S' (144 / 0x90)
} as const;

/**
 * CRC16-XModem checksum (polynomial 0x1021, init 0x0000).
 */
export function crc16XModem(data: Uint8Array): number {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data[i]! & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

/**
 * RFC 4648 Base32 encode (uppercase, unpadded — Stellar 35-byte StrKeys are
 * an exact multiple of 5 bytes, producing 56 characters with no padding).
 */
function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < bytes.length; i++) {
    buffer = (buffer << 8) | bytes[i]!;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      out += BASE32_ALPHABET[(buffer >>> bitsLeft) & 0x1f]!;
    }
  }

  if (bitsLeft > 0) {
    out += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f]!;
  }

  return out;
}

/**
 * RFC 4648 Base32 decode (strict uppercase, no padding).
 */
function base32Decode(str: string): Uint8Array {
  if (str.length === 0 || (str.length * 5) % 8 >= 5) {
    throw new Error("Invalid Base32 string length");
  }

  const outLen = Math.floor((str.length * 5) / 8);
  const out = new Uint8Array(outLen);
  let buffer = 0;
  let bitsLeft = 0;
  let index = 0;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 128) {
      throw new Error("Invalid Base32 character");
    }
    const val = BASE32_LOOKUP[code]!;
    if (val < 0) {
      throw new Error("Invalid Base32 character");
    }
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      out[index++] = (buffer >>> bitsLeft) & 0xff;
    }
  }

  // Non-zero trailing unused bits are invalid in canonical Base32
  if (bitsLeft > 0 && (buffer & ((1 << bitsLeft) - 1)) !== 0) {
    throw new Error("Invalid Base32 trailing bits");
  }

  return out;
}

function encodeRaw(versionByte: number, payload: Uint8Array): string {
  if (!(payload instanceof Uint8Array) || payload.length !== 32) {
    throw new TypeError("StrKey payload must be a 32-byte Uint8Array");
  }

  const versioned = new Uint8Array(35);
  try {
    versioned[0] = versionByte;
    versioned.set(payload, 1);

    const crc = crc16XModem(versioned.subarray(0, 33));
    versioned[33] = crc & 0xff; // Little-endian low byte
    versioned[34] = (crc >>> 8) & 0xff; // Little-endian high byte

    return base32Encode(versioned);
  } finally {
    versioned.fill(0);
  }
}

function decodeRaw(expectedVersion: number, encoded: string): Uint8Array {
  if (typeof encoded !== "string" || encoded.length !== 56) {
    throw new Error("Invalid StrKey length (expected 56 characters)");
  }

  const decoded = base32Decode(encoded);
  try {
    if (decoded.length !== 35) {
      throw new Error("Invalid decoded StrKey byte length");
    }
    if (decoded[0] !== expectedVersion) {
      throw new Error("Unexpected StrKey version byte");
    }

    const expectedCrc = crc16XModem(decoded.subarray(0, 33));
    const actualCrc = decoded[33]! | (decoded[34]! << 8);
    if (expectedCrc !== actualCrc) {
      throw new Error("Invalid StrKey CRC16 checksum");
    }

    return decoded.slice(1, 33);
  } finally {
    decoded.fill(0);
  }
}

/** Encode a 32-byte Ed25519 public key into a Stellar G... address. */
export function encodeEd25519PublicKey(rawPublicKey: Uint8Array): string {
  return encodeRaw(STRKEY_VERSION.ED25519_PUBLIC_KEY, rawPublicKey);
}

/** Encode a 32-byte Ed25519 seed into a Stellar S... secret key. */
export function encodeEd25519SecretSeed(rawSeed: Uint8Array): string {
  return encodeRaw(STRKEY_VERSION.ED25519_SECRET_SEED, rawSeed);
}

/** Decode a Stellar G... address into its 32-byte Ed25519 public key. */
export function decodeEd25519PublicKey(address: string): Uint8Array {
  return decodeRaw(STRKEY_VERSION.ED25519_PUBLIC_KEY, address);
}

/** Decode a Stellar S... secret key into its 32-byte Ed25519 seed. */
export function decodeEd25519SecretSeed(secret: string): Uint8Array {
  return decodeRaw(STRKEY_VERSION.ED25519_SECRET_SEED, secret);
}

/** Return true if the string is a valid SEP-0023 Stellar public key (G...). */
export function isValidPublicKey(address: string): boolean {
  try {
    const raw = decodeEd25519PublicKey(address);
    raw.fill(0);
    return true;
  } catch {
    return false;
  }
}

/** Return true if the string is a valid SEP-0023 Stellar secret seed (S...). */
export function isValidSecretKey(secret: string): boolean {
  try {
    const raw = decodeEd25519SecretSeed(secret);
    raw.fill(0);
    return true;
  } catch {
    return false;
  }
}
