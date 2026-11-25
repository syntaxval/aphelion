import { IconShield } from "../lib/icons";

export function AboutView() {
  return (
    <div>
      <header class="hero">
        <h1>About Aphelion</h1>
        <p>
          Named after the coldest, most distant point in orbit — engineered as a minimal, auditable,
          air-gapped Stellar Hierarchical Deterministic (HD) cold key vault.
        </p>
      </header>

      <div class="info-grid">
        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">How Key Derivation Works</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Aphelion generates 128-bit (12-word) or 256-bit (24-word) entropy using your browser's
            CSPRNG (<code>crypto.getRandomValues</code>), optionally mixed via SHA-256 with your own
            dice rolls or random keystrokes.
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 0 }}>
            From that mnemonic and optional BIP39 passphrase, accounts are derived deterministically
            using <strong>SLIP-0010 (Ed25519)</strong> along Stellar's canonical{" "}
            <strong>SEP-0005</strong> path <code>m/44'/148'/account'</code> and encoded with{" "}
            <strong>SEP-0023</strong> StrKey checksums.
          </p>
        </article>

        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">
            <IconShield /> Zero Network &amp; Vault Hygiene
          </h2>
          <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "1.2rem", marginBottom: 0 }}>
            <li>Enforced <code>connect-src 'none'</code> Content-Security-Policy.</li>
            <li>Pure <code>Uint8Array</code> memory model with explicit <code>.destroy()</code> zeroing.</li>
            <li>Secrets masked by default and automatically blurred when switching tabs.</li>
            <li>30-second clipboard auto-clear countdown and 5-minute idle auto-wipe.</li>
          </ul>
        </article>
      </div>

      <section class="card">
        <div class="card-header">
          <h2 class="card-title">Runtime Dependency Audit (4 Packages Total)</h2>
          <span class="chip chip-safe">0 UI Frameworks · 0 Node Polyfills · 0 Network Libs</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: 0 }}>
          Every third-party package shipped to your browser is listed below for full transparency and auditability:
        </p>
        <div class="table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Role</th>
                <th>Audit &amp; Security Profile</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>@noble/hashes</code></td>
                <td>SHA-256, SHA-512, HMAC-SHA512, PBKDF2</td>
                <td>Audited by Cure53; zero sub-dependencies; pure JS <code>Uint8Array</code>.</td>
              </tr>
              <tr>
                <td><code>@noble/curves</code></td>
                <td>Ed25519 public key derivation</td>
                <td>Audited by Cure53; constant-time primitives; zero sub-dependencies.</td>
              </tr>
              <tr>
                <td><code>@scure/bip39</code></td>
                <td>BIP39 mnemonics, validation &amp; 8 wordlists</td>
                <td>By the <code>@noble</code> author (Paul Miller); pure <code>Uint8Array</code>, zero <code>Buffer</code>.</td>
              </tr>
              <tr>
                <td><code>preact</code></td>
                <td>Lightweight reactive UI (~4 KB gzipped)</td>
                <td>Zero runtime sub-dependencies; ~1,500 lines of readable source.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 0, marginTop: "0.85rem" }}>
          SEP-0023 StrKey encoding (CRC16-XModem + Base32), ISO/IEC 18004 SVG QR code generation, and
          hash routing are authored directly in-repo with zero external dependencies.
        </p>
      </section>

      <section class="card">
        <h2 class="card-title">Air-Gapped Offline Usage</h2>
        <ol style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "1.25rem", marginBottom: 0 }}>
          <li>Download the single-file <code>aphelion-offline.html</code> and its <code>.sha256</code> checksum.</li>
          <li>
            Verify integrity before transferring: <code>shasum -a 256 -c aphelion-offline.html.sha256</code>
          </li>
          <li>Copy the single HTML file via USB to an air-gapped computer (never connected to the internet).</li>
          <li>Double-click <code>aphelion-offline.html</code> to open directly over <code>file://</code> and generate your vault.</li>
        </ol>
      </section>

      <section class="card">
        <h2 class="card-title">Project Heritage</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 0 }}>
          Aphelion is a clean-slate, modernized incarnation of the legacy{" "}
          <a href="https://github.com/stellar-fox/redshift" target="_blank" rel="noopener noreferrer">
            stellar-fox/redshift
          </a>{" "}
          project, rebuilt from the ground up under <code>@syntaxval/aphelion</code> with zero Node
          polyfills, strict cryptographic bounds checking, and modern vault ergonomics.
        </p>
      </section>
    </div>
  );
}
