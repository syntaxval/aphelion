import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  deriveAccounts,
  deriveKeypair,
  ENTROPY,
  formatDerivationPath,
  generateMnemonic,
  getWordlist,
  LANGUAGE,
  MAX_ACCOUNT_INDEX,
  mnemonicToSeed,
  splitMnemonicWords,
  validateMnemonic,
  zeroBytes,
  type DerivedAccount,
  type EntropyBits,
  type Language,
} from "@syntaxval/aphelion";
import { KeyDialog } from "../components/KeyDialog";
import { PrintDialog } from "../components/PrintDialog";
import { QrDialog } from "../components/QrDialog";
import {
  IconCheck,
  IconCopy,
  IconDice,
  IconEye,
  IconKey,
  IconPrint,
  IconQr,
  IconShield,
  IconTrash,
} from "../lib/icons";
import { encodeQrMatrix, qrToSvgPath } from "../lib/qr";

const LANGUAGES: Array<{ code: Language; label: string }> = [
  { code: LANGUAGE.EN, label: "English" },
  { code: LANGUAGE.SP, label: "Español" },
  { code: LANGUAGE.FR, label: "Français" },
  { code: LANGUAGE.IT, label: "Italiano" },
  { code: LANGUAGE.JP, label: "日本語" },
  { code: LANGUAGE.CN, label: "中文 (简体)" },
  { code: LANGUAGE.CT, label: "中文 (繁體)" },
  { code: LANGUAGE.KR, label: "한국어" },
];

interface VaultViewProps {
  onCopySecret: (value: string, label: string, isSecret: boolean) => void;
  copiedKey: string | null;
  onVaultActiveChange: (active: boolean) => void;
  wipeSignal: number;
}

interface QrTarget {
  title: string;
  subtitle?: string;
  value: string;
  isSecret?: boolean;
}

function destroyAccounts(accounts: DerivedAccount[]): void {
  for (const acc of accounts) {
    acc.keypair.destroy();
  }
}

function abbreviateKeyCompact(key: string): string {
  if (key.length <= 8) return key;
  return `${key.slice(0, 3)} ...`;
}

function abbreviateKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 4)} ... ${key.slice(-4)}`;
}

export function VaultView({
  onCopySecret,
  copiedKey,
  onVaultActiveChange,
  wipeSignal,
}: VaultViewProps) {
  const [mode, setMode] = useState<"generate" | "restore">("generate");
  const [language, setLanguage] = useState<Language>(LANGUAGE.EN);
  const [entropyBits, setEntropyBits] = useState<EntropyBits>(ENTROPY.BITS_256);
  const [userEntropy, setUserEntropy] = useState("");

  // Restore input
  const [restoreInput, setRestoreInput] = useState("");

  // Active vault state
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [checksumInvalid, setChecksumInvalid] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);

  // Derived HD accounts
  const seedRef = useRef<Uint8Array | null>(null);
  const [accounts, setAccounts] = useState<DerivedAccount[]>([]);
  const [customIndexInput, setCustomIndexInput] = useState("");
  const [customIndexError, setCustomIndexError] = useState<string | null>(null);

  // Backup Verification Quiz
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizIndices, setQuizIndices] = useState<number[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizPassed, setQuizPassed] = useState(false);

  // Modals
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);
  const [keyTarget, setKeyTarget] = useState<(QrTarget & { copyId: string }) | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [includeSecretOnPaper, setIncludeSecretOnPaper] = useState(false);

  const wipeVault = useCallback(() => {
    setAccounts((prev) => {
      destroyAccounts(prev);
      return [];
    });
    if (seedRef.current) {
      zeroBytes(seedRef.current);
      seedRef.current = null;
    }
    setMnemonic(null);
    setChecksumInvalid(false);
    setPassphrase("");
    setShowPassphrase(false);
    setMnemonicRevealed(false);
    setRestoreInput("");
    setUserEntropy("");
    setCustomIndexInput("");
    setCustomIndexError(null);
    setQuizOpen(false);
    setQuizIndices([]);
    setQuizAnswers({});
    setQuizPassed(false);
    setQrTarget(null);
    setKeyTarget(null);
    setPrintOpen(false);
  }, []);

  // Wipe when parent triggers idle/manual wipe
  useEffect(() => {
    if (wipeSignal > 0) {
      wipeVault();
    }
  }, [wipeSignal, wipeVault]);

  // Report active state to App shell
  useEffect(() => {
    onVaultActiveChange(mnemonic !== null);
  }, [mnemonic, onVaultActiveChange]);

  // Auto-mask on tab switch & wipe on unmount / page unload
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setMnemonicRevealed(false);
        setShowPassphrase(false);
        setQrTarget(null);
        setKeyTarget(null);
      }
    };
    const onBeforeUnload = () => {
      if (seedRef.current) {
        zeroBytes(seedRef.current);
        seedRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (seedRef.current) {
        zeroBytes(seedRef.current);
        seedRef.current = null;
      }
    };
  }, []);

  // Derive accounts whenever mnemonic or passphrase changes
  const deriveFromMnemonic = useCallback((phrase: string, pass: string, indices: number[] = [0]) => {
    const nextSeed = mnemonicToSeed(phrase, pass);
    if (seedRef.current) {
      zeroBytes(seedRef.current);
    }
    seedRef.current = nextSeed;

    const nextAccounts = indices.map((idx) => ({
      index: idx,
      path: formatDerivationPath(idx),
      keypair: deriveKeypair(nextSeed, idx),
    }));
    setAccounts((prev) => {
      destroyAccounts(prev);
      return nextAccounts;
    });
  }, []);

  const handleGenerate = () => {
    const generated = generateMnemonic(
      language,
      entropyBits,
      userEntropy.trim() ? userEntropy : undefined
    );
    setMnemonic(generated);
    setChecksumInvalid(false);
    setMnemonicRevealed(false);
    setUserEntropy("");
    setPassphrase("");
    setQuizOpen(false);
    setQuizPassed(false);
    deriveFromMnemonic(generated, "", [0]);
  };

  // Restore live validation
  const wordlistSet = useMemo(() => new Set(getWordlist(language)), [language]);
  const restoreWords = useMemo(() => splitMnemonicWords(restoreInput), [restoreInput]);
  const invalidRestoreWords = useMemo(
    () => restoreWords.filter((w) => !wordlistSet.has(w)),
    [restoreWords, wordlistSet]
  );
  const restoreWordCountOk = restoreWords.length === 12 || restoreWords.length === 24;
  const restoreChecksumOk = useMemo(
    () => (restoreWordCountOk ? validateMnemonic(restoreInput, language) : false),
    [restoreInput, language, restoreWordCountOk]
  );

  const handleRestore = () => {
    if (!restoreWordCountOk) return;
    const normalized = restoreWords.join(language === LANGUAGE.JP ? "\u3000" : " ");
    const valid = validateMnemonic(normalized, language);
    setMnemonic(normalized);
    setChecksumInvalid(!valid);
    setMnemonicRevealed(false);
    setRestoreInput("");
    setPassphrase("");
    setQuizOpen(false);
    setQuizPassed(false);
    deriveFromMnemonic(normalized, "", [0]);
  };

  const handlePassphraseChange = (next: string) => {
    setPassphrase(next);
    if (mnemonic) {
      const currentIndices = accounts.length > 0 ? accounts.map((a) => a.index) : [0];
      deriveFromMnemonic(mnemonic, next, currentIndices);
    }
  };

  const handleLoadMore = () => {
    if (!seedRef.current) return;
    const maxExisting = accounts.reduce((m, a) => Math.max(m, a.index), -1);
    const start = maxExisting + 1;
    if (start > MAX_ACCOUNT_INDEX) return;
    const count = Math.min(5, MAX_ACCOUNT_INDEX - start + 1);
    const more = deriveAccounts(seedRef.current, start, count);
    setAccounts((prev) => [...prev, ...more]);
  };

  const handleJumpToIndex = (e: Event) => {
    e.preventDefault();
    if (!seedRef.current) return;
    const parsed = Number(customIndexInput.trim());
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_ACCOUNT_INDEX) {
      setCustomIndexError(`Enter an integer between 0 and ${MAX_ACCOUNT_INDEX.toLocaleString()}.`);
      return;
    }
    setCustomIndexError(null);
    if (accounts.some((a) => a.index === parsed)) {
      setCustomIndexInput("");
      return;
    }
    const kp = deriveKeypair(seedRef.current, parsed);
    setAccounts((prev) => [
      ...prev,
      { index: parsed, path: formatDerivationPath(parsed), keypair: kp },
    ]);
    setCustomIndexInput("");
  };

  const startBackupQuiz = () => {
    if (!mnemonic) return;
    const words = splitMnemonicWords(mnemonic);
    const picked = new Set<number>();
    const rand = new Uint32Array(1);
    while (picked.size < 3) {
      globalThis.crypto.getRandomValues(rand);
      picked.add(rand[0]! % words.length);
    }
    setQuizIndices(Array.from(picked).sort((a, b) => a - b));
    setQuizAnswers({});
    setQuizPassed(false);
    setQuizOpen(true);
    setMnemonicRevealed(false);
  };

  const mnemonicWords = useMemo(
    () => (mnemonic ? splitMnemonicWords(mnemonic) : []),
    [mnemonic]
  );

  const checkQuiz = () => {
    const allCorrect = quizIndices.every((idx) => {
      const expected = mnemonicWords[idx]?.normalize("NFKD").trim();
      const actual = (quizAnswers[idx] || "").normalize("NFKD").trim();
      return expected !== undefined && expected === actual;
    });
    setQuizPassed(allCorrect);
  };

  const appendDiceRoll = (face: number) => {
    setUserEntropy((prev) => (prev + String(face)).slice(0, 256));
  };

  const entropyEstimateBits = Math.min(256, Math.round(userEntropy.trim().length * 2.58));

  // Paper wallet QR data for Account #0
  const primaryAccount = accounts[0] ?? null;
  const paperPublicQr = useMemo(() => {
    if (!primaryAccount) return null;
    return qrToSvgPath(encodeQrMatrix(primaryAccount.keypair.publicKey()), 3);
  }, [primaryAccount]);

  const paperSecretQr = useMemo(() => {
    if (!primaryAccount || !includeSecretOnPaper || primaryAccount.keypair.isDestroyed) return null;
    return qrToSvgPath(encodeQrMatrix(primaryAccount.keypair.secret()), 3);
  }, [primaryAccount, includeSecretOnPaper]);

  return (
    <div>
      <div class="screen-only">
        <header class="hero">
          <h1>Stellar Cold Key Vault</h1>
          <p>
            Deterministic BIP39 &amp; SEP-0005 key derivation running 100% locally in memory with
            zero network calls and explicit byte zeroing.
          </p>
        </header>

        <div class="banner banner-warn" role="note">
          <IconShield />
          <div>
            <strong>Cold Storage Warning:</strong> Anyone with your recovery phrase or secret key
            controls your Stellar assets. Never share them, and for high-value accounts run the
            single-file offline build on an air-gapped machine.
          </div>
        </div>

        {/* Empty State: Generate or Restore */}
        {!mnemonic && (
          <section class="card">
            <div class="segmented segmented-full" role="group" aria-label="Vault mode">
              <button
                type="button"
                aria-pressed={mode === "generate"}
                onClick={() => setMode("generate")}
              >
                Generate New
              </button>
              <button
                type="button"
                aria-pressed={mode === "restore"}
                onClick={() => setMode("restore")}
              >
                Restore Phrase
              </button>
            </div>

            <fieldset class="fieldset-clean">
              <legend>Mnemonic Language (BIP39)</legend>
              <div class="lang-grid">
                {LANGUAGES.map((lang) => (
                  <label class="lang-pill" key={lang.code}>
                    <input
                      type="radio"
                      name="bip39-language"
                      value={lang.code}
                      checked={language === lang.code}
                      onChange={() => setLanguage(lang.code)}
                    />
                    <span>{lang.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {mode === "generate" ? (
              <div>
                <fieldset class="fieldset-clean">
                  <legend>Entropy Strength</legend>
                  <div class="segmented" role="group" aria-label="Entropy strength">
                    <button
                      type="button"
                      aria-pressed={entropyBits === ENTROPY.BITS_256}
                      onClick={() => setEntropyBits(ENTROPY.BITS_256)}
                    >
                      24 Words · 256-bit
                    </button>
                    <button
                      type="button"
                      aria-pressed={entropyBits === ENTROPY.BITS_128}
                      onClick={() => setEntropyBits(ENTROPY.BITS_128)}
                    >
                      12 Words · 128-bit
                    </button>
                  </div>
                </fieldset>

                <details class="entropy-details">
                  <summary>
                    <IconDice /> Optional: Mix Custom Entropy (Dice Rolls / Keystrokes)
                  </summary>
                  <div class="entropy-body">
                    <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      Mixed with your browser's CSPRNG via SHA-256 so your input can only{" "}
                      <em>add</em> unpredictability and never weaken randomness. On mobile, tap the
                      Dice buttons below instead of typing to avoid soft keyboards that run cloud
                      telemetry on typed text.
                    </p>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                      {[1, 2, 3, 4, 5, 6].map((face) => (
                        <button
                          key={face}
                          type="button"
                          class="btn btn-sm"
                          onClick={() => appendDiceRoll(face)}
                          aria-label={`Add dice roll ${face}`}
                        >
                          Dice {face}
                        </button>
                      ))}
                      {userEntropy && (
                        <button
                          type="button"
                          class="btn btn-sm btn-danger"
                          onClick={() => setUserEntropy("")}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      class="input"
                      autocomplete="off"
                      spellcheck={false}
                      placeholder="Tap dice buttons above or type random characters..."
                      value={userEntropy}
                      onInput={(e) => setUserEntropy((e.target as HTMLInputElement).value)}
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <div class="entropy-meter" aria-hidden="true">
                      <div
                        class="entropy-meter-fill"
                        style={{ width: `${Math.min(100, (entropyEstimateBits / 256) * 100)}%` }}
                      />
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                      Extra user entropy: ~{entropyEstimateBits} bits (combined with full {entropyBits}-bit CSPRNG)
                    </div>
                  </div>
                </details>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
                  <button type="button" class="btn btn-primary btn-generate" onClick={handleGenerate}>
                    <IconKey /> Generate {entropyBits === 256 ? "24-Word" : "12-Word"} Cold Vault
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label class="field-label" for="restore-phrase-input">
                  Enter 12 or 24-Word Recovery Phrase
                </label>
                <textarea
                  id="restore-phrase-input"
                  class="textarea"
                  rows={4}
                  autocomplete="off"
                  spellcheck={false}
                  autocorrect="off"
                  autocapitalize="off"
                  placeholder="Type or paste your 12 or 24 BIP39 words separated by spaces..."
                  value={restoreInput}
                  onInput={(e) => setRestoreInput((e.target as HTMLTextAreaElement).value)}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginTop: "0.55rem",
                    fontSize: "0.82rem",
                  }}
                >
                  <span style={{ color: restoreWordCountOk ? "var(--status-safe)" : "var(--text-secondary)" }}>
                    Words: <strong>{restoreWords.length}</strong> (expected 12 or 24)
                  </span>
                  {restoreWordCountOk && (
                    <span class={restoreChecksumOk ? "chip chip-safe" : "chip chip-danger"}>
                      {restoreChecksumOk ? "BIP39 Checksum Valid" : "Checksum Invalid"}
                    </span>
                  )}
                </div>

                {invalidRestoreWords.length > 0 && (
                  <div style={{ marginTop: "0.65rem" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--status-danger)" }}>
                      Not in {LANGUAGES.find((l) => l.code === language)?.label} BIP39 wordlist:
                    </div>
                    <div class="chip-list">
                      {invalidRestoreWords.slice(0, 8).map((word, idx) => (
                        <span class="chip chip-danger" key={`${word}-${idx}`}>
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                  <button
                    type="button"
                    class="btn btn-primary"
                    disabled={!restoreWordCountOk}
                    onClick={handleRestore}
                  >
                    Restore Vault Keys
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Active Vault Workspace */}
        {mnemonic && (
          <div>
            {checksumInvalid && (
              <div class="banner banner-danger" role="alert">
                <strong>Checksum Invalid:</strong> The restored phrase did not pass BIP39 checksum
                validation. Double-check for typos or wrong language selection. Accounts below are
                still deterministically derived from the exact words entered.
              </div>
            )}

            {/* Recovery Phrase Card */}
            <section class="card">
              <div class="card-header">
                <h2 class="card-title">
                  Recovery Phrase{" "}
                  <span class="path-badge">
                    {mnemonicWords.length} words · {mnemonicWords.length === 24 ? "256-bit" : "128-bit"}
                  </span>
                </h2>
                <div class="card-actions">
                  <button
                    type="button"
                    class="btn btn-sm"
                    onClick={() => setMnemonicRevealed((v) => !v)}
                  >
                    <IconEye open={mnemonicRevealed} />
                    {mnemonicRevealed ? "Mask" : "Reveal"}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm"
                    onClick={() => onCopySecret(mnemonic, "mnemonic", true)}
                  >
                    <IconCopy copied={copiedKey === "mnemonic"} />
                    {copiedKey === "mnemonic" ? "Copied" : "Copy"}
                  </button>
                  <button type="button" class="btn btn-sm" onClick={startBackupQuiz}>
                    <IconCheck /> {quizPassed ? "Verified" : "Verify Backup"}
                  </button>
                  <button type="button" class="btn btn-sm" onClick={() => setPrintOpen(true)}>
                    <IconPrint /> Paper Wallet
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onClick={wipeVault}>
                    <IconTrash /> Wipe
                  </button>
                </div>
              </div>

              <div class="mnemonic-stage">
                {!mnemonicRevealed && (
                  <div class="mask-overlay">
                    <button
                      type="button"
                      class="btn btn-primary"
                      onClick={() => setMnemonicRevealed(true)}
                    >
                      <IconEye open={false} /> Click to Reveal Recovery Phrase
                    </button>
                  </div>
                )}
                <div
                  class={`mnemonic-grid ${mnemonicRevealed ? "" : "masked"}`}
                  aria-hidden={!mnemonicRevealed}
                >
                  {mnemonicWords.map((word, i) => (
                    <div class="mnemonic-cell" key={i}>
                      <span class="mnemonic-idx">{String(i + 1).padStart(2, "0")}</span>
                      <span class="mnemonic-word">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Backup Verification Quiz */}
              {quizOpen && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Confirm Your Written Backup</strong>
                    <button type="button" class="btn btn-sm" onClick={() => setQuizOpen(false)}>
                      Dismiss
                    </button>
                  </div>
                  <div class="quiz-grid">
                    {quizIndices.map((idx) => (
                      <div key={idx}>
                        <label class="field-label" for={`quiz-word-${idx}`}>
                          Word #{idx + 1}
                        </label>
                        <input
                          id={`quiz-word-${idx}`}
                          type="text"
                          class="input"
                          autocomplete="off"
                          spellcheck={false}
                          value={quizAnswers[idx] || ""}
                          onInput={(e) =>
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [idx]: (e.target as HTMLInputElement).value,
                            }))
                          }
                          style={{ fontFamily: "var(--font-mono)" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button type="button" class="btn btn-primary" onClick={checkQuiz}>
                      Verify Words
                    </button>
                    {quizPassed && (
                      <span class="chip chip-safe">Backup Confirmed! All 3 words match.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Optional BIP39 Passphrase */}
              <form
                onSubmit={(e) => e.preventDefault()}
                autocomplete="off"
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <input
                  type="text"
                  name="username"
                  autocomplete="username"
                  value="aphelion-bip39-passphrase"
                  readOnly
                  hidden
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <label class="field-label" for="passphrase-input">
                  Optional BIP39 passphrase (25th word, changes all derived accounts)
                </label>
                <div class="input-row">
                  <input
                    id="passphrase-input"
                    type={showPassphrase ? "text" : "password"}
                    class="input"
                    autocomplete="new-password"
                    spellcheck={false}
                    placeholder="Leave blank for standard derivation..."
                    value={passphrase}
                    onInput={(e) => handlePassphraseChange((e.target as HTMLInputElement).value)}
                  />
                  <button
                    type="button"
                    class="btn"
                    onClick={() => setShowPassphrase((v) => !v)}
                    aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                  >
                    <IconEye open={showPassphrase} />
                  </button>
                </div>
              </form>
            </section>

            {/* Derived HD Accounts */}
            <section class="card">
              <div class="card-header">
                <h2 class="card-title">Derived Stellar Accounts</h2>
                <div class="card-actions">
                  <form onSubmit={handleJumpToIndex} style={{ display: "flex", gap: "0.4rem" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      class="input"
                      aria-label="Jump to account index"
                      placeholder="Index (e.g. 42)"
                      value={customIndexInput}
                      onInput={(e) => setCustomIndexInput((e.target as HTMLInputElement).value)}
                      style={{ width: "130px", padding: "0.35rem 0.6rem", fontSize: "0.82rem" }}
                    />
                    <button type="submit" class="btn btn-sm">
                      Derive
                    </button>
                  </form>
                  <button type="button" class="btn btn-sm" onClick={handleLoadMore}>
                    +5 Accounts
                  </button>
                </div>
              </div>

              {customIndexError && (
                <div class="banner banner-danger" style={{ marginBottom: "0.75rem" }}>
                  {customIndexError}
                </div>
              )}

              <div class="account-list">
                {accounts.map((acc) => {
                  const pub = acc.keypair.publicKey();
                  const sec = acc.keypair.isDestroyed ? "" : acc.keypair.secret();
                  const pubCopyId = `pub-${acc.index}`;
                  const secCopyId = `sec-${acc.index}`;

                  return (
                    <div class="account-row" key={acc.index}>
                      <div class="account-row-top">
                        <strong>Account #{acc.index}</strong>
                        <span class="path-badge">{acc.path}</span>
                      </div>

                      <div class="key-line">
                        <span class="key-label">Public</span>
                        <span class="key-value">
                          <span class="key-abbr-full">{abbreviateKey(pub)}</span>
                          <span class="key-abbr-compact">{abbreviateKeyCompact(pub)}</span>
                        </span>
                        <div class="key-actions">
                          <button
                            type="button"
                            class="btn btn-icon"
                            aria-label={`Reveal full account ${acc.index} public key`}
                            onClick={() =>
                              setKeyTarget({
                                title: `Account #${acc.index} Public Key`,
                                subtitle: acc.path,
                                value: pub,
                                isSecret: false,
                                copyId: pubCopyId,
                              })
                            }
                          >
                            <IconEye open={false} />
                          </button>
                          <button
                            type="button"
                            class="btn btn-icon"
                            aria-label={`Copy account ${acc.index} public key`}
                            onClick={() => onCopySecret(pub, pubCopyId, false)}
                          >
                            <IconCopy copied={copiedKey === pubCopyId} />
                          </button>
                          <button
                            type="button"
                            class="btn btn-icon"
                            aria-label={`Show account ${acc.index} public key QR code`}
                            onClick={() =>
                              setQrTarget({
                                title: `Account #${acc.index} Public Key`,
                                subtitle: acc.path,
                                value: pub,
                                isSecret: false,
                              })
                            }
                          >
                            <IconQr />
                          </button>
                        </div>
                      </div>

                      <div class="key-line">
                        <span class="key-label">Secret</span>
                        <span class="key-value secret-masked">
                          <span class="key-abbr-full">{abbreviateKey(sec)}</span>
                          <span class="key-abbr-compact">{abbreviateKeyCompact(sec)}</span>
                        </span>
                        <div class="key-actions">
                          <button
                            type="button"
                            class="btn btn-icon"
                            aria-label={`Reveal full account ${acc.index} secret key`}
                            onClick={() =>
                              setKeyTarget({
                                title: `Account #${acc.index} Secret Key`,
                                subtitle: acc.path,
                                value: sec,
                                isSecret: true,
                                copyId: secCopyId,
                              })
                            }
                          >
                            <IconEye open={false} />
                          </button>
                          <button
                            type="button"
                            class="btn btn-icon"
                            aria-label={`Copy account ${acc.index} secret key`}
                            onClick={() => onCopySecret(sec, secCopyId, true)}
                          >
                            <IconCopy copied={copiedKey === secCopyId} />
                          </button>
                          <button
                            type="button"
                            class="btn btn-icon"
                            aria-label={`Show account ${acc.index} secret key QR code`}
                            onClick={() =>
                              setQrTarget({
                                title: `Account #${acc.index} Secret Key`,
                                subtitle: acc.path,
                                value: sec,
                                isSecret: true,
                              })
                            }
                          >
                            <IconQr />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Print-Only Paper Wallet Sheet */}
      {mnemonic && primaryAccount && (
        <section class="print-only paper-sheet">
          <div class="paper-header">
            <h1>Aphelion Stellar Paper Wallet</h1>
            <div class="paper-meta">
              Standard: BIP39 + SLIP-0010 + SEP-0005 ({formatDerivationPath(0)})
            </div>
          </div>

          <h2 style={{ fontSize: "11pt", margin: "0 0 6px" }}>
            Recovery Phrase ({mnemonicWords.length} Words)
          </h2>
          <div class="paper-words">
            {mnemonicWords.map((word, idx) => (
              <div class="paper-word" key={idx}>
                <span>{String(idx + 1).padStart(2, "0")}.</span>
                {word}
              </div>
            ))}
          </div>

          <div class="paper-keys">
            <div class="paper-key-box">
              <h3>Account #0 Public Key ({primaryAccount.path})</h3>
              {paperPublicQr && (
                <svg viewBox={`0 0 ${paperPublicQr.viewBoxSize} ${paperPublicQr.viewBoxSize}`}>
                  <rect width={paperPublicQr.viewBoxSize} height={paperPublicQr.viewBoxSize} fill="#fff" />
                  <path d={paperPublicQr.d} fill="#000" />
                </svg>
              )}
              <div class="paper-key-code">{primaryAccount.keypair.publicKey()}</div>
            </div>

            {includeSecretOnPaper && paperSecretQr && !primaryAccount.keypair.isDestroyed && (
              <div class="paper-key-box">
                <h3>Account #0 Secret Key (KEEP PRIVATE)</h3>
                <svg viewBox={`0 0 ${paperSecretQr.viewBoxSize} ${paperSecretQr.viewBoxSize}`}>
                  <rect width={paperSecretQr.viewBoxSize} height={paperSecretQr.viewBoxSize} fill="#fff" />
                  <path d={paperSecretQr.d} fill="#000" />
                </svg>
                <div class="paper-key-code">{primaryAccount.keypair.secret()}</div>
              </div>
            )}
          </div>

          {passphrase && (
            <div class="paper-note">
              <strong>Passphrase notice:</strong> A BIP39 passphrase was active when generating this
              sheet. For security, the passphrase is not printed here. Store it separately to
              recover these accounts.
            </div>
          )}
        </section>
      )}

      <QrDialog
        title={qrTarget?.title || ""}
        subtitle={qrTarget?.subtitle}
        value={qrTarget?.value || null}
        isSecret={qrTarget?.isSecret}
        onClose={() => setQrTarget(null)}
      />

      <KeyDialog
        title={keyTarget?.title || ""}
        subtitle={keyTarget?.subtitle}
        value={keyTarget?.value || null}
        isSecret={keyTarget?.isSecret}
        copied={keyTarget ? copiedKey === keyTarget.copyId : false}
        onCopy={() => {
          if (keyTarget) {
            onCopySecret(keyTarget.value, keyTarget.copyId, Boolean(keyTarget.isSecret));
          }
        }}
        onClose={() => setKeyTarget(null)}
      />

      <PrintDialog
        open={printOpen}
        includeSecretOnPaper={includeSecretOnPaper}
        hasPassphrase={passphrase.length > 0}
        onToggleSecret={setIncludeSecretOnPaper}
        onClose={() => setPrintOpen(false)}
        onConfirmPrint={() => {
          setPrintOpen(false);
          setTimeout(() => window.print(), 80);
        }}
      />
    </div>
  );
}
