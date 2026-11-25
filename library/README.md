# @syntaxval/aphelion

Zero-polyfill, `Uint8Array`-first Stellar HD account & keypair generation library.

Implements **BIP39**, **SLIP-0010 (Ed25519)**, **BIP44**, **SEP-0005** (`m/44'/148'/account'`), and **SEP-0023** (StrKey) with only 3 audited runtime dependencies (`@noble/hashes`, `@noble/curves`, `@scure/bip39`).

## Usage

```ts
import {
  generateMnemonic,
  mnemonicToSeed,
  deriveAccounts,
  zeroBytes,
  LANGUAGE,
  ENTROPY,
} from "@syntaxval/aphelion";

const mnemonic = generateMnemonic(LANGUAGE.EN, ENTROPY.BITS_256);
const seed = mnemonicToSeed(mnemonic, "optional-passphrase");

try {
  const accounts = deriveAccounts(seed, 0, 5);
  for (const acc of accounts) {
    console.log(acc.path, acc.keypair.publicKey());
    acc.keypair.destroy(); // zeroes private key bytes
  }
} finally {
  zeroBytes(seed); // zeroes 64-byte seed
}
```
