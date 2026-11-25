export function ReferencesView() {
  return (
    <div>
      <header class="hero">
        <h1>References and specifications</h1>
        <p>
          Aphelion is open-source software under the Apache License 2.0. The test suite checks
          derivation output against all 40 keys in SEP-0005 Test Vectors 3 and 4.
        </p>
      </header>

      <div class="info-grid">
        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">Source code</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Read the TypeScript source, run the SEP-0005 Vitest suite, or compile the single-file
            offline HTML bundle locally.
          </p>
          <a
            class="btn"
            href="https://github.com/syntaxval/aphelion"
            target="_blank"
            rel="noopener noreferrer"
          >
            syntaxval/aphelion on GitHub
          </a>
        </article>

        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">Legacy predecessor</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Aphelion replaces the original Redshift Stellar HD generator. The older repository
            remains online for historical reference.
          </p>
          <a
            class="btn"
            href="https://github.com/stellar-fox/redshift"
            target="_blank"
            rel="noopener noreferrer"
          >
            stellar-fox/redshift on GitHub
          </a>
        </article>
      </div>

      <section class="card">
        <h2 class="card-title">Standards and security reading</h2>
        <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "1.25rem", lineHeight: 1.9, marginBottom: 0 }}>
          <li>
            <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md" target="_blank" rel="noopener noreferrer">
              SEP-0005: Key Derivation Methods for Stellar Keys
            </a>
          </li>
          <li>
            <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0023.md" target="_blank" rel="noopener noreferrer">
              SEP-0023: StrKey Encoding (Base32 and CRC16-XModem)
            </a>
          </li>
          <li>
            <a href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" target="_blank" rel="noopener noreferrer">
              BIP-0039: Mnemonic Code for Generating Deterministic Keys
            </a>
          </li>
          <li>
            <a href="https://github.com/satoshilabs/slips/blob/master/slip-0010.md" target="_blank" rel="noopener noreferrer">
              SLIP-0010: Universal Private Key Derivation for Ed25519
            </a>
          </li>
          <li>
            <a href="https://www.schneier.com/blog/archives/2013/10/air_gaps.html" target="_blank" rel="noopener noreferrer">
              Bruce Schneier: Air Gaps and Cold Storage
            </a>
          </li>
          <li>
            <a href="https://github.com/paulmillr/noble-hashes" target="_blank" rel="noopener noreferrer">
              @noble and @scure Cryptography Libraries
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
