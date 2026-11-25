import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { clearClipboardText, writeClipboardText } from "./lib/clipboard";
import { IconOrbit, IconTrash } from "./lib/icons";
import { useRoute } from "./lib/router";
import { AboutView } from "./views/AboutView";
import { ReferencesView } from "./views/ReferencesView";
import { VaultView } from "./views/VaultView";

const IDLE_WIPE_SECONDS = 300; // 5 minutes
const CLIPBOARD_CLEAR_SECONDS = 30;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function App() {
  const [route, navigate] = useRoute();
  const [vaultActive, setVaultActive] = useState(false);
  const [wipeSignal, setWipeSignal] = useState(0);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(IDLE_WIPE_SECONDS);

  // Clipboard countdown state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clipboardSecondsLeft, setClipboardSecondsLeft] = useState<number>(0);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const lastAnnouncementRef = useRef("");

  const announce = useCallback((msg: string) => {
    const next = msg === lastAnnouncementRef.current ? `${msg}\u00A0` : msg;
    lastAnnouncementRef.current = next;
    setStatusAnnouncement(next);
  }, []);

  const triggerWipe = useCallback(() => {
    setWipeSignal((n) => n + 1);
    setIdleSecondsLeft(IDLE_WIPE_SECONDS);
    if (clipboardSecondsLeft > 0) {
      void clearClipboardText();
      setClipboardSecondsLeft(0);
    }
    announce("Vault wiped from memory");
  }, [clipboardSecondsLeft, announce]);

  // 5-minute idle auto-wipe countdown while vault is active
  useEffect(() => {
    if (!vaultActive) {
      setIdleSecondsLeft(IDLE_WIPE_SECONDS);
      return;
    }

    const resetIdle = () => setIdleSecondsLeft(IDLE_WIPE_SECONDS);
    window.addEventListener("pointerdown", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle, { passive: true });

    const interval = window.setInterval(() => {
      setIdleSecondsLeft((prev) => {
        if (prev <= 1) {
          triggerWipe();
          return IDLE_WIPE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.clearInterval(interval);
    };
  }, [vaultActive, triggerWipe]);

  // 30-second clipboard auto-clear countdown
  useEffect(() => {
    if (clipboardSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setClipboardSecondsLeft((prev) => {
        if (prev <= 1) {
          void clearClipboardText();
          announce("Clipboard cleared");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [clipboardSecondsLeft, announce]);

  const handleCopy = useCallback(
    async (value: string, keyId: string, isSecret: boolean) => {
      const ok = await writeClipboardText(value);
      if (ok) {
        setCopiedKey(keyId);
        announce(isSecret ? "Secret copied; clipboard will clear in 30 seconds" : "Copied");
        if (isSecret) {
          setClipboardSecondsLeft(CLIPBOARD_CLEAR_SECONDS);
        }
        window.setTimeout(() => {
          setCopiedKey((curr) => (curr === keyId ? null : curr));
        }, 2000);
      } else {
        announce("Copy failed");
      }
    },
    [announce]
  );

  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <button type="button" class="brand" onClick={() => navigate("vault")}>
            <IconOrbit />
            <span class="brand-name">APHELION</span>
            <span class="brand-tag">Stellar Cold Vault</span>
          </button>

          <nav class="nav-pills" aria-label="Primary navigation">
            <button
              type="button"
              class="nav-pill"
              aria-current={route === "vault" ? "page" : undefined}
              onClick={() => navigate("vault")}
            >
              Vault
            </button>
            <button
              type="button"
              class="nav-pill"
              aria-current={route === "about" ? "page" : undefined}
              onClick={() => navigate("about")}
            >
              About &amp; Audit
            </button>
            <button
              type="button"
              class="nav-pill"
              aria-current={route === "references" ? "page" : undefined}
              onClick={() => navigate("references")}
            >
              References
            </button>
          </nav>

          <div class="topbar-right">
            <span class="offline-badge" title="Strict CSP connect-src 'none' — zero network calls">
              <span class="offline-dot" />
              Zero Network
            </span>
            {vaultActive && (
              <button
                type="button"
                class="btn btn-sm btn-danger"
                onClick={triggerWipe}
                title="Immediately wipe keys & seed from memory"
              >
                <IconTrash /> Wipe ({formatTimer(idleSecondsLeft)})
              </button>
            )}
          </div>
        </div>
      </header>

      <main class="main-container">
        {route === "vault" && (
          <VaultView
            onCopySecret={handleCopy}
            copiedKey={copiedKey}
            onVaultActiveChange={setVaultActive}
            wipeSignal={wipeSignal}
          />
        )}
        {route === "about" && <AboutView />}
        {route === "references" && <ReferencesView />}
      </main>

      <footer class="footer">
        <div class="footer-inner">
          <span>
            <strong>Aphelion</strong> v1.0.0 · Apache-2.0 ·{" "}
            <a href="https://github.com/syntaxval/aphelion" target="_blank" rel="noopener noreferrer">
              syntaxval/aphelion
            </a>
          </span>
          <span>BIP39 · SLIP-0010 · SEP-0005 · SEP-0023 · 4 Runtime Deps</span>
        </div>
      </footer>

      {clipboardSecondsLeft > 0 && (
        <div class="clipboard-toast" role="status">
          <span>
            Secret in clipboard · clears in <strong>{clipboardSecondsLeft}s</strong>
          </span>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            onClick={() => {
              void clearClipboardText();
              setClipboardSecondsLeft(0);
              announce("Clipboard cleared");
            }}
          >
            Clear Now
          </button>
        </div>
      )}

      <span class="sr-only" role="status" aria-live="polite">
        {statusAnnouncement}
      </span>
    </div>
  );
}
