import { IconShield } from "../lib/icons";

export function AboutView() {
  return (
    <div>
      <header class="hero">
        <h1>About Aphelion</h1>
        <p>
          Aphelion is named after the coldest, most distant point in an orbit. It generates BIP39
          mnemonics and derives Stellar Ed25519 accounts locally in browser memory.
        </p>
      </header>

      <div class="info-grid">
        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">How key derivation works</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Aphelion draws 128-bit (12-word) or 256-bit (24-word) entropy from{" "}
            <code>crypto.getRandomValues</code>. If you enter dice rolls or random keystrokes, it
            hashes that input together with the browser output using SHA-256.
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 0 }}>
            From the mnemonic and optional BIP39 passphrase, Aphelion derives Ed25519 keys with
            SLIP-0010 along Stellar's SEP-0005 path <code>m/44'/148'/account'</code> and encodes
            addresses with SEP-0023 StrKey CRC16-XModem checksums.
          </p>
        </article>

        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">
            <IconShield /> Offline execution and vault hygiene
          </h2>
          <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "1.2rem", marginBottom: 0 }}>
            <li>A Content-Security-Policy blocks outbound requests with <code>connect-src 'none'</code>.</li>
            <li>Keys live in <code>Uint8Array</code> buffers that <code>.destroy()</code> overwrites with zeros.</li>
            <li>Secret keys and phrases stay masked until clicked, and switching tabs masks them again.</li>
            <li>Copying a secret clears the clipboard after 30 seconds, and 5 minutes of inactivity wipes the vault.</li>
          </ul>
        </article>
      </div>

      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Runtime dependency audit</h2>
          <span class="chip chip-safe">4 packages, zero polyfills, zero UI libraries</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: 0 }}>
          The browser bundle ships four third-party runtime packages:
        </p>
        <div class="table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Purpose</th>
                <th>Audit status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>@noble/hashes</code></td>
                <td>SHA-256, SHA-512, HMAC-SHA512, PBKDF2</td>
                <td>Audited by Cure53, zero sub-dependencies, pure <code>Uint8Array</code></td>
              </tr>
              <tr>
                <td><code>@noble/curves</code></td>
                <td>Ed25519 public key derivation</td>
                <td>Audited by Cure53, constant-time math, zero sub-dependencies</td>
              </tr>
              <tr>
                <td><code>@scure/bip39</code></td>
                <td>BIP39 mnemonics, checksums, 8 wordlists</td>
                <td>Written by the <code>@noble</code> author, pure <code>Uint8Array</code>, no <code>Buffer</code></td>
              </tr>
              <tr>
                <td><code>preact</code></td>
                <td>Reactive UI rendering (~4 KB gzipped)</td>
                <td>Zero runtime sub-dependencies, about 1,500 lines of code</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 0, marginTop: "0.85rem" }}>
          This repository also implements SEP-0023 StrKey encoding (CRC16-XModem and Base32),
          ISO/IEC 18004 SVG QR codes, and hash routing without external packages.
        </p>
      </section>

      <section class="card">
        <h2 class="card-title">Air-gapped offline usage</h2>
        <ol style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "1.25rem", marginBottom: 0 }}>
          <li>Download the single-file <code>aphelion-offline.html</code> and its <code>.sha256</code> file.</li>
          <li>
            Verify the checksum before transferring: <code>shasum -a 256 -c aphelion-offline.html.sha256</code>
          </li>
          <li>Copy the HTML file over USB to a computer that has never connected to the internet.</li>
          <li>Open <code>aphelion-offline.html</code> directly in a browser over <code>file://</code>.</li>
        </ol>
      </section>

      <section class="card">
        <h2 class="card-title">Project history</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 0 }}>
          Aphelion is a clean-slate rewrite of the legacy{" "}
          <a href="https://github.com/stellar-fox/redshift" target="_blank" rel="noopener noreferrer">
            stellar-fox/redshift
          </a>{" "}
          repository. It moves the codebase to <code>@syntaxval/aphelion</code>, removes Node.js
          polyfills, adds strict derivation bounds checks, and ships a standalone offline HTML
          bundle.
        </p>
      </section>
    </div>
  );
}
