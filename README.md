# Aphelion

**Air-gapped Stellar Hierarchical Deterministic (HD) Cold Key Vault.**

Named after the coldest, most distant point in an orbit, **Aphelion** is a minimal, zero-polyfill, security-first Stellar account generator and mnemonic vault. All cryptography runs locally in `Uint8Array` memory with zero network calls and only **4 runtime dependencies** across the entire shipped application.

> Aphelion is a modernized, security-hardened successor to the legacy [`stellar-fox/redshift`](https://github.com/stellar-fox/redshift) project.

---

## Features

- **Standard Compliant**: BIP39 (12-word / 128-bit & 24-word / 256-bit across 8 languages), SLIP-0010 (Ed25519), BIP44, SEP-0005 (`m/44'/148'/account'`), and SEP-0023 (StrKey).
- **Zero Node Polyfills**: Pure `Uint8Array` cryptography with explicit `.destroy()` memory scrubbing—no `Buffer`, no `process`, no `@stellar/stellar-sdk`.
- **Full Vault Hygiene**:
  - Secret keys and mnemonics masked by default (click/tap to reveal).
  - Copy with **30-second clipboard auto-clear countdown** (plus `file://` safe fallback).
  - Automatic secret masking on tab switch (`visibilitychange`).
  - 5-minute inactivity auto-wipe + instant **Wipe Vault** action.
  - Strict Content-Security-Policy (`connect-src 'none'`).
- **Custom Entropy Mixer**: Combine Web Crypto CSPRNG with optional dice rolls or keyboard entropy via SHA-256 without weakening CSPRNG security.
- **Backup Verification Quiz**: Confirm 3 random words from your generated phrase before closing.
- **Multi-Account HD Derivation**: Inspect `m/44'/148'/0'` through `N'` or jump to any account index (`0` to `2,147,483,647`).
- **Printable Paper Wallet + Zero-Dep SVG QR Codes**: Clean black-and-white `@media print` layout with built-in vector QR codes.
- **True Air-Gapped Offline Distribution**: Ships both as a GitHub Pages PWA and a standalone single-file `aphelion-offline.html` (with SHA-256 checksum) that opens directly via `file://`.

---

## Runtime Dependency Audit

Every runtime dependency shipped to the browser:

| Package | Purpose | Audit / Notes |
| :--- | :--- | :--- |
| `@noble/hashes` | SHA-256, SHA-512, HMAC-SHA512, PBKDF2 | Cure53-audited, zero sub-dependencies |
| `@noble/curves` | Ed25519 public key derivation | Cure53-audited, constant-time, zero sub-dependencies |
| `@scure/bip39` | BIP39 mnemonics, validation, 8 wordlists | By `@noble` author (Paul Miller), pure `Uint8Array` |
| `preact` | Lightweight reactive UI (~4 KB gzipped) | Zero runtime sub-dependencies |

Built-in zero-dependency modules authored in-repo:
- **SEP-0023 StrKey** (`library/src/strkey.ts`) — CRC16-XModem + RFC 4648 Base32
- **QR Code SVG Generator** (`frontend/src/lib/qr.ts`) — ISO/IEC 18004 Model 2 vector SVG
- **Hash Router** (`frontend/src/lib/router.ts`) — Native `window.location.hash`

---

## Getting Started

```bash
npm install
npm run build:lib
npm test
npm run dev
```

### Production & Air-Gapped Builds

```bash
# Build library + PWA (frontend/dist) + single-file offline HTML (frontend/dist-offline)
npm run build
```

Verify the standalone offline bundle before transferring to an air-gapped machine:

```bash
shasum -a 256 -c frontend/dist-offline/aphelion-offline.html.sha256
```

---

## License

Licensed under the **Apache License 2.0**.
