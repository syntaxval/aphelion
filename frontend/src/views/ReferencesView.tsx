export function ReferencesView() {
  return (
    <div>
      <header class="hero">
        <h1>References &amp; Specifications</h1>
        <p>
          Aphelion is open-source software licensed under Apache 2.0 and verified against official
          Stellar SEP-0005 test vectors.
        </p>
      </header>

      <div class="info-grid">
        <article class="card" style={{ marginBottom: 0 }}>
          <h2 class="card-title">Source Code</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Inspect the source, verify the SEP-0005 test suite, or build the single-file offline
            bundle yourself from source.
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
          <h2 class="card-title">Historical Predecessor</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Aphelion is the modernized successor to the original Stellar HD generator project
            Redshift, preserved for historical reference.
          </p>
          <a
            class="btn"
            href="https://github.com/stellar-fox/redshift"
            target="_blank"
            rel="noopener noreferrer"
          >
            Legacy stellar-fox/redshift
          </a>
        </article>
      </div>

      <section class="card">
        <h2 class="card-title">Cryptographic Standards &amp; Security Reading</h2>
        <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "1.25rem", lineHeight: 1.9, marginBottom: 0 }}>
          <li>
            <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md" target="_blank" rel="noopener noreferrer">
              SEP-0005 — Key Derivation Methods for Stellar Keys
            </a>
          </li>
          <li>
            <a href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0023.md" target="_blank" rel="noopener noreferrer">
              SEP-0023 — StrKey Encoding (Base32 + CRC16-XModem)
            </a>
          </li>
          <li>
            <a href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki" target="_blank" rel="noopener noreferrer">
              BIP-0039 — Mnemonic Code for Generating Deterministic Keys
            </a>
          </li>
          <li>
            <a href="https://github.com/satoshilabs/slips/blob/master/slip-0010.md" target="_blank" rel="noopener noreferrer">
              SLIP-0010 — Universal Private Key Derivation from Master Private Key (Ed25519)
            </a>
          </li>
          <li>
            <a href="https://www.schneier.com/blog/archives/2013/10/air_gaps.html" target="_blank" rel="noopener noreferrer">
              Bruce Schneier — Air Gaps &amp; Cold Storage Security
            </a>
          </li>
          <li>
            <a href="https://github.com/paulmillr/noble-hashes" target="_blank" rel="noopener noreferrer">
              @noble / @scure Audited Cryptography Suite
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
