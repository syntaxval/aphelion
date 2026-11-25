/**
 * @syntaxval/aphelion
 * Zero-polyfill, Uint8Array-first Stellar HD account & keypair library.
 * Implements BIP39, SLIP-0010 (Ed25519), BIP44, SEP-0005, and SEP-0023.
 *
 * @module @syntaxval/aphelion
 * @license Apache-2.0
 */

import {
  entropyToMnemonic,
  mnemonicToSeedSync,
  validateMnemonic as scureValidateMnemonic,
} from "@scure/bip39";
import { wordlist as chineseSimplified } from "@scure/bip39/wordlists/simplified-chinese";
import { wordlist as chineseTraditional } from "@scure/bip39/wordlists/traditional-chinese";
import { wordlist as english } from "@scure/bip39/wordlists/english";
import { wordlist as french } from "@scure/bip39/wordlists/french";
import { wordlist as italian } from "@scure/bip39/wordlists/italian";
import { wordlist as japanese } from "@scure/bip39/wordlists/japanese";
import { wordlist as korean } from "@scure/bip39/wordlists/korean";
import { wordlist as spanish } from "@scure/bip39/wordlists/spanish";

import { ENTROPY, generateEntropy, zeroBytes, type EntropyBits } from "./entropy";
import {
  deriveAccounts,
  deriveKeypair,
  formatDerivationPath,
  MAX_ACCOUNT_INDEX,
  STELLAR_DERIVATION_PREFIX,
  type DerivedAccount,
} from "./hd";
import { AphelionKeypair } from "./keypair";
import {
  crc16XModem,
  decodeEd25519PublicKey,
  decodeEd25519SecretSeed,
  encodeEd25519PublicKey,
  encodeEd25519SecretSeed,
  isValidPublicKey,
  isValidSecretKey,
  STRKEY_VERSION,
} from "./strkey";

export const LANGUAGE = {
  EN: "english",
  SP: "spanish",
  FR: "french",
  IT: "italian",
  JP: "japanese",
  CN: "chinese_simplified",
  CT: "chinese_traditional",
  KR: "korean",
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

const WORDLISTS: Record<Language, readonly string[]> = {
  [LANGUAGE.EN]: english,
  [LANGUAGE.SP]: spanish,
  [LANGUAGE.FR]: french,
  [LANGUAGE.IT]: italian,
  [LANGUAGE.JP]: japanese,
  [LANGUAGE.CN]: chineseSimplified,
  [LANGUAGE.CT]: chineseTraditional,
  [LANGUAGE.KR]: korean,
};

export function getWordlist(language: Language = LANGUAGE.EN): readonly string[] {
  const list = WORDLISTS[language];
  if (!list) {
    throw new RangeError(`Unsupported BIP39 language: ${String(language)}`);
  }
  return list;
}

/**
 * Normalize whitespace and Unicode NFKD form for a mnemonic phrase.
 * Handles both ASCII spaces and Japanese ideographic spaces (\u3000).
 */
export function normalizeMnemonic(
  mnemonic: string,
  language: Language = LANGUAGE.EN
): string {
  const words = mnemonic
    .normalize("NFKD")
    .trim()
    .split(/[\s\u3000]+/)
    .filter(Boolean);
  const separator = language === LANGUAGE.JP ? "\u3000" : " ";
  return words.join(separator);
}

/**
 * Split a mnemonic into an array of normalized words regardless of space type.
 */
export function splitMnemonicWords(mnemonic: string): string[] {
  return mnemonic
    .normalize("NFKD")
    .trim()
    .split(/[\s\u3000]+/)
    .filter(Boolean);
}

/**
 * Generate a BIP39 mnemonic phrase (12 words = 128 bits, 24 words = 256 bits).
 * Optionally mixes user-supplied entropy with Web Crypto CSPRNG via SHA-256.
 */
export function generateMnemonic(
  language: Language = LANGUAGE.EN,
  entropyBits: EntropyBits = ENTROPY.BITS_256,
  userEntropy?: string | Uint8Array
): string {
  const wordlist = getWordlist(language) as string[];
  const entropy = generateEntropy(entropyBits, userEntropy);
  try {
    return entropyToMnemonic(entropy, wordlist);
  } finally {
    zeroBytes(entropy);
  }
}

/**
 * Validate a BIP39 mnemonic phrase (word membership & checksum).
 */
export function validateMnemonic(
  mnemonic: string,
  language: Language = LANGUAGE.EN
): boolean {
  if (typeof mnemonic !== "string" || mnemonic.trim().length === 0) {
    return false;
  }
  const wordlist = getWordlist(language) as string[];
  // @scure/bip39 expects single ASCII spaces internally after NFKD normalization
  const normalized = splitMnemonicWords(mnemonic).join(" ");
  return scureValidateMnemonic(normalized, wordlist);
}

/**
 * Derive a 64-byte mutable BIP39 seed Uint8Array from a mnemonic and optional passphrase.
 * Caller should call `zeroBytes(seed)` when finished deriving accounts.
 */
export function mnemonicToSeed(mnemonic: string, passphrase: string = ""): Uint8Array {
  if (typeof mnemonic !== "string" || typeof passphrase !== "string") {
    throw new TypeError("mnemonic and passphrase must be strings");
  }
  const normalized = splitMnemonicWords(mnemonic).join(" ");
  return mnemonicToSeedSync(normalized, passphrase);
}

export {
  AphelionKeypair,
  crc16XModem,
  decodeEd25519PublicKey,
  decodeEd25519SecretSeed,
  deriveAccounts,
  deriveKeypair,
  encodeEd25519PublicKey,
  encodeEd25519SecretSeed,
  ENTROPY,
  formatDerivationPath,
  generateEntropy,
  isValidPublicKey,
  isValidSecretKey,
  MAX_ACCOUNT_INDEX,
  STELLAR_DERIVATION_PREFIX,
  STRKEY_VERSION,
  zeroBytes,
};

export type { DerivedAccount, EntropyBits };
