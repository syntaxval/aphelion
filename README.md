# Aphelion

[![CI/CD](https://github.com/syntaxval/aphelion/actions/workflows/ci.yml/badge.svg)](https://github.com/syntaxval/aphelion/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-f4b004.svg)](https://github.com/syntaxval/aphelion/blob/main/LICENSE)
[![Runtime Dependencies: 4](https://img.shields.io/badge/runtime_deps-4-2dd4a0.svg)](#runtime-dependency-audit)
[![Offline HTML: 250 KB](https://img.shields.io/badge/offline_html-250_KB-0f2e53.svg)](https://syntaxval.github.io/aphelion/aphelion-offline.html)
[![Standards: BIP39 | SLIP-0010 | SEP-0005](https://img.shields.io/badge/standards-BIP39_%7C_SLIP--0010_%7C_SEP--0005-1a3a63.svg)](#what-aphelion-does)

Offline Stellar Hierarchical Deterministic (HD) key generator and cold storage vault.

Live app: [syntaxval.github.io/aphelion](https://syntaxval.github.io/aphelion/)
Single-file offline download: [aphelion-offline.html](https://syntaxval.github.io/aphelion/aphelion-offline.html) ([SHA-256 checksum](https://syntaxval.github.io/aphelion/aphelion-offline.html.sha256))

Aphelion generates BIP39 mnemonics and derives Stellar Ed25519 keypairs locally in browser memory. The app makes zero network requests, ships 4 runtime dependencies, and runs without Node.js polyfills.

This project is a clean-slate rewrite of the legacy [stellar-fox/redshift](https://github.com/stellar-fox/redshift) repository.

## What Aphelion does

- **Standard key derivation.** Generates 12-word (128-bit) and 24-word (256-bit) BIP39 mnemonics across 8 languages, derives Ed25519 keys with SLIP-0010 along Stellar's SEP-0005 path `m/44'/148'/account'`, and encodes `G...` and `S...` keys with SEP-0023 StrKey CRC16-XModem checksums.
- **Zero Node polyfills.** All cryptographic operations use `Uint8Array` directly. Calling `.destroy()` on an `AphelionKeypair` overwrites the 32-byte private key with zeros, and `zeroBytes()` clears the 64-byte seed. No `Buffer`, `process`, or `@stellar/stellar-sdk` is bundled.
- **Vault hygiene in the browser.** Secret keys and recovery phrases stay masked until clicked. Copying a secret starts a 30-second countdown that clears the clipboard. Switching tabs re-masks all secrets, 5 minutes of inactivity wipes memory, and a strict Content-Security-Policy blocks outbound connections with `connect-src 'none'`.
- **Custom entropy mixing.** Optional dice rolls or random keystrokes are hashed with `crypto.getRandomValues` output through SHA-256 so user input can only add unpredictability.
- **Backup verification and paper wallets.** Includes a 3-word backup confirmation quiz, a multi-account derivation explorer for indices `0` through `2,147,483,647`, in-repo vector SVG QR codes, and a black-and-white print stylesheet.
- **Single-file air-gap bundle.** Alongside the GitHub Pages PWA, the build outputs a self-contained 250 KB `aphelion-offline.html` file that opens directly over `file://` on an offline computer.

## Runtime dependency audit

Every third-party runtime package shipped to the browser:

| Package | Purpose | Audit status |
| :--- | :--- | :--- |
| `@noble/hashes` | SHA-256, SHA-512, HMAC-SHA512, PBKDF2 | Audited by Cure53, zero sub-dependencies |
| `@noble/curves` | Ed25519 public key derivation | Audited by Cure53, zero sub-dependencies |
| `@scure/bip39` | BIP39 mnemonics, checksums, 8 wordlists | Written by the `@noble` author, pure `Uint8Array` |
| `preact` | Reactive UI rendering (~4 KB gzipped) | Zero runtime sub-dependencies |

Three additional modules live directly in this repository with zero external dependencies:

- `library/src/strkey.ts` implements SEP-0023 Base32 encoding and CRC16-XModem checksums.
- `frontend/src/lib/qr.ts` implements ISO/IEC 18004 QR Code Model 2 SVG generation.
- `frontend/src/lib/router.ts` handles hash navigation over `window.location.hash`.

## Getting started

```bash
npm install
npm run build:lib
npm test
npm run dev
```

`npm test` runs the Vitest suite against all 40 keys in SEP-0005 Test Vectors 3 and 4, all 8 BIP39 wordlists, account index bounds checks, StrKey tamper detection, and keypair memory zeroing.

## Production and air-gapped builds

```bash
npm run build
```

This builds the `@syntaxval/aphelion` library, the PWA in `frontend/dist`, and the standalone offline file in `frontend/dist-offline/aphelion-offline.html`.

Verify the checksum before copying the offline bundle to an air-gapped machine:

```bash
cd frontend/dist-offline && shasum -a 256 -c aphelion-offline.html.sha256
```

Open `aphelion-offline.html` directly in a modern browser over `file://`.

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE).
