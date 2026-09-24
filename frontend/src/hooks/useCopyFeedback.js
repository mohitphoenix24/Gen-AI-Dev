import { useState } from "react";

/**
 * Shared "click to copy, briefly show a confirmation" behavior, used by the
 * code-block copy button and the per-message copy action.
 */
export function useCopyFeedback(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard access denied - fail quietly, text is still selectable
    }
    setCopied(true);
    setTimeout(() => setCopied(false), timeoutMs);
  }

  return [copied, copy];
}
