/**
 * Safe clipboard helper with file:// fallback and 30-second auto-clear support.
 */

function legacyCopy(text: string): boolean {
  const previousFocus = document.activeElement as HTMLElement | null;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;inset-block-start:0;opacity:0;pointer-events:none;";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.value = "";
    field.remove();
    previousFocus?.focus?.({ preventScroll: true });
  }
}

export async function writeClipboardText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for file:// or denied secure context
    }
  }
  return legacyCopy(text);
}

export async function clearClipboardText(): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText("");
      return;
    } catch {
      // ignore if unfocused
    }
  }
  legacyCopy(" ");
}
